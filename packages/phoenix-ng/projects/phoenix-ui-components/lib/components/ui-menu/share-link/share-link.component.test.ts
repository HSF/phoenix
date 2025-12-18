import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ShareLinkComponent } from './share-link.component';
import { PhoenixUIModule } from 'phoenix-ui-components';

describe('ShareLinkComponent', () => {
  let component: ShareLinkComponent;
  let fixture: ComponentFixture<ShareLinkComponent>;

  const mockDialog = {
    open: jest.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
      declarations: [ShareLinkComponent],
      providers: [
        {
          provide: MatDialog,
          useValue: mockDialog,
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ShareLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open share link dialog', () => {
    const dialogSpy = jest.spyOn(mockDialog, 'open');
    component.openShareLinkDialog();
    expect(dialogSpy).toHaveBeenCalled();
  });
});
