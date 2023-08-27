import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DistanceComponent } from './distance.component';
import { EventDisplayService } from 'phoenix-ui-components';

describe('DistanceComponent', () => {
  let component: DistanceComponent;
  let fixture: ComponentFixture<DistanceComponent>;

  const mockEventDisplay = {
    getUIManager: jest.fn().mockReturnThis(),
    show3DDistance: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DistanceComponent],
      providers: [
        {
          provide: EventDisplayService,
          useValue: mockEventDisplay,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DistanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle the show-distance function', () => {
    const VALUE = component.active;

    component.toggleShowDistance();

    expect(component.active).toBe(!VALUE);
    expect(mockEventDisplay.getUIManager().show3DDistance).toHaveBeenCalledWith(
      component.active,
    );
  });
});
