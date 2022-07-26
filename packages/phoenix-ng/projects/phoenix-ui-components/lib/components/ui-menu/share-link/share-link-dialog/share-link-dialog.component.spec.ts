import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PhoenixUIModule } from '../../../phoenix-ui.module';

import { ShareLinkDialogComponent } from './share-link-dialog.component';

describe('ShareLinkDialogComponent', () => {
  let component: ShareLinkDialogComponent;
  let fixture: ComponentFixture<ShareLinkDialogComponent>;

  const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, PhoenixUIModule],
      providers: [
        {
          provide: MatDialogRef,
          useValue: mockDialogRef,
        },
      ],
      declarations: [ShareLinkDialogComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ShareLinkDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.baseLink).toBeTruthy();
    expect(component.shareLink).toBeTruthy();
    expect(component.embedLink).toBeTruthy();
  });

  it('set options value and update share link', () => {
    spyOn(component, 'onOptionsChange').and.callThrough();
    component.setOptionValue('test_option', 'test_option_value');
    expect(component.onOptionsChange).toHaveBeenCalled();
    expect(component.shareLink.value).toContain(
      'test_option=test_option_value'
    );
    // Else case
    component.setOptionValue('type', undefined);
  });

  it('should update copy status', () => {
    spyOn(document, 'execCommand').and.callThrough();

    const element = document.createElement('div');
    element.innerText = 'COPY';
    component.copyText('textToCopy', element);

    expect(element.innerText).toBe('COPIED');
    expect(document.execCommand).toHaveBeenCalledWith('copy');
  });
});
