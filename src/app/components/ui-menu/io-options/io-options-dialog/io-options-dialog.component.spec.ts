import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IOOptionsDialogComponent } from './io-options-dialog.component';

describe('IoOptionsDialogComponent', () => {
  let component: IOOptionsDialogComponent;
  let fixture: ComponentFixture<IOOptionsDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [IOOptionsDialogComponent]
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
