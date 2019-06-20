import {TestBed} from '@angular/core/testing';

import {JsonLoaderService} from './json-loader.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';

describe('JsonLoaderService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [HttpClientTestingModule]
  }));

  it('should be created', () => {
    const service: JsonLoaderService = TestBed.get(JsonLoaderService);
    expect(service).toBeTruthy();
  });
});
