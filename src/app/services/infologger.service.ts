import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class InfoLoggerService {

  // List that contains all the info logs
  private infoLoggerList: any[] = [];
  private maxEntries: number = 10;

  /**
   * Add an entry to the info logger
   * @param data Data of the info log
   * @param label (Optional) Label of the info log
   */
  add(data: string, label?: string) {
    if (this.infoLoggerList.length > this.maxEntries) {
      this.infoLoggerList.shift();
    }
    this.infoLoggerList.push(label ? (label + ': ' + data) : data);
  }

  /**
   * Returns the info logger list being used by the info logger service
   */
  getInfoLoggerList(): any[] {
    return this.infoLoggerList;
  }
}
