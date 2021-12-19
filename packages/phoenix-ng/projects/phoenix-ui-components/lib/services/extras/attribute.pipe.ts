import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe for transforming selected object attributes to a better format.
 */
@Pipe({
  name: 'attributePipe',
})
export class AttributePipe implements PipeTransform {
  /**
   * Transform the attribute to a better presentable format.
   * @param value Value to be transformed.
   * @param args Additional arguments.
   * @returns The transformed value.
   */
  transform(value: any, args?: any): any {
    let transformedValue = '';
    if (Array.isArray(value)) {
      transformedValue += '\n';
      value.forEach((v) => (transformedValue += v + '\n'));
    } else {
      transformedValue = value.toString();
    }
    return transformedValue;
  }
}
