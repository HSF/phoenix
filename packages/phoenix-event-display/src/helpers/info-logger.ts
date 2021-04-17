/**
 * Logger for logging event display data
 */
export class InfoLogger {
  /** List that contains all the info logs */
  private infoLoggerList: any[] = [];
  /** Max entries to be shown inside the information panel */
  private maxEntries: number = 10;

  /**
   * Add an entry to the info logger
   * @param data Data of the info log
   * @param label Label of the info log
   */
  add(data: string, label?: string) {
    if (this.infoLoggerList.length > this.maxEntries) {
      this.infoLoggerList.pop();
    }
    this.infoLoggerList.unshift(label ? label + ': ' + data : data);
  }

  /**
   * Get the info logger list being used by the info logger service
   * @returns The info logger list containing log data
   */
  getInfoLoggerList(): any[] {
    return this.infoLoggerList;
  }
}
