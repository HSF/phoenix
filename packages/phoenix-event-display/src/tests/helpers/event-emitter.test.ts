import { EventEmitter } from '../../helpers/event-emitter';

describe('EventEmitter', () => {
  let emitter: EventEmitter<string>;

  beforeEach(() => {
    emitter = new EventEmitter<string>();
  });

  it('should create an event emitter', () => {
    expect(emitter).toBeTruthy();
    expect(emitter.listenerCount).toBe(0);
  });

  it('should subscribe and emit events', () => {
    const mockListener = jest.fn();
    emitter.subscribe(mockListener);

    emitter.emit('test value');

    expect(mockListener).toHaveBeenCalledWith('test value');
    expect(mockListener).toHaveBeenCalledTimes(1);
  });

  it('should support multiple subscribers', () => {
    const listener1 = jest.fn();
    const listener2 = jest.fn();
    const listener3 = jest.fn();

    emitter.subscribe(listener1);
    emitter.subscribe(listener2);
    emitter.subscribe(listener3);

    expect(emitter.listenerCount).toBe(3);

    emitter.emit('broadcast');

    expect(listener1).toHaveBeenCalledWith('broadcast');
    expect(listener2).toHaveBeenCalledWith('broadcast');
    expect(listener3).toHaveBeenCalledWith('broadcast');
  });

  it('should unsubscribe listeners', () => {
    const listener1 = jest.fn();
    const listener2 = jest.fn();

    const unsubscribe1 = emitter.subscribe(listener1);
    emitter.subscribe(listener2);

    expect(emitter.listenerCount).toBe(2);

    unsubscribe1();

    expect(emitter.listenerCount).toBe(1);

    emitter.emit('after unsubscribe');

    expect(listener1).not.toHaveBeenCalled();
    expect(listener2).toHaveBeenCalledWith('after unsubscribe');
  });

  it('should unsubscribe all listeners', () => {
    const listener1 = jest.fn();
    const listener2 = jest.fn();

    emitter.subscribe(listener1);
    emitter.subscribe(listener2);

    expect(emitter.listenerCount).toBe(2);

    emitter.unsubscribeAll();

    expect(emitter.listenerCount).toBe(0);

    emitter.emit('after unsubscribe all');

    expect(listener1).not.toHaveBeenCalled();
    expect(listener2).not.toHaveBeenCalled();
  });

  it('should handle errors in listeners without breaking other listeners', () => {
    const listener1 = jest.fn(() => {
      throw new Error('Listener 1 error');
    });
    const listener2 = jest.fn();
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    emitter.subscribe(listener1);
    emitter.subscribe(listener2);

    emitter.emit('test');

    expect(listener1).toHaveBeenCalled();
    expect(listener2).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should work with typed values', () => {
    const numberEmitter = new EventEmitter<number>();
    const listener = jest.fn();

    numberEmitter.subscribe(listener);
    numberEmitter.emit(42);

    expect(listener).toHaveBeenCalledWith(42);
  });

  it('should work with complex objects', () => {
    interface TestObject {
      x: number;
      y: number;
      z: number;
    }

    const objectEmitter = new EventEmitter<TestObject>();
    const listener = jest.fn();

    objectEmitter.subscribe(listener);
    objectEmitter.emit({ x: 1, y: 2, z: 3 });

    expect(listener).toHaveBeenCalledWith({ x: 1, y: 2, z: 3 });
  });
});
