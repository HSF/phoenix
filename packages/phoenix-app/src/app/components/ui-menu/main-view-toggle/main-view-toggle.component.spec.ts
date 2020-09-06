import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MainViewToggleComponent } from './main-view-toggle.component';
import { AppModule } from '../../../app.module';
import { UIService } from '../../../services/ui.service';

describe('MainViewToggleComponent', () => {
  let component: MainViewToggleComponent;
  let fixture: ComponentFixture<MainViewToggleComponent>;

  let mockUIService = jasmine.createSpyObj('UIServicie', ['toggleOrthographicView']);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [{
        provide: UIService,
        useValue: mockUIService
      }],
      declarations: [MainViewToggleComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MainViewToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should switch main view', () => {
    expect(component.orthographicView).toBe(false);
    component.switchMainView();
    expect(component.orthographicView).toBe(true);
    expect(mockUIService.toggleOrthographicView).toHaveBeenCalled();
  });
});
