import {
  WebLlmEngine,
  isWebGpuAvailable,
  loadOrder,
  NL_MODEL_LADDER,
  DEFAULT_NL_MODEL,
  HIGH_ACCURACY_MODEL,
} from '../webllm-engine';

describe('model fallback ladder', () => {
  it('defaults to the safe (watchdog-friendly) model, not the largest', () => {
    // The default must keep each inference short enough to dodge the ~2 s GPU
    // watchdog, so it is the 1.5B, NOT the 3B accuracy option.
    expect(DEFAULT_NL_MODEL).toContain('1.5B');
    expect(HIGH_ACCURACY_MODEL).toContain('3B');
    expect(DEFAULT_NL_MODEL).not.toBe(HIGH_ACCURACY_MODEL);
  });

  it('ladder starts at the default and shrinks to a run-anywhere model', () => {
    expect(NL_MODEL_LADDER[0]).toBe(DEFAULT_NL_MODEL);
    expect(NL_MODEL_LADDER[NL_MODEL_LADDER.length - 1]).toContain('1B');
  });

  it('loadOrder puts the preferred model first, then the rest, de-duplicated', () => {
    const order = loadOrder(DEFAULT_NL_MODEL);
    expect(order[0]).toBe(DEFAULT_NL_MODEL);
    // no duplicates even though the preferred model is on the ladder
    expect(new Set(order).size).toBe(order.length);
    expect(order).toEqual(NL_MODEL_LADDER);
  });

  it('the opt-in 3B still degrades through the ladder on load failure', () => {
    const order = loadOrder(HIGH_ACCURACY_MODEL);
    expect(order[0]).toBe(HIGH_ACCURACY_MODEL);
    // falls back to the smaller models rather than dying outright
    for (const m of NL_MODEL_LADDER) expect(order).toContain(m);
    expect(new Set(order).size).toBe(order.length);
  });
});

describe('isWebGpuAvailable', () => {
  const original = (navigator as any).gpu;
  afterEach(() => ((navigator as any).gpu = original));

  it('is false when navigator.gpu is absent', async () => {
    (navigator as any).gpu = undefined;
    expect(await isWebGpuAvailable()).toBe(false);
  });

  it('is true when an adapter is available', async () => {
    (navigator as any).gpu = { requestAdapter: async () => ({}) };
    expect(await isWebGpuAvailable()).toBe(true);
  });

  it('is false when no adapter is returned', async () => {
    (navigator as any).gpu = { requestAdapter: async () => null };
    expect(await isWebGpuAvailable()).toBe(false);
  });

  it('is false (never throws) when requestAdapter rejects', async () => {
    (navigator as any).gpu = {
      requestAdapter: async () => {
        throw new Error('no gpu');
      },
    };
    expect(await isWebGpuAvailable()).toBe(false);
  });
});

describe('WebLlmEngine.interpret', () => {
  function engineReturning(content: string) {
    const create = jest.fn(async () => ({
      choices: [{ message: { content } }],
    }));
    return { engine: { chat: { completions: { create } } }, create };
  }

  it('calls the model with constrained JSON response_format and parses the result', async () => {
    const { engine, create } = engineReturning(
      '{"command":"next-event","args":{}}',
    );
    const wrapper = new WebLlmEngine(engine);
    const out = await wrapper.interpret('go forward', '{"oneOf":[]}', 'SYSTEM');
    expect(out).toEqual({ command: 'next-event', args: {} });
    const opts = create.mock.calls[0][0];
    expect(opts.response_format).toEqual({
      type: 'json_object',
      schema: '{"oneOf":[]}',
    });
    expect(opts.messages[0]).toEqual({ role: 'system', content: 'SYSTEM' });
    expect(opts.messages[1]).toEqual({ role: 'user', content: 'go forward' });
  });

  it('defensively parses noisy model output (code fences)', async () => {
    const { engine } = engineReturning(
      '```json\n{"command":"set-theme","args":{"dark":true}}\n```',
    );
    const out = await new WebLlmEngine(engine).interpret('dark', 's', 'p');
    expect(out).toEqual({ command: 'set-theme', args: { dark: true } });
  });

  it('returns null when the model gives no usable content', async () => {
    const { engine } = engineReturning('');
    const out = await new WebLlmEngine(engine).interpret('x', 's', 'p');
    expect(out).toBeNull();
  });
});
