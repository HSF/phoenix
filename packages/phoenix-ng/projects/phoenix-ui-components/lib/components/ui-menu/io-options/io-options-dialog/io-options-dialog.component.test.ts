import JSZip from 'jszip';
import fetch from 'node-fetch';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IOOptionsDialogComponent } from './io-options-dialog.component';
import { MatDialogRef } from '@angular/material/dialog';
import { EventDisplayService } from '../../../../services/event-display.service';
import { PhoenixUIModule } from '../../../phoenix-ui.module';

const mockFileList = (files: File[]): FileList => {
  const fileList: FileList = {
    length: files.length,
    item: (index) => files[index],
    [Symbol.iterator]: files[Symbol.iterator],
  };
  Object.assign(fileList, files);

  return fileList;
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
      imports: [PhoenixUIModule],
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

  describe('handleFileInput', () => {
    beforeEach(() => {
      jest.spyOn(component, 'handleFileInput').mockImplementation(() => {});
    });

    it('should handle JiveXML event data input', async () => {
      await fetch(
        'https://github.com/HSF/phoenix/blob/master/packages/phoenix-ng/projects/phoenix-app/src/assets/files/JiveXML/JiveXML_336567_2327102923.xml'
      )
        .then((res) => res.text())
        .then((res) => {
          const files = mockFileList([
            new File([res], 'testfile.xml', { type: 'text/xml' }),
          ]);
          component.handleJiveXMLDataInput(files);
          expect(component.handleFileInput).toHaveBeenCalled();
        });
    }, 30000);

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

      it('should handle glTF file input', () => {
        const files = mockFileList([
          new File(['{}'], 'testfile.gltf', {
            type: 'application/json',
          }),
        ]);
        component.handleGLTFInput(files);
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
      'https://github.com/HSF/phoenix/blob/master/packages/phoenix-ng/projects/phoenix-app/src/assets/files/JiveXML/JiveXML_336567_2327102923.xml'
    );
    zip.file('test_data.xml', jivexmlData.text());
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const files = mockFileList([
      new File([zipBlob], 'test_data.zip', { type: 'application/zip' }),
    ]);
    component.handleZipEventDataInput(files);
  }, 30000);

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
