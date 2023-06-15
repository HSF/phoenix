import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewOptionsConfigComponent } from './view-options-config.component';

describe('ViewOptionsConfigComponent', () => {
  let component: ViewOptionsConfigComponent;
  let fixture: ComponentFixture<ViewOptionsConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ViewOptionsConfigComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewOptionsConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
