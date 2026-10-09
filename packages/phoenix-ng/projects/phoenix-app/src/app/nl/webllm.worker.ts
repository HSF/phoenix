/// <reference lib="webworker" />
import { WebWorkerMLCEngineHandler } from '@mlc-ai/web-llm';

/**
 * WebLLM web-worker entry point (#942, Phase 3). Runs model inference off the
 * main thread so it never blocks Phoenix's 3D render loop. Instantiated lazily
 * by the engine factory only when the user opts in to the in-browser model.
 */
const handler = new WebWorkerMLCEngineHandler();
self.onmessage = (msg: MessageEvent): void => {
  handler.onmessage(msg);
};
