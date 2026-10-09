import {
  Inject,
  Injectable,
  InjectionToken,
  NgZone,
  Optional,
} from '@angular/core';
import {
  buildIntentSchema,
  buildSystemPrompt,
  keywordFallback,
  sanitizeRequest,
  validateIntent,
  isConceptQuestion,
  hasDefinitionalPhrasing,
  findKnowledge,
  getKnowledgeEntry,
  detectQuestionIntent,
  selectFacet,
  suggestCommand,
  suggestKnowledge,
  deriveCommandEntries,
  KNOWLEDGE_BASE,
  type KnowledgeEntry,
  type EnumSources,
} from 'phoenix-event-display';
import { EventDisplayService } from './event-display.service';

/** Model-loading progress (0..1) with a human-readable label. */
export interface NlProgress {
  /** Fraction complete, 0..1. */
  progress: number;
  /** Status text from the engine (e.g. "Fetching param cache[3/50]"). */
  text: string;
}

/**
 * A natural-language engine: turns a user request into a parsed intent object,
 * constrained by the given JSON schema. Implemented by the lazy WebLLM wrapper;
 * the service depends only on this interface so it stays testable and never
 * imports the heavy engine.
 */
export interface NlEngine {
  /**
   * @param text The user's request.
   * @param schema Stringified JSON schema constraining the output.
   * @param systemPrompt The system prompt listing the commands.
   * @returns The parsed model output (expected `{command, args}`).
   */
  interpret(
    text: string,
    schema: string,
    systemPrompt: string,
  ): Promise<unknown>;
}

/** An async factory that loads an engine, reporting progress. */
export type NlEngineFactory = (
  onProgress: (p: NlProgress) => void,
) => Promise<NlEngine>;

/**
 * Optional DI token an application provides to supply an in-browser model
 * engine (the WebLLM wrapper). The reusable library never imports the heavy
 * engine; when no factory is provided the natural-language feature runs on the
 * deterministic keyword fallback only.
 */
export const NL_ENGINE_FACTORY = new InjectionToken<NlEngineFactory>(
  'phoenix.nl-engine-factory',
);

/** Lifecycle status of the natural-language service. */
export type NlStatus = 'idle' | 'loading' | 'ready' | 'thinking' | 'error';

/** A vetted answer to a "what is..." question (the masterclass tutor). */
export interface NlAnswer {
  /** Title of the topic. */
  title: string;
  /** The vetted explanation. */
  body: string;
  /** Related topics the student might ask next (clickable in the UI). */
  related: { id: string; title: string }[];
  /** An optional action this concept maps to (a registered command). */
  action?: { command: string; args?: Record<string, any>; label: string };
  /**
   * True when the requested facet (for example how-to steps) was not written
   * for this topic, so this is the closest vetted text rather than a direct
   * answer. The UI says so instead of passing a definition off as steps.
   */
  approximate?: boolean;
}

/** Outcome of an `ask()` call. */
export interface NlOutcome {
  /** True when a command ran successfully, or a question was answered. */
  ok: boolean;
  /** The command that ran (or was proposed). */
  command?: string;
  /** The arguments used. */
  args?: Record<string, any>;
  /** The command's return value, if any. */
  result?: any;
  /** Error message when not ok. */
  error?: string;
  /** True when nothing matched (an honest "I didn't understand"). */
  none?: boolean;
  /** True when the deterministic keyword path handled it (no model). */
  usedFallback?: boolean;
  /** A vetted answer, when the request was a "what is..." question. */
  answer?: NlAnswer;
  /**
   * What the request probably meant, when it was a near-miss (a mistyped
   * command). Offered for the student to confirm, NEVER run automatically: a
   * typo of a short word is one edit from ordinary English, so guessing would
   * change the display on a coincidence. Git resolves the same problem the
   * same way, suggesting a mistyped subcommand rather than executing it.
   */
  suggestion?: { command: string; args: Record<string, any>; label: string };
  /**
   * A topic the question ALMOST matched. Answering needs high confidence (a
   * wrong explanation is a tutor's worst failure), so an aggressive typo is
   * offered for confirmation instead of answered, which recovers the student
   * without lowering the bar for what counts as an answer.
   */
  suggestedTopic?: { id: string; title: string };
}

