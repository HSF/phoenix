import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'attributePipe'
})
export class AttributePipe implements PipeTransform {

  transform(value: any, args?: any): any {
    let transformedValue = '';
    if (Array.isArray(value)) {
      transformedValue += '\n';
      value.forEach((v) => transformedValue += v + '\n');
    } else {
      transformedValue = value.toString();
    }
    return transformedValue;
  }

}
