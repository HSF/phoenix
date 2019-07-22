import {async, ComponentFixture, inject, TestBed} from '@angular/core/testing';

import {PlaygroundVrComponent} from './playground-vr.component';
import {AttributePipe} from '../../services/extras/attribute.pipe';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {HttpClient} from '@angular/common/http';

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

  it('should load sample json file', inject([HttpClient], (http: HttpClient) => {
    http.get('../../assets/files/atlaseventdump2.json').subscribe((res) => component.processJSON(res));
  }));

  it('should multi-event file and change event', inject([HttpClient], (http: HttpClient) => {
    http.get('../../assets/files/atlaseventdump2.json').subscribe((res) => {
      component.processJSON(res);
      if (component.events[1]) {
        const selected = {target: {value: component.events[1]}};
        component.onOptionsSelected(selected);
      }
    });
  }));

  it('should load sample json file and save the scene', inject([HttpClient], (http: HttpClient) => {
    http.get('../../assets/files/atlaseventdump2.json').subscribe((res) => {
      const text = JSON.stringify(res, null, 2);
      const blob = new Blob([text], {type: 'application/json'});
      component.handleEventDataInput([blob]);
      component.saveConfiguration();
    });
  }));

  it('should sample obj file', inject([HttpClient], (http: HttpClient) => {
    http.get('../../assets/files/toroids.obj').subscribe((res) => {
      component.processOBJ(res, 'Pix');
    });
  }));

  it('should load scene', inject([HttpClient], (http: HttpClient) => {
    http.get('../../assets/files/phoenix-scene.gltf').subscribe((res) => {
      const content = JSON.stringify(res, null, 2);
      component.processGLTF(content);
    });
  }));

  it('should toggle info', () => {
    const info = component.hiddenInfo;
    component.toggleInfo();
    expect(component.hiddenInfo).toBe(!info);
  });
});