/**
 * Orchestrates natural-language control of Phoenix (#942, Phase 3): resolves the
 * command registry into a constrained schema, routes a request to either the
 * in-browser model (when loaded) or the deterministic keyword fallback,
 * validates the proposed intent, and runs it through the SAME
 * `registry.execute()` path the command palette uses. Physics-safe by
 * construction: only registered, schema-validated commands can ever run.
 */
@Injectable({ providedIn: 'root' })
export class NaturalLanguageService {
  /** Current lifecycle status (read by the UI). */
  status: NlStatus = 'idle';
  /** Latest model-load progress (while status === 'loading'). */
  progress: NlProgress = { progress: 0, text: '' };
  /** Last error message, if any. */
  lastError = '';

  /** The loaded engine, or null when running on the keyword fallback. */
  private engine: NlEngine | null = null;
  /** The model load in progress, so repeated enables share one download. */
  private loading: Promise<void> | null = null;
  /** Cached curated + derived knowledge, rebuilt when the command set changes. */
  private knowledgeCache: KnowledgeEntry[] | null = null;
  /** Identity of the command set the cache was built from. */
  private knowledgeSignature = '';

  /**
   * @param eventDisplay The Phoenix event display service (registry + live data).
   * @param engineFactory Optional app-provided factory for the in-browser model.
   */
  constructor(
    private eventDisplay: EventDisplayService,
    @Optional()
    @Inject(NL_ENGINE_FACTORY)
    private engineFactory: NlEngineFactory | null = null,
    @Optional() private ngZone: NgZone | null = null,
  ) {}

  /** Whether this browser can run the in-browser model (needs WebGPU). */
  isSupported(): boolean {
    return typeof navigator !== 'undefined' && !!(navigator as any).gpu;
  }

  /**
   * Whether an in-browser model can be offered: the app supplied an engine
   * factory AND this browser supports WebGPU. When false, the feature still
   * works via the keyword fallback.
   */
  isModelAvailable(): boolean {
    return !!this.engineFactory && this.isSupported();
  }

  /**
   * Whether a real WebGPU adapter is available. `navigator.gpu` can exist with
   * no usable adapter (e.g. software-only or blocked GPUs), so this asks for
   * one. Used to fail fast before a large model download that would only error.
   * @returns True when an adapter can be acquired.
   */
  private async hasWebGpuAdapter(): Promise<boolean> {
    const gpu = (navigator as any)?.gpu;
    if (!gpu) return false;
    try {
      return !!(await gpu.requestAdapter());
    } catch {
      return false;
    }
  }

  /**
   * Opt in to the in-browser model: lazily load it via the app-provided
   * factory. Fails fast (without downloading anything) when there is no usable
   * WebGPU adapter, leaving the keyword fallback in effect. No-op when no
   * factory was provided.
   */
  async enableModel(): Promise<void> {
    const factory = this.engineFactory;
    if (!factory || this.engine) return;
    // Share one in-flight load. The "Enable local AI" button stays visible
    // until the adapter check resolves, so a second click used to start a
    // second Worker and a second ~1.5 GB download, and the first engine was
    // then overwritten without ever being terminated.
    if (this.loading) return this.loading;
    this.loading = (async () => {
      try {
        if (!(await this.hasWebGpuAdapter())) {
          this.status = 'error';
          this.lastError =
            'No usable WebGPU adapter on this device; using keyword matching.';
          return;
        }
        await this.loadEngine(factory);
      } finally {
        // Cleared on failure as well, so a later click can retry.
        this.loading = null;
      }
    })();
    return this.loading;
  }

  /** Whether a model engine is currently loaded. */
  get hasEngine(): boolean {
    return this.engine !== null;
  }

  /**
   * Inject an engine directly (used by tests and the UI once loaded).
   * @param engine The engine to use, or null to revert to the fallback.
   */
  setEngine(engine: NlEngine | null): void {
    this.engine = engine;
    this.status = engine ? 'ready' : 'idle';
  }

