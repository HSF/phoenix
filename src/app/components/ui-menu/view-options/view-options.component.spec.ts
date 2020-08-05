import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewOptionsComponent } from './view-options.component';
import { AppModule } from '../../../app.module';
import { UIService } from '../../../services/ui.service';
import { PresetView } from '../../../services/extras/preset-view.model';

describe('ViewOptionsComponent', () => {
  let component: ViewOptionsComponent;
  let fixture: ComponentFixture<ViewOptionsComponent>;

  let mockUIService = jasmine.createSpyObj('UIServicie', ['getPresetViews', 'displayView']);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [{
        provide: UIService,
        useValue: mockUIService
      }],
      declarations: [ViewOptionsComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initially get preset views', () => {
    component.ngOnInit();
    expect(mockUIService.getPresetViews).toHaveBeenCalled();
  });

  it('should display the chosen preset view', () => {
    const mockEvent = jasmine.createSpyObj('Event', ['stopPropagation']);
    const mockPresetView = new PresetView('Test View', [0, 0, -12000], 'left-cube');
    component.displayView(mockEvent, mockPresetView);

    expect(mockUIService.displayView).toHaveBeenCalledWith(mockPresetView);
  });
});
