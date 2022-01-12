import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoPanelOverlayComponent } from './info-panel-overlay.component';
import { PhoenixUIModule } from '../../../phoenix-ui.module';

describe('InfoPanelOverlayComponent', () => {
  let component: InfoPanelOverlayComponent;
  let fixture: ComponentFixture<InfoPanelOverlayComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
      declarations: [InfoPanelOverlayComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InfoPanelOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
