import JSZip from 'jszip';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IOOptionsDialogComponent } from './io-options-dialog.component';
import { MatDialogRef } from '@angular/material/dialog';
import { EventDisplayService } from '../../../../services/event-display.service';
import { PhoenixUIModule } from '../../../phoenix-ui.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

const mockFileList = (files: File[]): FileList => {
  const fileList: any = {
    length: files.length,
    item: (index: number) => files[index] || null,
    [Symbol.iterator]: () => files[Symbol.iterator](),
  };

  // Add array-like access
  files.forEach((file, index) => {
    fileList[index] = file;
  });

  return fileList as FileList;
};

describe('IoOptionsDialogComponent', () => {
  let component: IOOptionsDialogComponent;
  let fixture: ComponentFixture<IOOptionsDialogComponent>;

  const mockDialogRef = {
    close: jest.fn(),
  };

  const mockEventDisplayService = {
    buildEventDataFromJSON: jest.fn(),
    parsePhoenixEvents: jest.fn(),
    parseZipEventData: jest.fn(),
    parseOBJGeometry: jest.fn(),
    parsePhoenixDisplay: jest.fn(),
    parseGLTFGeometry: jest.fn(),
    exportPhoenixDisplay: jest.fn(),
    exportToOBJ: jest.fn(),
    getInfoLogger: () => ({
      add: jest.fn(),
    }),
  };

  beforeEach(() => {
    mockDialogRef.close.mockClear();
    mockEventDisplayService.buildEventDataFromJSON.mockClear();
    mockEventDisplayService.parseZipEventData.mockReset();

    TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, PhoenixUIModule],
      providers: [
        {
          provide: EventDisplayService,
          useValue: mockEventDisplayService,
        },
        {
          provide: MatDialogRef,
          useValue: mockDialogRef,
        },
      ],
      declarations: [IOOptionsDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IOOptionsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should close the IOOptionsDialog', () => {
    component.onClose();

    expect(mockDialogRef.close).toHaveBeenCalled();
  });

  it('should handle glTF file input', () => {
    const files = mockFileList([
      new File(['{}'], 'testfile.gltf', {
        type: 'application/json',
      }),
    ]);
    component.handleGLTFInput(files);
  });

  describe('handleFileInput', () => {
    beforeEach(() => {
      jest.spyOn(component, 'handleFileInput').mockImplementation(() => {});
    });

    it('should parse JiveXML event data from the file input callback', () => {
      const xml =
        '<Event eventNumber="42" runNumber="7" lumiBlock="3" dateTime="2026-01-01"/>';
      const file = new File([xml], 'testfile.xml', { type: 'text/xml' });

      component.handleJiveXMLDataInput(mockFileList([file]));

      expect(component.handleFileInput).toHaveBeenCalledWith(
        file,
        'xml',
        expect.any(Function),
      );
      const [, , parseJiveXML] = jest.mocked(component.handleFileInput).mock
        .calls[0];
      parseJiveXML(xml);

      expect(
        mockEventDisplayService.buildEventDataFromJSON,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockEventDisplayService.buildEventDataFromJSON,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          eventNumber: '42',
          runNumber: '7',
          lumiBlock: '3',
          time: '2026-01-01',
        }),
      );
    });

    describe('handleFileInput sync', () => {
      afterEach(() => {
        expect(component.handleFileInput).toHaveBeenCalled();
      });

      it('should log error for wrong file', () => {
        const filesWrong = mockFileList([
          new File(['test data'], 'testfile.xml', {
            type: 'text/xml',
          }),
        ]);
        component.handleJSONEventDataInput(filesWrong);
      });

      it('should handle JSON event data input', () => {
        const files = mockFileList([
          new File(['{}'], 'testfile.json', {
            type: 'application/json',
          }),
        ]);
        component.handleJSONEventDataInput(files);
      });

      it('should handle OBJ file input', () => {
        const files = mockFileList([
          new File(['test data'], 'testfile.obj', {
            type: 'text/plain',
          }),
        ]);
        component.handleOBJInput(files);
      });

      it('should handle scene file input', () => {
        const files = mockFileList([
          new File(['test data'], 'testfile.phnx', {
            type: 'text/plain',
          }),
        ]);
        component.handleSceneInput(files);
      });

      it('should handle phoenix file input', () => {
        const files = mockFileList([
          new File(['{}'], 'testfile.phnx', {
            type: 'application/json',
          }),
        ]);
        component.handlePhoenixInput(files);
      });
    });
  });

  it('should close after the selected ZIP file has finished parsing', async () => {
    const file = new File([], 'test_data.zip', { type: 'application/zip' });
    let completeParsing: () => void;
    const parsing = new Promise<void>((resolve) => {
      completeParsing = resolve;
    });
    mockEventDisplayService.parseZipEventData.mockReturnValueOnce(parsing);

    const handling = component.handleZipEventDataInput(mockFileList([file]));

    expect(mockEventDisplayService.parseZipEventData).toHaveBeenCalledTimes(1);
    expect(mockEventDisplayService.parseZipEventData).toHaveBeenCalledWith(
      file,
    );
    expect(mockDialogRef.close).not.toHaveBeenCalled();

    completeParsing();
    await handling;

    expect(mockDialogRef.close).toHaveBeenCalledTimes(1);
  });

  it('should notify error and keep dialog open if ZIP parsing fails', async () => {
    const file = new File([], 'corrupt.zip', { type: 'application/zip' });
    mockEventDisplayService.parseZipEventData.mockRejectedValueOnce(
      new Error('Corrupt zip archive'),
    );
    const notificationErrorSpy = jest
      .spyOn((component as any).notificationService, 'error')
      .mockImplementation(() => {});
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    await component.handleZipEventDataInput(mockFileList([file]));

    expect(mockEventDisplayService.parseZipEventData).toHaveBeenCalledWith(
      file,
    );
    expect(notificationErrorSpy).toHaveBeenCalledWith(
      'Could not read zip file.',
    );
    expect(mockDialogRef.close).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should handle ig event data', async () => {
    const ig = new JSZip();
    ig.file('test_data', '{}');
    const igBlob = await ig.generateAsync({ type: 'blob' });
    const files = mockFileList([new File([igBlob], 'test_data.ig')]);
    component.handleZipEventDataInput(files);
  });

  it('should save scene', () => {
    component.saveScene();
    expect(mockEventDisplayService.exportPhoenixDisplay).toHaveBeenCalled();
  });

  it('should export to OBJ', () => {
    component.exportOBJ();
    expect(mockEventDisplayService.exportToOBJ).toHaveBeenCalled();
  });
});

