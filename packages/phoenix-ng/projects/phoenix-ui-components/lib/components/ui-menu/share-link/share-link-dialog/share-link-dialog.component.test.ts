import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PhoenixUIModule } from '../../../phoenix-ui.module';

import { ShareLinkDialogComponent } from './share-link-dialog.component';

describe('ShareLinkDialogComponent', () => {
  let component: ShareLinkDialogComponent;
  let fixture: ComponentFixture<ShareLinkDialogComponent>;

  const mockDialogRef = {
    close: jest.fn(),
  };

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

  afterEach(() => {
    component.onClose();
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.baseLink).toBeTruthy();
    expect(component.shareLink).toBeTruthy();
    expect(component.embedLink).toBeTruthy();
  });

  it('should set options value and update share link', () => {
    jest.spyOn(component, 'onOptionsChange');

    component.setOptionValue('test_option', 'test_option_value');

    expect(component.onOptionsChange).toHaveBeenCalled();
    expect(component.shareLink.value).toContain(
      'test_option=test_option_value'
    );
  });

  it('should update copy status', () => {
    // document.execCommand is obsolete now, needs a new alternative probably navigator.clipboard.writeText
    document.execCommand = jest.fn();
    //jest.spyOn(document, 'execCommand');

    const element = document.createElement('div');
    element.innerText = 'COPY';
    component.copyText('textToCopy', element);

    expect(element.innerText).toBe('COPIED');
    //expect(document.execCommand).toHaveBeenCalledWith('copy');
  });
});
