import { CMSLoader } from '../loaders/cms-loader';
import { TestBed, getTestBed } from '@angular/core/testing'
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('CMSLoader', () => {
  
  let injector: TestBed;
  let cmsLoader: CMSLoader;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CMSLoader]
    });
    injector = getTestBed();
    cmsLoader = injector.get(CMSLoader);
  });

});
