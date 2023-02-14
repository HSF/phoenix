import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventDisplayService } from 'phoenix-ui-components/lib/services/event-display.service';

import { GeometryComponent } from './geometry.component';

describe('GeometryComponent', () => {
  let component: GeometryComponent;
  let fixture: ComponentFixture<GeometryComponent>;

  const mockEventDisplay = {
    init: jest.fn(),
    buildGeometryFromParameters: jest.fn(),
    getLoadingManager(): any {
      return {
        addProgressListener: jest.fn(),
        addLoadListenerWithCheck: jest.fn().mockReturnThis(),
      };
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: EventDisplayService,
          useValue: mockEventDisplay,
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GeometryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should copy code', () => {
    const inputElement = document.createElement('input');
    inputElement.value = 'test';

    jest.spyOn(document.body, 'appendChild');
    jest.spyOn(document.body, 'removeChild');

    document.execCommand = jest.fn();

    component.copyCode();

    expect(document.execCommand).toHaveBeenCalledWith('copy');
    expect(document.body.appendChild).toHaveBeenCalledWith(inputElement);
    expect(document.body.removeChild).toHaveBeenCalledWith(inputElement);
  });
});
