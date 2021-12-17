import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjectSelectionOverlayComponent } from './object-selection-overlay.component';
import { PhoenixUIModule } from '../../../phoenix-ui.module';

describe('ObjectSelectionOverlayComponent', () => {
  let component: ObjectSelectionOverlayComponent;
  let fixture: ComponentFixture<ObjectSelectionOverlayComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ObjectSelectionOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
