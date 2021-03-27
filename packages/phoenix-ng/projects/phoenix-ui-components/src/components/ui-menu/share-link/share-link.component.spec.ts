import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShareLinkComponent } from './share-link.component';

describe('ShareLinkComponent', () => {
  let component: ShareLinkComponent;
  let fixture: ComponentFixture<ShareLinkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ShareLinkComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ShareLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
