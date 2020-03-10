import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjectSelectionComponent } from './object-selection.component';
import { AppModule } from 'src/app/app.module';

describe('ObjectSelectionComponent', () => {
  let component: ObjectSelectionComponent;
  let fixture: ComponentFixture<ObjectSelectionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [AppModule]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ObjectSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
