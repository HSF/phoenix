import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable, Subscription } from 'rxjs';

@Component({
  standalone: false,
  selector: 'app-download-animation-dialog',
  templateUrl: './download-animation-dialog.component.html',
  styleUrls: ['./download-animation-dialog.component.scss'],
})
export class DownloadAnimationDialogComponent implements OnInit, OnDestroy {
  progress = 0;
  private progressSub?: Subscription;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { progress$: Observable<number> },
  ) {}

  ngOnInit(): void {
    this.progressSub = this.data.progress$.subscribe((val) => {
      this.progress = val;
    });
  }

  ngOnDestroy(): void {
    // `progress$` is a BehaviorSubject that is never completed, so the
    // subscription outlives the dialog unless it is dropped here.
    this.progressSub?.unsubscribe();
  }
}
