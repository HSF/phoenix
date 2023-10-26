import { Injectable } from '@angular/core';
import JSZip from 'jszip';
import { EventDisplayService } from './event-display.service';
import { JiveXMLLoader } from 'phoenix-event-display';

/**
 * Service makeing file loading easier
 */
@Injectable({
  providedIn: 'root',
})
export class FileLoaderService {
  private lastEventsURL: string = '';
  private lastEventsOptions: boolean = false;

  async unzip(data: ArrayBuffer) {
    const archive = new JSZip();
    await archive.loadAsync(data);
    let fileData = '';
    let multiFile = false;
    for (const filePath in archive.files) {
      if (multiFile) {
        console.error(
          'Zip archive contains more than one file. Ignoring all but first',
        );
        break;
      }
      fileData = await archive.file(filePath).async('string');
      multiFile = true;
    }
    return fileData;
  }

  // returns whether an error was found
  makeRequest(
    urlPath: string,
    responseType: 'json' | 'text' | 'blob',
    onData: (data: any) => void,
    options: any = {},
  ) {
    fetch(urlPath, options)
      .then((res) => res[responseType]())
      .then((data) => {
        if (responseType === 'blob') {
          data
            .arrayBuffer()
            .then((buf) => this.unzip(buf))
            .then((d) => onData(d));
        } else {
          onData(data);
        }
      })
      .catch((error) => {
        console.error(error);
        return true;
      });
    return false;
  }

  loadJSONEvent(eventData: string, eventDisplay: EventDisplayService) {
    eventDisplay.parsePhoenixEvents(JSON.parse(eventData));
  }

  loadJiveXMLEvent(eventData: string, eventDisplay: EventDisplayService) {
    const jiveXMLLoader = new JiveXMLLoader();
    jiveXMLLoader.process(eventData);
    const processedEventData = jiveXMLLoader.getEventData();
    eventDisplay.buildEventDataFromJSON(processedEventData);
  }

  loadEvent(
    file: string,
    eventDisplay: EventDisplayService,
    options: any = {},
  ) {
    this.lastEventsURL = file;
    this.lastEventsOptions = options;
    const isZip = file.split('.').pop() === 'zip';
    const rawfile = isZip ? file.substring(0, file.length - 4) : file;
    return this.makeRequest(
      file,
      isZip ? 'blob' : 'text',
      (eventData) => {
        switch (rawfile.split('.').pop()) {
          case 'xml':
            this.loadJiveXMLEvent(eventData, eventDisplay);
            break;
          case 'json':
            this.loadJSONEvent(eventData, eventDisplay);
            break;
        }
      },
      options,
    );
  }

  reloadLastEvents(eventDisplay: EventDisplayService) {
    if (this.lastEventsURL.length > 0) {
      this.loadEvent(this.lastEventsURL, eventDisplay, this.lastEventsOptions);
    }
  }
}
