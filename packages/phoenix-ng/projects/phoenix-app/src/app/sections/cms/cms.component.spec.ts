import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CMSComponent } from './cms.component';
import { AppModule } from '../../app.module';
import { EventDisplayService } from 'phoenix-ui-components';
import { HttpClient } from '@angular/common/http';

describe('CMSComponent', () => {
  let component: CMSComponent;
  let fixture: ComponentFixture<CMSComponent>;

  let eventDisplayService: EventDisplayService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [HttpClient, EventDisplayService],
    }).compileComponents();

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
  it('should initialize three.js canvas', () => {
    spyOn(eventDisplayService, 'parsePhoenixEvents').and.stub();
    component.ngOnInit();
    expect(document.getElementById('three-canvas')).toBeTruthy();
  });
});
