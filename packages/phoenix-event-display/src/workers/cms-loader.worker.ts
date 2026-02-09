// <reference lib="webworker" />
import { CMSEventSchema } from '../helpers/validation-schemas';

const ctx: Worker = self as any;

ctx.addEventListener('message', (event) => {
  const { data, type, id } = event.data;

  if (type === 'parseCMS') {
    try {
      // 1. Clean the input string (logic from CMSLoader.ts)
      let singleEvent = data;
      singleEvent = singleEvent
        .replace(/'/g, '"')
        .replace(/\(/g, '[')
        .replace(/\)/g, ']')
        .replace(/nan/g, '0');

      // 2. Parse JSON
      const eventJSON = JSON.parse(singleEvent);

      // 3. Validation
      const validationResult = CMSEventSchema.safeParse(eventJSON);

      if (validationResult.success) {
        ctx.postMessage({
          type: 'parseCMSResult',
          id, // Pass back ID to correlate response
          data: validationResult.data,
        });
      } else {
        ctx.postMessage({
          type: 'parseCMSError',
          id,
          error: validationResult.error,
        });
      }
    } catch (error) {
      ctx.postMessage({
        type: 'parseCMSError',
        id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
});

export default null as any;
