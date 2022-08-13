import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { ErrorMessageService } from './error-message-service';

/**
 * Global handler for handling app/module wide errors.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  /**
   * Instantiate the global error handler.
   * @param injector Injector for getting the error message service.
   */
  constructor(private injector: Injector) {}

  /**
   * A handler for handling the global error that occurs in the app.
   * @param error The error that occurred.
   */
  handleError(error: Error) {
    console.error('ERROR IN PHOENIX APP', error);
    this.injector.get(ErrorMessageService).setError(error);
  }
}
