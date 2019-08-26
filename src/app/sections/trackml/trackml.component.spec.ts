import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackmlComponent } from './trackml.component';

describe('TrackmlComponent', () => {
  let component: TrackmlComponent;
  let fixture: ComponentFixture<TrackmlComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TrackmlComponent ],
      imports: [HttpClientTestingModule]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TrackmlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
