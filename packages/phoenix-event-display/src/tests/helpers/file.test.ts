/**
 * @jest-environment jsdom
 */
import { saveFile, loadFile } from '../../helpers/file';

describe('saveFile', () => {
  const OBJECT_URL = 'blob:phoenix/test';
  let createObjectURL: jest.Mock;
  let revokeObjectURL: jest.Mock;

  const originalCreate = (URL as any).createObjectURL;
  const originalRevoke = (URL as any).revokeObjectURL;

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
    (URL as any).createObjectURL = originalCreate;
    (URL as any).revokeObjectURL = originalRevoke;
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

describe('loadFile', () => {
  afterEach(() => {
    document.body
      .querySelectorAll('input[type="file"]')
      .forEach((el) => el.remove());
  });

  it('should create an input element with the specified content type and append it to body', () => {
    const onFileRead = jest.fn();
    loadFile(onFileRead, 'text/plain');

    const input = document.body.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.accept).toBe('text/plain');
  });

  it('should clean up the input element when the dialog is canceled', () => {
    const onFileRead = jest.fn();
    loadFile(onFileRead);

    const input = document.body.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    expect(input).not.toBeNull();

    input.dispatchEvent(new Event('cancel'));

    expect(document.body.querySelector('input[type="file"]')).toBeNull();
    expect(onFileRead).not.toHaveBeenCalled();
  });

  it('should clean up without error when input event fires with no file selected', () => {
    const onFileRead = jest.fn();
    loadFile(onFileRead);

    const input = document.body.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    expect(input).not.toBeNull();

    Object.defineProperty(input, 'files', {
      value: [],
      writable: true,
    });

    input.dispatchEvent(new Event('input'));

    expect(document.body.querySelector('input[type="file"]')).toBeNull();
    expect(onFileRead).not.toHaveBeenCalled();
  });

  it('should read file and call onFileRead callback, then clean up', () => {
    const onFileRead = jest.fn();
    loadFile(onFileRead);

    const input = document.body.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    expect(input).not.toBeNull();

    const mockFile = new Blob(['{"event": 1}'], { type: 'application/json' });
    Object.defineProperty(input, 'files', {
      value: [mockFile],
      writable: true,
    });

    const originalFileReader = window.FileReader;
    let mockReaderInstance: any;
    class MockFileReader {
      onload: any;
      onerror: any;
      result = '{"event": 1}';
      readAsText = jest.fn(() => {
        mockReaderInstance = this;
      });
    }
    (window as any).FileReader = MockFileReader;

    try {
      input.dispatchEvent(new Event('input'));
      expect(mockReaderInstance.readAsText).toHaveBeenCalledWith(mockFile);

      mockReaderInstance.onload({ target: { result: '{"event": 1}' } });
      expect(onFileRead).toHaveBeenCalledWith('{"event": 1}');
      expect(document.body.querySelector('input[type="file"]')).toBeNull();
    } finally {
      window.FileReader = originalFileReader;
    }
  });

  it('should clean up the input element if FileReader errors', () => {
    const onFileRead = jest.fn();
    loadFile(onFileRead);

    const input = document.body.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    expect(input).not.toBeNull();

    const mockFile = new Blob(['corrupted'], { type: 'application/json' });
    Object.defineProperty(input, 'files', {
      value: [mockFile],
      writable: true,
    });

    const originalFileReader = window.FileReader;
    let mockReaderInstance: any;
    class MockFileReader {
      onload: any;
      onerror: any;
      readAsText = jest.fn(() => {
        mockReaderInstance = this;
      });
    }
    (window as any).FileReader = MockFileReader;

    try {
      input.dispatchEvent(new Event('input'));
      mockReaderInstance.onerror();
      expect(document.body.querySelector('input[type="file"]')).toBeNull();
      expect(onFileRead).not.toHaveBeenCalled();
    } finally {
      window.FileReader = originalFileReader;
    }
  });
});
