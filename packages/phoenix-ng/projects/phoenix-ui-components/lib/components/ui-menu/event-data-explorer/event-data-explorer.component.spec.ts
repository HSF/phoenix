import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatDialog } from '@angular/material/dialog';
import { EventDataExplorerComponent } from 'phoenix-ui-components';

describe('EventDataExplorerComponent', () => {
  let component: EventDataExplorerComponent;
  let fixture: ComponentFixture<EventDataExplorerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
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