  /**
   * Lazily load an engine via the given factory, tracking progress/status.
   * The factory (the WebLLM wrapper) is passed in so this service never imports
   * the heavy engine and stays out of the static bundle.
   * @param factory Async factory that builds an engine.
   */
  async loadEngine(factory: NlEngineFactory): Promise<void> {
    if (this.engine) return;
    this.status = 'loading';
    this.lastError = '';
    this.progress = { progress: 0, text: 'Starting…' };
    try {
      const engine = await factory((p) => (this.progress = p));
      this.engine = engine;
      this.status = 'ready';
    } catch (e) {
      this.status = 'error';
      this.lastError = e instanceof Error ? e.message : String(e);
      throw e;
    }
  }

  /**
   * Interpret a request into a validated command WITHOUT running it (a dry-run
   * preview). Uses the loaded model (constrained decoding), else the keyword
   * fallback; degrades to the fallback on model error. The proposed command is
   * validated against the registry, so `ok` means a real, registered command
   * was chosen. Runs no command and has no side effects, so it is also what an
   * evaluation harness uses to measure mapping accuracy.
   * @param text The user's request.
   * @returns The mapped command + args, or a no-match / error.
   */
  async interpret(text: string): Promise<NlOutcome> {
    // Bounded and cleaned once, here, so the model never receives what the
    // deterministic paths refuse to read: a megabyte paste, or Unicode Tag
    // characters carrying a second request the person never saw.
    text = sanitizeRequest(text);
    const registry = this.eventDisplay.getCommandRegistry();
    const tools = registry.toToolSchemas();
    let parsed: unknown = null;
    let usedFallback = false;

    // DETERMINISTIC FAST PATH. The keyword matcher is provably safe: across a
    // 9,600-phrasing corpus it never maps to a wrong command, it either maps
    // correctly or declines. So when it recognises the request there is nothing
    // for the model to add, and running one anyway costs a GPU inference, adds
    // seconds of latency, and risks the OS driver watchdog resetting the device
    // mid-render ("device was lost"). Try it first and keep the GPU idle.
    // Live names (preset views, geometry parts) differ per experiment, so the
    // deterministic matcher can only handle "go to the left view" or "hide the
    // beam" when it is given them. Resolved once and shared with the model
    // path below, which needs the same values for its schema and prompt.
    const enums = this.resolveEnums();
    const live = {
      presetViews: enums.presetViews,
      geometryParts: enums.geometryParts,
    };
    const quick = keywordFallback(text, live);
    if (quick) {
      parsed = quick;
      usedFallback = true;
    } else if (this.engine) {
      const schema = buildIntentSchema(tools, enums);
      // Pass the live request so the prompt adds the most relevant few-shot
      // examples (dynamic retrieval few-shot) for this specific query.
      const prompt = buildSystemPrompt(tools, enums, text);
      this.status = 'thinking';
      // Free the GPU while the model runs: the WebGL render loop contending
      // with WebLLM's WebGPU compute on one GPU can exceed the OS watchdog
      // (~2 s TDR) and reset the driver, blanking the canvas. Pausing leaves
      // the last frame up; always resumed in `finally`, even on model error.
      const three = (this.eventDisplay as any)?.getThreeManager?.();
      three?.pauseRendering?.();
      try {
        parsed = await this.engine.interpret(text, schema, prompt);
      } catch (e) {
        this.lastError = e instanceof Error ? e.message : String(e);
        parsed = keywordFallback(text, live);
        usedFallback = true;
      } finally {
        this.resumeOutsideAngular(three);
      }
      this.status = 'ready';
    } else {
      parsed = keywordFallback(text, live);
      usedFallback = true;
    }

    if (parsed === null || parsed === undefined) {
      return {
        ok: false,
        none: true,
        usedFallback,
        error: 'Sorry, I could not map that to a command.',
      };
    }

    const intent = validateIntent(parsed, registry);
    if (!intent.ok) {
      const failed = intent as { error: string; none?: boolean };
      return {
        ok: false,
        none: failed.none,
        usedFallback,
        error: failed.none
          ? 'Sorry, I could not map that to a command.'
          : failed.error,
      };
    }
    return {
      ok: true,
      command: intent.command,
      args: intent.args,
      usedFallback,
    };
  }

