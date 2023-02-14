import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventDisplayService } from 'phoenix-ui-components/lib/services/event-display.service';
import { PhoenixUIModule } from 'phoenix-ui-components/lib/components/phoenix-ui.module';

import { VPToggleComponent } from './vp-toggle.component';

describe('VPToggleComponent', () => {
  let component: VPToggleComponent;
  let fixture: ComponentFixture<VPToggleComponent>;

  const mockEventDisplay = {
    getThreeManager: jest.fn().mockReturnThis(),
    getSceneManager: jest.fn().mockReturnThis(),
  };

  const sceneManager = mockEventDisplay.getThreeManager().getSceneManager();
  (sceneManager as any).getObjectByName = jest.fn().mockReturnValue({
    position: {
      setComponent: jest.fn(),
    },
  } as any);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
      providers: [
        {
          provide: EventDisplayService,
          useValue: mockEventDisplay,
        },
      ],
      declarations: [VPToggleComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VPToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle VP opening/closing', () => {
    expect(component.open).toBe(false);
    component.toggleVP();
    expect(component.open).toBe(true);
  });
});
