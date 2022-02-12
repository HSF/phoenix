import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EventDisplayService } from '../../../../services/event-display.service';
import { PhoenixUIModule } from '../../../phoenix-ui.module';
import { EventDataExplorerDialogData } from '../event-data-explorer.component';
import {
  EventDataExplorerDialogComponent,
  FileResponse,
} from './event-data-explorer-dialog.component';

fdescribe('EventDataExplorerDialogComponent', () => {
  let component: EventDataExplorerDialogComponent;
  let fixture: ComponentFixture<EventDataExplorerDialogComponent>;

  const mockEventDisplay = jasmine.createSpyObj('EventDisplayService', [
    'parsePhoenixEvents',
    'buildEventDataFromJSON',
    'getStateManager',
  ]);
  const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
  const mockDialogData: EventDataExplorerDialogData = {
    apiURL: 'http://localhost',
  };

  beforeAll(() => {
    const responseInit: ResponseInit = {
      status: 200,
    };
    const mockData: FileResponse[] = [
      {
        name: 'event_data/test.json',
        url: 'https://example.com/event_data/test.json',
      },
      {
        name: 'config_data/test.json',
        url: 'https://example.com/config_data/test.json',
      },
    ];

    const response = new Response(JSON.stringify(mockData), responseInit);

    spyOn(response, 'json').and.returnValue(Promise.resolve(mockData));
    spyOn(window, 'fetch').and.returnValue(Promise.resolve(response));
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, PhoenixUIModule],
      declarations: [EventDataExplorerDialogComponent],
      providers: [
        {
          provide: EventDisplayService,
          useValue: mockEventDisplay,
        },
        {
          provide: MatDialogRef,
          useValue: mockDialogRef,
        },
        {
          provide: MAT_DIALOG_DATA,
          useValue: mockDialogData,
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EventDataExplorerDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
