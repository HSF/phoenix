import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PhoenixUIModule } from '../../phoenix-ui.module';

import { MakePictureComponent } from './make-picture.component';

describe('MakePictureComponent', () => {
  let component: MakePictureComponent;
  let fixture: ComponentFixture<MakePictureComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
    }).compileComponents();

    fixture = TestBed.createComponent(SSModeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.ngOnInit();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call toggleCrop on slide change', () => {
    const componentDebug = fixture.debugElement;
    const slider = componentDebug.query(By.directive(MatSlideToggle));
    spyOn(component, 'toggleCrop'); // set your spy
    slider.triggerEventHandler('change', null); // triggerEventHandler
    expect(component.toggleCrop).toHaveBeenCalled(); // event has been called
  });
});
