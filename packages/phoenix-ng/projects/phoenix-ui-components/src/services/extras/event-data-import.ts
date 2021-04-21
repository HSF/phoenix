export enum EventDataFormat {
  JSON = 'JSON',
  JIVEXML = 'JIVEXML',
  IG = 'IG',
  ZIP = 'ZIP',
}

export type EventDataImportOption = EventDataFormat | ImportOption;

export class ImportOption {
  constructor(
    public format: string,
    public fileType: string,
    public handler: (files: FileList) => void,
    public accept?: string
  ) {}
}
