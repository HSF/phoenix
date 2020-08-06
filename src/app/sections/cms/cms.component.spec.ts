import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CMSComponent } from './cms.component';
import { AppModule } from '../../app.module';
import { EventdisplayService } from '../../services/eventdisplay.service';
import { HttpClient } from '@angular/common/http';

describe('CMSComponent', () => {
  let component: CMSComponent;
  let fixture: ComponentFixture<CMSComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [HttpClient, EventdisplayService]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CMSComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Test if three.js is initialized
  it('should initialize three.js canvas', () => {
    component.ngOnInit();
    expect(document.getElementById('three-canvas')).toBeTruthy();
  });
});
