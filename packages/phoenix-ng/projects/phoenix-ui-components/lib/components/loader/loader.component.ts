import { Component, Input, type OnDestroy } from '@angular/core';
import { ErrorMessageService } from '../../services/error-message-service';

@Component({
  standalone: false,
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss'],
})
export class LoaderComponent implements OnDestroy {
  @Input() loaded = false;
  @Input() progress: number;
  public error: Error;
  private unsubscribeError: () => void;

  constructor(private errorMessageService: ErrorMessageService) {
    this.unsubscribeError = this.errorMessageService.subscribeToError(
      (error) => {
        if (!this.loaded) {
          this.error = error;
        }
      },
    );
  }

  ngOnDestroy() {
    this.unsubscribeError();
  }
}
