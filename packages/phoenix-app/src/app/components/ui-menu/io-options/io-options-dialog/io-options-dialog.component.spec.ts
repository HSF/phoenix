import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IOOptionsDialogComponent } from './io-options-dialog.component';
import { AppModule } from 'src/app/app.module';
import { MatDialogRef } from '@angular/material/dialog';
import { EventDisplayService } from '../../../../services/eventdisplay.service';

describe('IoOptionsDialogComponent', () => {
  let component: IOOptionsDialogComponent;
  let fixture: ComponentFixture<IOOptionsDialogComponent>;

  const mockDialogRef = {
    close: jasmine.createSpy('close')
  };

  const mockEventDisplayService = {
    buildEventDataFromJSON: jasmine.createSpy('buildEventDataFromJSON'),
    parsePhoenixEvents: jasmine.createSpy('parsePhoenixEvents'),
    parseOBJGeometry: jasmine.createSpy('parseOBJGeometry'),
    parsePhoenixDisplay: jasmine.createSpy('parsePhoenixDisplay'),
    parseGLTFGeometry: jasmine.createSpy('parseGLTFGeometry'),
    exportPhoenixDisplay: jasmine.createSpy('exportPhoenixDisplay'),
    exportToOBJ: jasmine.createSpy('exportToOBJ')
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [
        {
          provide: EventDisplayService,
          useValue: mockEventDisplayService
        },
        {
          provide: MatDialogRef,
          useValue: mockDialogRef
        }
      ],
      declarations: [IOOptionsDialogComponent]
    })
      .compileComponents();
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
      await fetch('assets/files/JiveXML/JiveXML_336567_2327102923.xml')
      .then(res => res.text())
      .then(res => {
        const files = [new File([res], 'testfile.xml', { type: 'text/xml' })];
        component.handleJiveXMLDataInput(files);
        expect(component.handleFileInput).toHaveBeenCalled();
      });
    });

    describe('handleEventDataInput sync', () => {
      afterEach(() => {
        expect(component.handleFileInput).toHaveBeenCalled();
      });

      it('should log error for wrong file', () => {
        const filesWrong = [new File(['test data'], 'testfile.xml', { type: 'text/xml' })];
        component.handleEventDataInput(filesWrong);
      });

      it('should handle JSON event data input', () => {
        const files = [new File(['{}'], 'testfile.json', { type: 'application/json' })];
        component.handleEventDataInput(files);
      });

      it('should handle OBJ file input', () => {
        const files = [new File(['test data'], 'testfile.obj', { type: 'text/plain' })];
        component.handleOBJInput(files);
      });

      it('should handle scene file input', () => {
        const files = [new File(['test data'], 'testfile.phnx', { type: 'text/plain' })];
        component.handleSceneInput(files);
      });

      it('should handle glTF file input', () => {
        const files = [new File(['{}'], 'testfile.gltf', { type: 'application/json' })];
        component.handleGLTFInput(files);
      });

      it('should handle phoenix file input', () => {
        const files = [new File(['{}'], 'testfile.phnx', { type: 'application/json' })];
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
