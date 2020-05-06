import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoPanelOverlayComponent } from './info-panel-overlay.component';

describe('InfoPanelOverlayComponent', () => {
  let component: InfoPanelOverlayComponent;
  let fixture: ComponentFixture<InfoPanelOverlayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InfoPanelOverlayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InfoPanelOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
