/**
 * @jest-environment jsdom
 */
import { saveFile } from '../../helpers/file';

describe('saveFile', () => {
  const OBJECT_URL = 'blob:phoenix/test';
  let createObjectURL: jest.Mock;
  let revokeObjectURL: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    createObjectURL = jest.fn().mockReturnValue(OBJECT_URL);
    revokeObjectURL = jest.fn();
    // jsdom does not implement the object URL APIs.
    (URL as any).createObjectURL = createObjectURL;
    (URL as any).revokeObjectURL = revokeObjectURL;
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should revoke the object URL it created', () => {
    saveFile('{}', 'test.json');

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    // Revoking synchronously can cancel the download the click started, so it
    // must happen only after the current task.
    expect(revokeObjectURL).not.toHaveBeenCalled();

    jest.runAllTimers();

    expect(revokeObjectURL).toHaveBeenCalledWith(OBJECT_URL);
  });

  it('should not leak an object URL per call', () => {
    saveFile('{}', 'one.json');
    saveFile('{}', 'two.json');
    jest.runAllTimers();

    expect(createObjectURL).toHaveBeenCalledTimes(2);
    expect(revokeObjectURL).toHaveBeenCalledTimes(2);
  });
});
