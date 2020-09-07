import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CMSComponent } from './cms.component';
import { AppModule } from '../../app.module';
import { EventDisplayService } from '../../services/eventdisplay.service';
import { HttpClient } from '@angular/common/http';

describe('CMSComponent', () => {
  let component: CMSComponent;
  let fixture: ComponentFixture<CMSComponent>;

  let eventDisplayService: EventDisplayService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [HttpClient, EventDisplayService]
    })
      .compileComponents();

    eventDisplayService = TestBed.get(EventDisplayService);
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
  it('should initialize three.js canvas', (done) => {
    spyOn(eventDisplayService, 'parsePhoenixEvents').and.stub();
    component.ngOnInit();
    // Wait for JSRoot scripts to load and geometry to load
    setTimeout(done, 5000);
    expect(document.getElementById('three-canvas')).toBeTruthy();
  }, 6000);
});
