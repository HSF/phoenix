import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let received: any[];

  beforeEach(() => {
    service = new NotificationService();
    received = [];
    service.subscribeToNotifications((n) => received.push(n));
  });

  it('should emit success notification', () => {
    service.success('Operation complete');
    expect(received[0].severity).toBe('success');
    expect(received[0].message).toBe('Operation complete');
    expect(received[0].duration).toBe(5000);
  });

  it('should emit info notification', () => {
    service.info('Loading file');
    expect(received[0].severity).toBe('info');
    expect(received[0].duration).toBe(5000);
  });

  it('should emit warning notification', () => {
    service.warning('File may be malformed');
    expect(received[0].severity).toBe('warning');
    expect(received[0].duration).toBe(8000);
  });

  it('should emit error notification with no auto-dismiss', () => {
    service.error('Could not parse event file');
    expect(received[0].severity).toBe('error');
    expect(received[0].duration).toBe(0);
  });

  it('should respect custom duration', () => {
    service.success('Custom', 3000);
    expect(received[0].duration).toBe(3000);
  });

  it('should support multiple subscribers', () => {
    const second: any[] = [];
    const unsub = service.subscribeToNotifications((n) => second.push(n));

    service.info('Broadcast test');
    expect(received.length).toBe(1);
    expect(second.length).toBe(1);

    unsub();
  });
});
