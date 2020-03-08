import { TestBed } from '@angular/core/testing';

import { UIService } from '../ui.service';

describe('UIService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: UIService = TestBed.inject(UIService);
    expect(service).toBeTruthy();
  });
});