  /**
   * Interpret AND run a natural-language request: the same validated
   * `registry.execute()` path the command palette uses, so an unregistered or
   * malformed action can never fire.
   * @param text The user's request.
   * @returns The outcome (ran / no-match / error), with which path was used.
   */
  async ask(text: string): Promise<NlOutcome> {
    text = sanitizeRequest(text);
    // Tutor path: a "what is..." / "how do I use..." question is answered from
    // the vetted knowledge base (deterministic, typo-tolerant retrieval; no
    // model, no hallucinated physics), never executed as a command. An
    // unmatched question gets an honest no-answer, not a wrong command.
    // A trailing question mark is punctuation, not phrasing: "next event?" is
    // an instruction asked politely. Only interrogative WORDING ("what is",
    // "how do I", "why", "where") should pre-empt the command path. Without
    // this, any request ending in "?" returned a definition with ok:true while
    // the command never ran, so the UI reported success for nothing.
    const wordedAsQuestion = hasDefinitionalPhrasing(text);
    if (
      isConceptQuestion(text) &&
      (wordedAsQuestion || !keywordFallback(text, this.liveNames()))
    ) {
      const answered = this.tryAnswer(text);
      if (answered) return answered;
      const near = suggestKnowledge(text, this.knowledge());
      return {
        ok: false,
        none: true,
        usedFallback: true,
        ...(near ? { suggestedTopic: { id: near.id, title: near.title } } : {}),
        error: near
          ? ''
          : 'No answer for that yet. Try asking about tracks, jets, eta-phi, the calorimeter, the masterclass, or a Phoenix feature.',
      };
    }

    const outcome = await this.interpret(text);
    if (!outcome.ok || !outcome.command) {
      // Nothing matched at all: it may be a bare topic ("eta phi panel",
      // "calorimeter"). Fall back to the tutor so a student who just types a
      // term still gets an explanation. Only on a true no-match (`none`), NOT
      // when a command was proposed but rejected (bad args) - that error must
      // surface, not be masked by an answer.
      if (outcome.none) {
        // A near-miss of a real command is a request to ACT, so it takes
        // precedence over explaining the topic: someone typing "drak mode"
        // wants the theme switched, not a definition of dark mode. The
        // suggestion is offered for confirmation and never run automatically.
        const guess = suggestCommand(text);
        if (guess) {
          return {
            ...outcome,
            suggestion: {
              command: guess.intent.command,
              args: guess.intent.args,
              label: guess.text,
            },
          };
        }
        // Otherwise it may be a bare topic ("eta phi panel"): explain it.
        const answered = this.tryAnswer(text);
        if (answered) return answered;
      }
      return outcome;
    }
    const res = await this.eventDisplay
      .getCommandRegistry()
      .execute(outcome.command, outcome.args ?? {});
    if (!res.ok) {
      const failed = res as { ok: false; error: string };
      return { ...outcome, ok: false, error: failed.error };
    }
    return { ...outcome, result: (res as { result?: any }).result };
  }

  /**
   * Look the request up in the vetted knowledge base and build an answer
   * outcome, or null when nothing matches well enough.
   * @param text The user's request.
   * @returns An answer outcome, or null.
   */
  /**
   * The knowledge the tutor can draw on: the curated base plus an entry derived
   * from every registered command. The derived half means a newly added command
   * is explainable immediately, and each experiment automatically gets entries
   * for whatever it registers, so the tutor cannot silently fall behind the
   * application. Rebuilt when the command set changes.
   */
  /**
   * Resume the render loop outside Angular's zone.
   *
   * The loop is registered outside the zone on purpose, so it does not run
   * change detection on every frame. Resuming it from inside the zone (which
   * is where an awaited inference lands) re-armed requestAnimationFrame in the
   * zone, and three re-arms it from its own callback, so every later frame
   * would tick the whole app permanently.
   * @param three The three manager, if one is present.
   */
  private resumeOutsideAngular(three: any): void {
    const resume = () => three?.resumeRendering?.();
    if (this.ngZone) this.ngZone.runOutsideAngular(resume);
    else resume();
  }

