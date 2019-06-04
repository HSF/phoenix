import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AtlasComponent } from './atlas.component';

describe('AtlasComponent', () => {
  let component: AtlasComponent;
  let fixture: ComponentFixture<AtlasComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AtlasComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AtlasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
