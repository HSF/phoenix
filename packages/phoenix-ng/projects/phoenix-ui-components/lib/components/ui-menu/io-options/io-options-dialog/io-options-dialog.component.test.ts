import JSZip from 'jszip';
import fetch from 'node-fetch';
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

    it('should handle JiveXML event data input', async () => {
      await fetch(
        'https://raw.githubusercontent.com/HSF/phoenix/main/packages/phoenix-ng/projects/phoenix-app/src/assets/files/JiveXML/JiveXML_336567_2327102923.xml',
      )
        .then((res) => res.text())
        .then((res) => {
          const files = mockFileList([
            new File([res], 'testfile.xml', { type: 'text/xml' }),
          ]);
          component.handleJiveXMLDataInput(files);
          expect(component.handleFileInput).toHaveBeenCalled();
        });
    }, 60000);

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

  it('should handle zipped event data', async () => {
    const zip = new JSZip();
    zip.file('test_data.json', '{ "event": null }');
    const jivexmlData = await fetch(
      'https://raw.githubusercontent.com/HSF/phoenix/main/packages/phoenix-ng/projects/phoenix-app/src/assets/files/JiveXML/JiveXML_336567_2327102923.xml',
    );
    zip.file('test_data.xml', jivexmlData.text());
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const files = mockFileList([
      new File([zipBlob], 'test_data.zip', { type: 'application/zip' }),
    ]);
    component.handleZipEventDataInput(files);
  }, 60000);

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
