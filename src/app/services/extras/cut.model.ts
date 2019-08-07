export class Cut {
  field: string;
  minValue: number;
  maxValue: number;

  constructor(field: string, minValue: number, maxValue: number) {
    this.field = field;
    this.minValue = minValue;
    this.maxValue = maxValue;
  }
}
