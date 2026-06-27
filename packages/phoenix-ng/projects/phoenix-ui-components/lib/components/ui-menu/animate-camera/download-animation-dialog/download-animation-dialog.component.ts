import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable } from 'rxjs';

@Component({
  standalone: false,
  selector: 'app-download-animation-dialog',
  templateUrl: './download-animation-dialog.component.html',
  styleUrls: ['./download-animation-dialog.component.scss'],
})
export class DownloadAnimationDialogComponent implements OnInit {
  progress = 0;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { progress$: Observable<number> },
  ) {}

  ngOnInit(): void {
    this.data.progress$.subscribe((val) => {
      this.progress = val;
    });
  }
}
