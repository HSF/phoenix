import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IoOptionsComponent } from './io-options.component';
import { MatDialog } from '@angular/material/dialog';
import { PhoenixUIModule } from '../../phoenix-ui.module';

describe('IoOptionsComponent', () => {
  let component: IoOptionsComponent;
  let fixture: ComponentFixture<IoOptionsComponent>;

  let dialog: MatDialog;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
      providers: [MatDialog],
      declarations: [IoOptionsComponent],
    }).compileComponents();
    dialog = TestBed.get(MatDialog);
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
    spyOn(dialog, 'open');

    component.openIODialog();
    expect(dialog.open).toHaveBeenCalled();
  });
});
