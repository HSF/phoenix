import { TestBed } from '@angular/core/testing';

import { EventdisplayService } from '../eventdisplay.service';
import { AppModule } from 'src/app/app.module';

describe('EventdisplayService', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [AppModule] }));

  it('should be created', () => {
    const service: EventdisplayService = TestBed.inject(EventdisplayService);
    expect(service).toBeTruthy();
  });
});
