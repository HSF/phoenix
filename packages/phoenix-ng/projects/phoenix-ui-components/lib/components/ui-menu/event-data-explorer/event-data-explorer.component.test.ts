import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';

import { PhoenixUIModule } from '../../phoenix-ui.module';
import { EventDataExplorerComponent } from './event-data-explorer.component';

describe('EventDataExplorerComponent', () => {
  let component: EventDataExplorerComponent;
  let fixture: ComponentFixture<EventDataExplorerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
      providers: [
        {
          provide: MatDialog,
          useValue: {
            open: jest.fn(),
          },
        },
      ],
      declarations: [EventDataExplorerComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EventDataExplorerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open the event data explorer dialog', () => {
    jest.spyOn(component['dialog'], 'open');
    component.openEventDataExplorerDialog();
    expect(component['dialog'].open).toHaveBeenCalled();
  });
});
