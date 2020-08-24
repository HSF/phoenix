import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DarkThemeComponent } from './dark-theme.component';
import { AppModule } from '../../../app.module';
import { UIService } from '../../../services/ui.service';

describe('DarkThemeComponent', () => {
  let component: DarkThemeComponent;
  let fixture: ComponentFixture<DarkThemeComponent>;

  let uiService: UIService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [UIService],
      declarations: [DarkThemeComponent]
    })
      .compileComponents();

    uiService = TestBed.get(UIService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DarkThemeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initially get dark theme', () => {
    spyOn(uiService, 'getDarkTheme').and.callThrough();

    component.ngOnInit();
    expect(uiService.getDarkTheme).toHaveBeenCalled();
  });

  it('should set/toggle dark theme', () => {
    spyOn(uiService, 'setDarkTheme').and.callThrough();

    expect(component.darkTheme).toBeFalsy();
    component.setDarkTheme();
    expect(component.darkTheme).toBe(true);

    expect(uiService.setDarkTheme).toHaveBeenCalled();
  });
});
