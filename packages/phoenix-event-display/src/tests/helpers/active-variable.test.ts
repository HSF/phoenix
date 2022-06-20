import { ActiveVariable } from '../../../src/helpers/active-variable';

describe('ActiveVariable', () => {
  let activeVariable: ActiveVariable<number>;

  beforeEach(() => {
    activeVariable = new ActiveVariable();
  });

  test('should exist', () => {
    expect(activeVariable.value).toBeUndefined();
  });

  test('should update', () => {
    activeVariable.update(1);
    expect(activeVariable.value).toBe(1);
  });

  test('should call callback', () => {
    const callback = jest.fn();
    activeVariable.onUpdate(callback);
    activeVariable.update(1);
    expect(callback).toHaveBeenCalledWith(1);
  });

  test('should call multiple callbacks', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    activeVariable.onUpdate(callback1);
    activeVariable.onUpdate(callback2);
    activeVariable.update(1);
    expect(callback1).toHaveBeenCalledWith(1);
    expect(callback2).toHaveBeenCalledWith(1);
  });

  test('should not call callback if not subscribed', () => {
    const callback = jest.fn();
    activeVariable.update(1);
    expect(callback).not.toHaveBeenCalled();
  });
});
