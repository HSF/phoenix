import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventDisplayService } from 'phoenix-ui-components/lib/services/event-display.service';
import { PhoenixUIModule } from 'phoenix-ui-components/lib/components/phoenix-ui.module';

import { ArToggleComponent } from './ar-toggle.component';

describe('ArToggleComponent', () => {
  let component: ArToggleComponent;
  let fixture: ComponentFixture<ArToggleComponent>;

  const mockEventDisplay = {
    initXR: jest.fn(),
    endXR: jest.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
      providers: [
        {
          provide: EventDisplayService,
          useValue: mockEventDisplay,
        },
      ],
      declarations: [ArToggleComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ArToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle AR from OFF to ON and vice-versa', () => {
    expect(component.arActive).toBeFalsy();

    component.toggleAr(true);
    expect(component.arActive).toBeTruthy();

    component.toggleAr(false);
    expect(component.arActive).toBeFalsy();
  });
});