  /**
   * Live per-experiment names the deterministic matcher needs (preset views and
   * geometry parts differ between ATLAS, CMS, LHCb and TrackML).
   * @returns The names currently present in this experiment's scene.
   */
  private liveNames(): { presetViews?: string[]; geometryParts?: string[] } {
    const enums = this.resolveEnums();
    return {
      presetViews: enums.presetViews,
      geometryParts: enums.geometryParts,
    };
  }

  private knowledge(): KnowledgeEntry[] {
    const commands = this.eventDisplay.getCommandRegistry().list();
    // Keyed on what each command SAYS, not just how many there are: the
    // registry replaces by name, so an experiment overriding a command leaves
    // the count unchanged while its description changes. A count-based key
    // would keep answering with text that is no longer true.
    const signature = commands
      .map((c) => `${c.name}:${c.description}`)
      .join('\u0000');
    if (this.knowledgeCache && this.knowledgeSignature === signature) {
      return this.knowledgeCache;
    }
    this.knowledgeCache = [
      ...KNOWLEDGE_BASE,
      ...deriveCommandEntries(commands),
    ];
    this.knowledgeSignature = signature;
    return this.knowledgeCache;
  }

  private tryAnswer(text: string): NlOutcome | null {
    const entry = findKnowledge(text, this.knowledge());
    if (!entry) return null;
    const related = (entry.related ?? [])
      .map((id) => getKnowledgeEntry(id, this.knowledge()))
      .filter((e): e is NonNullable<typeof e> => !!e)
      .map((e) => ({ id: e.id, title: e.title }));
    // Answer the KIND of question that was asked (definition / how-to / why /
    // where), not just the topic, and flag when only a definition was
    // available so the UI can be honest rather than pass it off as steps.
    const intent = detectQuestionIntent(text);
    const facet = selectFacet(entry, intent);
    return {
      ok: true,
      usedFallback: true,
      answer: {
        title: entry.title,
        body: facet.text,
        related,
        action: entry.action,
        approximate: !facet.requested,
      },
    };
  }

  /**
   * Resolve live values for `enumSource` parameters so the model is constrained
   * to real collection names, preset views and event keys. Best-effort: any
   * source that is unavailable is simply left unconstrained (validated later).
   * @returns The resolved enum sources.
   */
  private resolveEnums(): EnumSources {
    const ed = this.eventDisplay as any;
    const enums: EnumSources = {};
    try {
      const collections = ed.getCollections?.();
      // The values are the real collection names; the keys are event-data
      // TYPES ("Tracks"), which getCollection() does not resolve. The
      // palette already flattens the values, and the object commands look
      // up by collection name, so the enum has to match them.
      if (collections) {
        enums.collections = Object.values(collections).flat() as string[];
      }
    } catch {
      /* leave unconstrained */
    }
    try {
      const views = ed.getUIManager?.()?.getPresetViews?.();
      if (views) enums.presetViews = views.map((v: any) => v.name);
    } catch {
      /* leave unconstrained */
    }
    try {
      const events = ed.getEventsData?.();
      if (events) enums.eventKeys = Object.keys(events);
    } catch {
      /* leave unconstrained */
    }
    try {
      // Real detector-geometry part names, read live so this stays
      // experiment-agnostic (ATLAS, LHCb and CMS share no part names). The
      // core owns this: the same list constrains the command's own argument
      // and is what the command validates against, so resolving it here a
      // second way would let the two disagree.
      const parts = ed.getGeometryPartNames?.() ?? [];
      if (parts.length) enums.geometryParts = parts;
    } catch {
      /* leave unconstrained */
    }
    return enums;
  }
}
