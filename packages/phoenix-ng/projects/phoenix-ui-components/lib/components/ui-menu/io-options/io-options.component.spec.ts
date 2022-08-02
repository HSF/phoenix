import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IoOptionsComponent } from './io-options.component';
import { MatDialog } from '@angular/material/dialog';
import { PhoenixUIModule } from '../../phoenix-ui.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('IoOptionsComponent', () => {
  let component: IoOptionsComponent;
  let fixture: ComponentFixture<IoOptionsComponent>;

  const dialog = {
    open: jest.fn().mockImplementation(() => {
      return {
        componentInstance: {
          eventDataImportOptions: [],
        },
      };
    }),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, PhoenixUIModule],
      providers: [
        {
          provide: MatDialog,
          useValue: dialog,
        },
      ],
      declarations: [IoOptionsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IoOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open IO dialog', () => {
    jest.spyOn(dialog, 'open');

    component.openIODialog();

    expect(dialog.open).toHaveBeenCalled();
  });
});
