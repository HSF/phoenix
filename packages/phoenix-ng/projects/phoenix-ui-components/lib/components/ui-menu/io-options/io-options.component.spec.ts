import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IoOptionsComponent } from './io-options.component';
import { MatDialog } from '@angular/material/dialog';
import { PhoenixUIModule } from '../../phoenix-ui.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('IoOptionsComponent', () => {
  let component: IoOptionsComponent;
  let fixture: ComponentFixture<IoOptionsComponent>;

  let dialog: MatDialog;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, PhoenixUIModule],
      providers: [MatDialog],
      declarations: [IoOptionsComponent],
    }).compileComponents();
    dialog = TestBed.inject(MatDialog);
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
    spyOn(dialog, 'open').and.callThrough();

    component.openIODialog();
    expect(dialog.open).toHaveBeenCalled();
  });
});
