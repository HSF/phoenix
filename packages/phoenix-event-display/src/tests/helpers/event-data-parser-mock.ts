/** Jest mock for EventDataParserWorker — stubs out Web Worker / import.meta.url */
export class EventDataParserWorker {
  parseJSON(jsonString: string): Promise<any> {
    return Promise.resolve(JSON.parse(jsonString));
  }

  parseJiveXML(_xmlString: string): Promise<any> {
    return Promise.resolve(null);
  }

  terminate(): void {}
}
