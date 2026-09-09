import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BehaviorSubject } from 'rxjs';
import { PhoenixUIModule } from 'phoenix-ui-components';
import { DownloadAnimationDialogComponent } from './download-animation-dialog.component';

describe('DownloadAnimationDialogComponent', () => {
  let component: DownloadAnimationDialogComponent;
  let progress$: BehaviorSubject<number>;

  beforeEach(() => {
    progress$ = new BehaviorSubject<number>(0);

    TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
      declarations: [DownloadAnimationDialogComponent],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: { progress$ },
        },
      ],
    }).compileComponents();

    component = TestBed.createComponent(
      DownloadAnimationDialogComponent,
    ).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should track the reported progress', () => {
    component.ngOnInit();
    progress$.next(42);

    expect(component.progress).toBe(42);
  });

  it('should stop listening to progress once destroyed', () => {
    component.ngOnInit();
    progress$.next(30);

    component.ngOnDestroy();
    progress$.next(90);

    // The dialog is gone, so late progress must not reach it.
    expect(component.progress).toBe(30);
    expect(progress$.observed).toBe(false);
  });
});
