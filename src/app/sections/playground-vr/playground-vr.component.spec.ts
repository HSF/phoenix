import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaygroundVrComponent } from './playground-vr.component';
import { AppModule } from 'src/app/app.module';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { EventdisplayService } from '../../services/eventdisplay.service';

describe('PlaygroundVrComponent', () => {
  let component: PlaygroundVrComponent;
  let fixture: ComponentFixture<PlaygroundVrComponent>;

  let http: HttpClient;
  let eventDisplayService: EventdisplayService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [HttpClient, EventdisplayService],
      declarations: [PlaygroundVrComponent]
    })
      .compileComponents();

    http = TestBed.get(HttpClient);
    eventDisplayService = TestBed.get(EventdisplayService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlaygroundVrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize VR playground', async () => {
    spyOn(eventDisplayService, 'buildEventDataFromJSON').and.stub();

    // Need a real JiveXML file to test
    await fetch('assets/files/JiveXML/JiveXML_336567_2327102923.xml')
      .then(res => res.text())
      .then(res => {
        spyOn(http, 'get').and.returnValue(of(res));
        component.ngOnInit();

        expect(eventDisplayService.buildEventDataFromJSON).toHaveBeenCalled();
      });
  });
});
