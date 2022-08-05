// not a component still needs to be tested
import { AttributePipe } from './attribute.pipe';

describe('AttributePipe', () => {
  let attributePipe: AttributePipe;

  beforeEach(() => {
    attributePipe = new AttributePipe();
  });

  it('should create', () => {
    expect(attributePipe).toBeTruthy();
  });

  it('should transform an array to a string', () => {
    const value = ['a', 'b', 'c'];
    const result = attributePipe.transform(value);

    expect(result).toBe('\na\nb\nc\n');
  });

  it('should transform a string to a string', () => {
    const value = 'a';
    const result = attributePipe.transform(value);

    expect(result).toBe('a');
  });
});
