import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IOOptionsDialogComponent } from './io-options-dialog.component';
import { AppModule } from 'src/app/app.module';
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog';

describe('IoOptionsDialogComponent', () => {
  let component: IOOptionsDialogComponent;
  let fixture: ComponentFixture<IOOptionsDialogComponent>;

  const mockDialogRef = {
    close: jasmine.createSpy('close')
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [
        {
          provide: MatDialogRef,
          useValue: mockDialogRef
        }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IOOptionsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
