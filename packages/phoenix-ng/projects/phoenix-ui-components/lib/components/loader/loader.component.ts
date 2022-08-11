import { Component, Input } from '@angular/core';
import { ErrorMessageService } from '../../services/error-message-service';

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss'],
})
export class LoaderComponent {
  @Input() loaded = false;
  @Input() progress: number;
  public error: Error;

  constructor(private errorMessageService: ErrorMessageService) {
    this.errorMessageService.subscribeToError((error) => {
      if (!this.loaded) {
        this.error = error;
      }
    });
  }
}
