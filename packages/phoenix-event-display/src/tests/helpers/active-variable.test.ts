import { ActiveVariable } from '../../../src/helpers/active-variable';

describe('ActiveVariable', () => {
  let activeVariable: ActiveVariable<number>;

  beforeEach(() => {
    activeVariable = new ActiveVariable();
  });

  afterEach(() => {
    activeVariable = undefined;
  });

  it('should exist', () => {
    expect(activeVariable.value).toBeUndefined();
  });

  it('should update the value of variable', () => {
    activeVariable.update(1);
    expect(activeVariable.value).toBe(1);
  });

  it('should call a function on updating the value of variable', () => {
    const callback = jest.fn();
    activeVariable.onUpdate(callback);
    activeVariable.update(1);
    expect(callback).toHaveBeenCalledWith(1);
  });

  it('should call multiple callbacks', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    activeVariable.onUpdate(callback1);
    activeVariable.onUpdate(callback2);
    activeVariable.update(1);
    expect(callback1).toHaveBeenCalledWith(1);
    expect(callback2).toHaveBeenCalledWith(1);
    expect(callback1).toHaveBeenCalledTimes(1);
  });
});
