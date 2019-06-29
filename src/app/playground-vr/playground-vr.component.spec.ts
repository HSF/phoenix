import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaygroundVrComponent } from './playground-vr.component';

describe('PlaygroundVrComponent', () => {
  let component: PlaygroundVrComponent;
  let fixture: ComponentFixture<PlaygroundVrComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PlaygroundVrComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlaygroundVrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
