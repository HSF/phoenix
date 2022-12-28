import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjectSelectionOverlayComponent } from './object-selection-overlay.component';
import { PhoenixUIModule } from '../../../phoenix-ui.module';
import { EventDisplayService } from '../../../../services/event-display.service';

describe('ObjectSelectionOverlayComponent', () => {
  let component: ObjectSelectionOverlayComponent;
  let fixture: ComponentFixture<ObjectSelectionOverlayComponent>;

  const mockEventDisplay = {
    allowSelection: jest.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
      providers: [
        {
          provide: EventDisplayService,
          useValue: mockEventDisplay,
        },
      ],
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
