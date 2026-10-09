import type {
  NlEngine,
  NlEngineFactory,
  NlProgress,
} from 'phoenix-ui-components';
import { DEFAULT_NL_MODEL, loadOrder, WebLlmEngine } from './webllm-engine';

/**
 * Build the natural-language engine factory the app provides to the library
 * through `NL_ENGINE_FACTORY` (#942, Phase 3). WebLLM is loaded with a dynamic
 * `import()` so it (and the model runtime) is a lazy chunk kept OUT of the
 * initial bundle; the model runs in a web worker (off the render thread) and
 * its weights are fetched from the CDN at runtime and cached by the browser.
 * The reusable library never depends on WebLLM: this wiring lives in the app.
 *
 * Loading walks a fallback ladder: if the accuracy pick (3B) is too big for the
 * device GPU and throws, it retries progressively smaller models so weak GPUs
 * still get a working model instead of dropping straight to keyword matching.
 * A fresh worker is used per attempt so a failed load leaves nothing behind.
 * @param modelId The preferred WebLLM model id (defaults to the accuracy pick).
 * @returns A factory that lazily loads and returns a ready engine.
 */
export function createWebLlmEngineFactory(
  modelId: string = DEFAULT_NL_MODEL,
): NlEngineFactory {
  return async (onProgress: (p: NlProgress) => void): Promise<NlEngine> => {
    const webllm = await import('@mlc-ai/web-llm');
    const models = loadOrder(modelId);
    let lastError: unknown;
    for (let i = 0; i < models.length; i++) {
      const id = models[i];
      const worker = new Worker(new URL('./webllm.worker', import.meta.url), {
        type: 'module',
      });
      try {
        const engine = await webllm.CreateWebWorkerMLCEngine(worker, id, {
          initProgressCallback: (report: {
            progress?: number;
            text?: string;
          }) =>
            onProgress({
              progress: report?.progress ?? 0,
              text: report?.text ?? '',
            }),
        });
        return new WebLlmEngine(engine);
      } catch (e) {
        // This model would not load on this GPU (usually out of memory).
        // Drop its worker and try the next, smaller model on the ladder.
        lastError = e;
        try {
          worker.terminate();
        } catch {
          /* worker may already be dead */
        }
        onProgress({
          progress: 0,
          text: `${id} could not load; trying a smaller model…`,
        });
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new Error('No in-browser model could be loaded on this device.');
  };
}
