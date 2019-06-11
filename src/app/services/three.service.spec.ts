import { TestBed } from '@angular/core/testing';

import { ThreeService } from './three.service';

describe('ThreeService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ThreeService = TestBed.get(ThreeService);
    expect(service).toBeTruthy();
  });
});
