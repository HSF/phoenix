import { Color } from 'three';
import { parseColor } from '../../helpers/color-utils';

describe('parseColor', () => {
  let consoleWarn: jest.SpyInstance;

  beforeEach(() => {
    // `Color.set` warns for anything it cannot parse, so a warning means a
    // value reached it which should have been rejected first.
    consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarn.mockRestore();
  });

  it.each([
    // The same color is written in all of these ways in event data.
    ['ff0000', 'ff0000'],
    ['#ff0000', 'ff0000'],
    ['0xff0000', 'ff0000'],
    ['0x777777', '777777'],
    ['#8FF0A4', '8ff0a4'],
    ['f00', 'ff0000'],
    ['#f00', 'ff0000'],
    ['  #0adb2d  ', '0adb2d'],
    ['red', 'ff0000'],
    ['rgb(255, 0, 0)', 'ff0000'],
    [0xff0000, 'ff0000'],
    [0, '000000'],
  ])('should parse %p as #%s', (value, expected) => {
    expect(parseColor(value)?.getHexString()).toBe(expected);
    expect(consoleWarn).not.toHaveBeenCalled();
  });

  it('should copy a color instead of returning the same instance', () => {
    const color = new Color(0x00ff00);
    const parsed = parseColor(color);

    expect(parsed?.getHexString()).toBe('00ff00');
    expect(parsed).not.toBe(color);
  });

  it.each([
    [undefined],
    [null],
    [''],
    ['zzzzzz'],
    ['#12345'],
    // Hexadecimal of a length which is not a valid color.
    ['12'],
    [NaN],
    [{}],
  ])(
    'should return undefined for %p rather than a wrong color',
    (value: any) => {
      expect(parseColor(value)).toBeUndefined();
      expect(consoleWarn).not.toHaveBeenCalled();
    },
  );
});