/**
 * A .phnx file is read by FileReader and handed to `parsePhoenixDisplay`,
 * which calls `JSON.parse` on the raw text. `parsePhoenixDisplay` is `async`,
 * so a malformed file surfaces as a rejected promise, and nothing in the
 * `FileReader.onload` callback awaits it - `reader.onerror` only fires for
 * read failures. The rejection goes unhandled and the user, who picked a file
 * and pressed a button, sees nothing happen at all.
 *
 * The sibling JSON handlers (`handleJSONEventDataInput`,
 * `handleEDM4HEPJSONEventDataInput`) already report malformed input this way.
 */
describe('IOOptionsDialogComponent invalid .phnx handling', () => {
  let component: IOOptionsDialogComponent;
  let fixture: ComponentFixture<IOOptionsDialogComponent>;

  const infoLoggerAdd = jest.fn();
  const notificationError = jest.fn();
  /** Stands in for the real async parse: JSON.parse throws after the async
   * boundary, so the caller sees a rejected promise, not a sync throw. */
  const parsePhoenixDisplay = jest.fn(
    async (content: string) => JSON.parse(content) as unknown,
  );

  const mockDialogRef = { close: jest.fn() };

  const mockEventDisplayService = {
    parsePhoenixDisplay,
    getInfoLogger: () => ({ add: infoLoggerAdd }),
  };

  beforeEach(() => {
    infoLoggerAdd.mockClear();
    notificationError.mockClear();
    parsePhoenixDisplay.mockClear();

    TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, PhoenixUIModule],
      providers: [
        { provide: EventDisplayService, useValue: mockEventDisplayService },
        { provide: MatDialogRef, useValue: mockDialogRef },
      ],
      declarations: [IOOptionsDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IOOptionsDialogComponent);
    component = fixture.componentInstance;
    (component as any).notificationService = { error: notificationError };
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  /**
   * Run a handler and return the callback it passed to handleFileInput, so the
   * parse path can be driven directly without a real FileReader.
   */
  function captureCallback(
    run: (files: FileList) => void,
  ): (content: string, name?: string) => void {
    let captured: (content: string, name?: string) => void;
    jest
      .spyOn(component, 'handleFileInput')
      .mockImplementation((_file, _ext, callback) => {
        captured = callback;
      });
    run.call(
      component,
      mockFileList([
        new File(['not json'], 'broken.phnx', { type: 'text/plain' }),
      ]),
    );
    return captured;
  }

  it.each([
    ['scene', (c: IOOptionsDialogComponent) => c.handleSceneInput.bind(c)],
    ['phoenix', (c: IOOptionsDialogComponent) => c.handlePhoenixInput.bind(c)],
  ])('reports an error for an invalid %s file', async (_label, pick) => {
    const callback = captureCallback(pick(component));

    expect(() => callback('not json')).not.toThrow();
    // The rejection is handled on a later microtask.
    await Promise.resolve();
    await Promise.resolve();

    expect(parsePhoenixDisplay).toHaveBeenCalled();
    expect(notificationError).toHaveBeenCalledWith(
      expect.stringContaining('.phnx'),
    );
    expect(infoLoggerAdd).toHaveBeenCalled();
  });

  it('loads a valid .phnx file without reporting an error', async () => {
    const callback = captureCallback(
      component.handlePhoenixInput.bind(component),
    );

    callback('{"sceneConfiguration":{},"scene":{}}');
    await Promise.resolve();
    await Promise.resolve();

    expect(parsePhoenixDisplay).toHaveBeenCalled();
    expect(notificationError).not.toHaveBeenCalled();
  });
});
