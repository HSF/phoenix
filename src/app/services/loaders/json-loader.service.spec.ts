import { TestBed } from '@angular/core/testing';

import { JsonLoaderService } from './json-loader.service';

describe('JsonLoaderService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: JsonLoaderService = TestBed.get(JsonLoaderService);
    expect(service).toBeTruthy();
  });
});
