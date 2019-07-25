import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {PlaygroundVrComponent} from './playground-vr.component';
import {AttributePipe} from '../../services/extras/attribute.pipe';
import {HttpClientTestingModule} from '@angular/common/http/testing';

describe('PlaygroundVrComponent', () => {
  let component: PlaygroundVrComponent;
  let fixture: ComponentFixture<PlaygroundVrComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PlaygroundVrComponent, AttributePipe],
      imports: [HttpClientTestingModule]
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
