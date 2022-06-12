import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EventDisplayService } from '../../../../services/event-display.service';
import { FileNode } from '../../../file-explorer/file-explorer.component';
import { PhoenixUIModule } from '../../../phoenix-ui.module';
import { EventDataExplorerDialogData } from '../event-data-explorer.component';
import {
  EventDataExplorerDialogComponent,
  FileResponse,
} from './event-data-explorer-dialog.component';

describe('EventDataExplorerDialogComponent', () => {
  let component: EventDataExplorerDialogComponent;
  let fixture: ComponentFixture<EventDataExplorerDialogComponent>;

  const mockStateManager = jasmine.createSpyObj('StateManager', [
    'loadStateFromJSON',
  ]);
  const mockEventDisplay = jasmine.createSpyObj(
    'EventDisplayService',
    ['parsePhoenixEvents', 'buildEventDataFromJSON'],
    {
      getStateManager: () => mockStateManager,
    }
  );
  const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
  const mockDialogData: EventDataExplorerDialogData = {
    apiURL: 'http://localhost',
  };

  const mockFileResponse: FileResponse[] = [
    {
      name: 'event_data/test.json',
      url: 'https://example.com/event_data/test.json',
    },
    {
      name: 'event_data/test.xml',
      url: 'https://example.com/event_data/test.xml',
    },
    {
      name: 'config_data/test.json',
      url: 'https://example.com/config_data/test.json',
    },
  ];
  const mockResponse = new Response(JSON.stringify(mockFileResponse), {
    status: 200,
  });

  beforeAll(() => {
    spyOn(mockResponse, 'json').and.resolveTo(mockFileResponse);
    spyOn(window, 'fetch').and.resolveTo(mockResponse);
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

  it('should build file node from response', () => {
    const fileNode: FileNode = (component as any).buildFileNode(
      mockFileResponse
    );

    expect(fileNode.children['event_data'].children['test.json'].name).toBe(
      'test.json'
    );
    expect(fileNode.children['config_data'].children['test.json'].name).toBe(
      'test.json'
    );
  });

  it('should load event based on file type', () => {
    spyOn(
      EventDataExplorerDialogComponent.prototype,
      'makeRequest'
    ).and.callFake(
      (_arg1: string, _arg2: string, onData: (data: string) => void) =>
        onData('test')
    );

    spyOn(component as any, 'loadJSONEvent').and.stub();
    component.loadEvent('https://example.com/event_data/test.json');
    expect((component as any).loadJSONEvent).toHaveBeenCalled();

    spyOn(component as any, 'loadJiveXMLEvent').and.stub();
    component.loadEvent('https://example.com/event_data/test.xml');
    expect((component as any).loadJiveXMLEvent).toHaveBeenCalled();
  });

  it('should load config', () => {
    spyOn(
      EventDataExplorerDialogComponent.prototype,
      'makeRequest'
    ).and.callFake(
      (_arg1: string, _arg2: string, onData: (data: string) => void) =>
        onData('{}')
    );

    component.loadConfig('https://example.com/config_data/test.json');

    expect(mockStateManager.loadStateFromJSON).toHaveBeenCalledWith({});
  });
});
