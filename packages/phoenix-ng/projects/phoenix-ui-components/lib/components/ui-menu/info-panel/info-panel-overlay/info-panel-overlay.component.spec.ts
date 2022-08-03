import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoPanelOverlayComponent } from './info-panel-overlay.component';
import { EventDisplayService } from 'phoenix-ui-components';

describe('InfoPanelOverlayComponent', () => {
  let component: InfoPanelOverlayComponent;
  let fixture: ComponentFixture<InfoPanelOverlayComponent>;

  const mockEventDisplay = {
    getInfoLogger: jest.fn().mockReturnThis(),
    getInfoLoggerList: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: EventDisplayService,
          useValue: mockEventDisplay,
        },
      ],
      declarations: [InfoPanelOverlayComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InfoPanelOverlayComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call getInfoLoggerList', () => {
    component.ngOnInit();

    expect(
      mockEventDisplay.getInfoLogger().getInfoLoggerList
    ).toHaveBeenCalled();
    expect(component.actionsList).toBeTruthy();
  });
});
