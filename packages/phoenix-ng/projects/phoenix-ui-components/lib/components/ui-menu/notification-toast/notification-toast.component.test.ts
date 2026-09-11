import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationToastComponent } from './notification-toast.component';
import { NotificationService } from '../../../services/notification.service';

describe('NotificationToastComponent', () => {
  let component: NotificationToastComponent;
  let fixture: ComponentFixture<NotificationToastComponent>;
  let notificationService: NotificationService;
  let snackBarSpy: jest.SpyInstance;
  let mockSnackBar: { open: jest.Mock };

  beforeEach(async () => {
    mockSnackBar = { open: jest.fn() };

    await TestBed.configureTestingModule({
      declarations: [NotificationToastComponent],
      providers: [
        NotificationService,
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationToastComponent);
    component = fixture.componentInstance;
    notificationService = TestBed.inject(NotificationService);
    snackBarSpy = mockSnackBar.open;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show snack bar on success notification', () => {
    notificationService.success('File loaded.');
    expect(snackBarSpy).toHaveBeenCalledWith(
      'File loaded.',
      'Close',
      expect.objectContaining({
        panelClass: ['notification-success'],
      }),
    );
  });

  it('should show snack bar on error notification', () => {
    notificationService.error('Something went wrong.');
    expect(snackBarSpy).toHaveBeenCalledWith(
      'Something went wrong.',
      'Close',
      expect.objectContaining({
        panelClass: ['notification-error'],
        duration: 0,
      }),
    );
  });

  it('should show snack bar on warning notification', () => {
    notificationService.warning('Large file detected.');
    expect(snackBarSpy).toHaveBeenCalledWith(
      'Large file detected.',
      'Close',
      expect.objectContaining({
        panelClass: ['notification-warning'],
      }),
    );
  });

  it('should show snack bar on info notification', () => {
    notificationService.info('Loading event data.');
    expect(snackBarSpy).toHaveBeenCalledWith(
      'Loading event data.',
      'Close',
      expect.objectContaining({
        panelClass: ['notification-info'],
      }),
    );
  });

  it('should unsubscribe on destroy', () => {
    const unsubscribeSpy = jest.fn();
    (component as any).unsubscribe = unsubscribeSpy;
    component.ngOnDestroy();
    expect(unsubscribeSpy).toHaveBeenCalled();
  });
});
