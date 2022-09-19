import { InfoLogger } from '../../helpers/info-logger';

describe('InfoLogger', () => {
  let infoLogger: InfoLogger;

  beforeEach(() => {
    infoLogger = new InfoLogger();
  });

  afterEach(() => {
    infoLogger = undefined;
  });

  it('should create an instance of InfoLogger', () => {
    expect(infoLogger).toBeTruthy();
  });

  it('should add an entry to the info logger list', () => {
    const prevLength = infoLogger.getInfoLoggerList().length;
    infoLogger.add('Some log data');
    infoLogger.add('Some log data', 'Some Label');
    expect(infoLogger.getInfoLoggerList().length).toBe(prevLength + 2);
  });

  it('should pop an entry from the info logger list if max entries reached', () => {
    (infoLogger as any).infoLoggerList = [];
    (infoLogger as any).maxEntries = 2;

    infoLogger.add('Test data 1');
    infoLogger.add('Test data 2');
    infoLogger.add('Test data 3');
    const lastEntry = 'Test data 4';
    infoLogger.add(lastEntry);

    const currentList = infoLogger.getInfoLoggerList();

    expect(currentList[0]).toBe(lastEntry);
    expect(currentList.length).toBe(3);
  });
});
