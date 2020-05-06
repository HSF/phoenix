import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {

  // List that contains all the logs
  private loggerList: any[] = [];
  private maxEntries: number = 10;

  /**
   * Add an entry to the logger
   * @param data Data of the log
   * @param label (Optional) Label of the log
   */
  add(data: string, label?: string) {
    if (this.loggerList.length > this.maxEntries) {
      this.loggerList.shift();
    }
    this.loggerList.push(label ? (label + ': ' + data) : data);
  }

  /**
   * Returns the logger list being used by the logger service
   */
  getLoggerList(): any[] {
    return this.loggerList;
  }
}
