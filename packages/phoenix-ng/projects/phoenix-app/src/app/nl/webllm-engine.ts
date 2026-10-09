import { parseIntentJson } from 'phoenix-event-display';
import type { NlEngine } from 'phoenix-ui-components';

/**
 * Default in-browser model for natural-language command mapping. Constrained
 * decoding guarantees the output is a VALID command; picking the RIGHT one
 * still needs a capable model, but bigger is NOT strictly better here. Model
 * inference and Phoenix's WebGL render loop share one GPU: a compute pass that
 * runs longer than the OS's ~2 s GPU-watchdog window (Windows TDR) makes the
 * driver reset the device (the "Invalid CommandBuffer" cascade + a ~2 s black
 * canvas). A 1.5B model keeps each inference short enough to stay under that
 * window on typical laptop GPUs, while still far outdoing the 0.5B that
 * mis-mapped "hide the calorimeter". Accuracy is lifted instead by the prompt
 * (disambiguation + dynamic few-shot) and, for strong GPUs, the opt-in 3B
 * ({@link HIGH_ACCURACY_MODEL}). Overridable via createWebLlmEngineFactory().
 */
export const DEFAULT_NL_MODEL = 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC';

/**
 * Opt-in higher-accuracy model for machines with a strong (usually discrete)
 * GPU. ~2.5 GB VRAM (q4f16_1) and a longer inference, so it is more likely to
 * trip the 2 s GPU watchdog on weak/integrated GPUs; offered as a choice, never
 * the default. Selecting it still degrades through the ladder below on load
 * failure.
 */
export const HIGH_ACCURACY_MODEL = 'Qwen2.5-3B-Instruct-q4f16_1-MLC';

/**
 * Ordered fallback ladder tried when the requested model fails to LOAD (a weak
 * or low-memory GPU throws). Each rung is smaller/lighter than the last, ending
 * at a ~0.9 GB model that runs almost anywhere WebGPU does; below this the
 * service degrades to the deterministic keyword fallback. VRAM (q4f16_1):
 * 1.5B ~1.6 GB, 1B ~0.9 GB. (This is a load-failure degrade path, not the
 * inference-time watchdog issue, which the render-pause mitigation addresses.)
 */
export const NL_MODEL_LADDER = [
  'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
  'Llama-3.2-1B-Instruct-q4f16_1-MLC',
];

/**
 * The models to try, in order: the preferred model first, then the rest of the
 * fallback ladder (smaller each step) for GPUs that cannot fit the accuracy
 * pick. De-duplicated so a preferred model already on the ladder is not
 * retried. Kept here (not in the provider) so it stays free of `import.meta`
 * and therefore unit-testable.
 * @param modelId The preferred model id.
 * @returns Ordered, de-duplicated model ids to attempt.
 */
export function loadOrder(modelId: string): string[] {
  return [modelId, ...NL_MODEL_LADDER.filter((m) => m !== modelId)];
}

/**
 * Whether this browser can actually run WebLLM: WebGPU must be present AND
 * expose an adapter. Feature-detects without importing the (heavy) engine.
 * @returns True when a WebGPU adapter is available.
 */
export async function isWebGpuAvailable(): Promise<boolean> {
  const gpu = (navigator as any)?.gpu;
  if (!gpu) return false;
  try {
    return !!(await gpu.requestAdapter());
  } catch {
    return false;
  }
}

/** The minimal shape of a WebLLM engine this wrapper uses. */
export interface WebLlmChatEngine {
  chat: {
    completions: {
      create(opts: any): Promise<any>;
    };
  };
}

/**
 * Adapts a WebLLM engine to the `NlEngine` interface the natural-language
 * service consumes. Uses WebLLM's constrained-decoding JSON mode
 * (`response_format: { type: 'json_object', schema }`, XGrammar-backed) so the
 * output is guaranteed to match the command schema, then defensively parses it.
 */
export class WebLlmEngine implements NlEngine {
  /**
   * @param engine A ready WebLLM engine (main-thread or web-worker backed).
   */
  constructor(private engine: WebLlmChatEngine) {}

  /**
   * Interpret a request into a constrained intent JSON object.
   * @param text The user's request.
   * @param schema Stringified JSON schema constraining the output.
   * @param systemPrompt The system prompt listing the commands.
   * @returns The parsed `{command, args}` object (or null if unparseable).
   */
  async interpret(
    text: string,
    schema: string,
    systemPrompt: string,
  ): Promise<unknown> {
    const reply = await this.engine.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      response_format: { type: 'json_object', schema },
      temperature: 0,
      max_tokens: 256,
    });
    const content = reply?.choices?.[0]?.message?.content ?? '';
    return parseIntentJson(content);
  }
}
