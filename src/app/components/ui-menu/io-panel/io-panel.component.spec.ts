import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IOPanelComponent } from './io-panel.component';

describe('IoPanelComponent', () => {
  let component: IOPanelComponent;
  let fixture: ComponentFixture<IOPanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IOPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IOPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
