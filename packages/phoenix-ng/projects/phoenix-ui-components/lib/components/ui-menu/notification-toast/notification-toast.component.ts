import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationService } from '../../../services/notification.service';

/**
 * Component that subscribes to NotificationService and displays
 * transient toast notifications via MatSnackBar.
 *
 * Severity levels map to CSS panel classes:
 * - success → notification-success
 * - info    → notification-info
 * - warning → notification-warning
 * - error   → notification-error
 */
@Component({
  standalone: false,
  selector: 'app-notification-toast',
  templateUrl: './notification-toast.component.html',
  styleUrls: ['./notification-toast.component.scss'],
})
export class NotificationToastComponent implements OnInit, OnDestroy {
  private unsubscribe: () => void;

  constructor(
    private notificationService: NotificationService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.unsubscribe = this.notificationService.subscribeToNotifications(
      (notification) => {
        this.snackBar.open(notification.message, 'Close', {
          duration: notification.duration,
          panelClass: [`notification-${notification.severity}`],
          horizontalPosition: 'right',
          verticalPosition: 'bottom',
        });
      },
    );
  }

  ngOnDestroy(): void {
    this.unsubscribe?.();
  }
}
