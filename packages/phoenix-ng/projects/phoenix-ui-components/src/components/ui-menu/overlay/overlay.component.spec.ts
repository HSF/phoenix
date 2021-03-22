import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OverlayComponent } from './overlay.component';
import { ElementRef } from '@angular/core';
import { PhoenixUIModule } from '../../phoenix-ui.module';

describe('OverlayComponent', () => {
  let component: OverlayComponent;
  let fixture: ComponentFixture<OverlayComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
      declarations: [OverlayComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize to not be resizable', () => {
    component.resizable = false;
    component.ngAfterViewInit();
    expect(component.resizeHandleCorner).toBeFalsy();
  });

  it('should initialize to be resizable', async () => {
    component.resizable = true;
    component.showBody = true;

    // Creating a mock resize handle corner
    component.resizeHandleCorner = new ElementRef(
      document.createElement('span')
    );
    component.ngAfterViewInit();

    expect(component.resizeHandleCorner.nativeElement.style.bottom).toBe('0px');
    expect(component.resizeHandleCorner.nativeElement.style.right).toBe('0px');
  });

  describe('OverlayComponent with overlay element', () => {
    beforeEach(() => {
      // Creating mock elements
      component.resizable = true;
      component.showBody = true;
      component.resizeHandleCorner = new ElementRef(
        document.createElement('span')
      );
      component.overlayCard = new ElementRef(document.createElement('div'));
    });

    it('should resize', () => {
      spyOn(component as any, 'setHandleTransform').and.callThrough();
      component.onResize();

      expect((component as any).setHandleTransform).toHaveBeenCalled();
    });
  });
});
