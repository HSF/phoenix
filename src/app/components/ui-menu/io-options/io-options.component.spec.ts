import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IoOptionsComponent } from './io-options.component';
import { AppModule } from 'src/app/app.module';
import { MatDialog } from '@angular/material/dialog';

describe('IoOptionsComponent', () => {
  let component: IoOptionsComponent;
  let fixture: ComponentFixture<IoOptionsComponent>;

  let dialog: MatDialog;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [MatDialog],
      declarations: [IoOptionsComponent]
    })
      .compileComponents();
    dialog = TestBed.get(MatDialog);
  }));

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
