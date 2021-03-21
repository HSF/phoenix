import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IOOptionsDialogComponent } from './io-options-dialog.component';
import { MatDialogRef } from '@angular/material/dialog';
import { EventDisplayService } from '../../../../services/event-display.service';
import { PhoenixUIModule } from '../../../phoenix-ui.module';

const mockFileList = (files: File[]): FileList => {
  const fileList: FileList = {
    length: files.length,
    item: (index) => files[index],
  };
  Object.assign(fileList, files);
  return fileList;
};

describe('IoOptionsDialogComponent', () => {
  let component: IOOptionsDialogComponent;
  let fixture: ComponentFixture<IOOptionsDialogComponent>;

  const mockDialogRef = {
    close: jasmine.createSpy('close'),
  };

  const mockEventDisplayService = {
    buildEventDataFromJSON: jasmine.createSpy('buildEventDataFromJSON'),
    parsePhoenixEvents: jasmine.createSpy('parsePhoenixEvents'),
    parseOBJGeometry: jasmine.createSpy('parseOBJGeometry'),
    parsePhoenixDisplay: jasmine.createSpy('parsePhoenixDisplay'),
    parseGLTFGeometry: jasmine.createSpy('parseGLTFGeometry'),
    exportPhoenixDisplay: jasmine.createSpy('exportPhoenixDisplay'),
    exportToOBJ: jasmine.createSpy('exportToOBJ'),
    getInfoLogger: () => jasmine.createSpyObj('InfoLogger', ['add']),
  };

  beforeEach(async(() => {
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
  }));

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should close the IOOptionsDialog', () => {
    component.onNoClick();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });

  describe('handleEventDataInput', () => {
    beforeEach(() => {
      spyOn(component, 'handleFileInput').and.callThrough();
    });

    it('should handle JiveXML event data input', async () => {
      await fetch('assets/test_data/JiveXML.xml')
        .then((res) => res.text())
        .then((res) => {
          const files = mockFileList([
            new File([res], 'testfile.xml', { type: 'text/xml' }),
          ]);
          component.handleJiveXMLDataInput(files);
          expect(component.handleFileInput).toHaveBeenCalled();
        });
    }, 30000);

    describe('handleEventDataInput sync', () => {
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

  it('should save scene', () => {
    component.saveScene();
    expect(mockEventDisplayService.exportPhoenixDisplay).toHaveBeenCalled();
  });

  it('should export to OBJ', () => {
    component.exportOBJ();
    expect(mockEventDisplayService.exportToOBJ).toHaveBeenCalled();
  });
});
