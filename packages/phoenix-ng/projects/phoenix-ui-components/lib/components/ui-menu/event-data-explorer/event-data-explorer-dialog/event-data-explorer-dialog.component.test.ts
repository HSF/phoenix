import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EventDisplayService } from '../../../../services/event-display.service';
import { FileNode } from '../../../file-explorer/file-explorer.component';
import { FileLoaderService } from '../../../../services/file-loader.service';
import { PhoenixUIModule } from '../../../phoenix-ui.module';
import { EventDataExplorerDialogData } from '../event-data-explorer.component';
import {
  EventDataExplorerDialogComponent,
  FileResponse,
} from './event-data-explorer-dialog.component';

describe.skip('EventDataExplorerDialogComponent', () => {
  let component: EventDataExplorerDialogComponent;
  let fixture: ComponentFixture<EventDataExplorerDialogComponent>;

  const mockStateManager = {
    loadStateFromJSON: jest.fn(),
  };

  const mockFileLoaderService = {
    loadEvent: jest.fn(),
  };

  const mockEventDisplay = {};

  const mockDialogRef = {
    close: jest.fn(),
  };

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

  beforeAll(() => {
    const mockResponse = new Response(JSON.stringify(mockFileResponse), {
      status: 200,
    });
    jest.spyOn(mockResponse, 'json').mockResolvedValue(mockFileResponse);
    jest.spyOn(window, 'fetch').mockResolvedValue(mockResponse);
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

  it.only('should create', () => {
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
    jest
      .spyOn(FileLoaderService.prototype, 'loadEvent')
      .mockImplementation(
        (_arg1: string, eventDisplay: EventDisplayService) => true
      );

    jest.spyOn(FileLoaderService.prototype, 'loadEvent');
    component.loadEvent('https://example.com/event_data/test.json');
    expect(mockFileLoaderService.loadEvent).toHaveBeenCalled();
  });

  it('should load config', () => {
    jest
      .spyOn(FileLoaderService.prototype, 'makeRequest')
      .mockImplementation(
        (
          _arg1: string,
          _arg2: 'json' | 'blob' | 'text',
          onData: (data: any) => void
        ) => {
          onData('{}');
          return true;
        }
      );
    component.loadConfig('https://example.com/config_data/test.json');
    expect(mockStateManager.loadStateFromJSON).toHaveBeenCalledWith({});
  });
});
