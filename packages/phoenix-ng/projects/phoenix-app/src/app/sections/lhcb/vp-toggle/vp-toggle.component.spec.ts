import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventDisplayService } from 'phoenix-ui-components';

import { VPToggleComponent } from './vp-toggle.component';
import { SceneManager } from '../../../../../../../../phoenix-event-display/src/managers/three-manager/scene-manager';

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
    expect(component.open).toBeFalsy();
    component.toggleVP();
    expect(component.open).toBeTruthy();
  });
});
