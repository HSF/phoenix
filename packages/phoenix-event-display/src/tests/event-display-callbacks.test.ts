/**
 * @jest-environment jsdom
 */
import { EventDisplay } from '../event-display';

describe('EventDisplay callback subscriptions', () => {
  let eventDisplay: EventDisplay;

  beforeEach(() => {
    eventDisplay = Object.create(EventDisplay.prototype) as EventDisplay;
    (eventDisplay as any).onObjectSelectedCallbacks = [];
    (eventDisplay as any).onObjectDeselectedCallbacks = [];
    (eventDisplay as any).onObjectHoveredCallbacks = [];
    (eventDisplay as any).onObjectHoverEndCallbacks = [];
    (eventDisplay as any).onSelectionChangedCallbacks = [];
  });

  it('should subscribe and unsubscribe object selected callbacks', () => {
    const callback = jest.fn();
    const unsubscribe = eventDisplay.onObjectSelected(callback);

    (eventDisplay as any).fireObjectSelectedCallback(
      { id: 'obj-1' },
      { uuid: 'u1', name: 'Object 1' },
    );

    expect(callback).toHaveBeenCalledWith(
      { id: 'obj-1' },
      { uuid: 'u1', name: 'Object 1' },
    );

    unsubscribe();

    (eventDisplay as any).fireObjectSelectedCallback(
      { id: 'obj-2' },
      { uuid: 'u2', name: 'Object 2' },
    );

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should subscribe and unsubscribe object deselected callbacks', () => {
    const callback = jest.fn();
    const unsubscribe = eventDisplay.onObjectDeselected(callback);

    (eventDisplay as any).fireObjectDeselectedCallback({ id: 'obj-1' });

    expect(callback).toHaveBeenCalledWith({ id: 'obj-1' });

    unsubscribe();

    (eventDisplay as any).fireObjectDeselectedCallback({ id: 'obj-2' });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should subscribe and unsubscribe object hovered and hover-end callbacks', () => {
    const hoveredCallback = jest.fn();
    const hoverEndCallback = jest.fn();
    const unsubscribeHovered = eventDisplay.onObjectHovered(hoveredCallback);
    const unsubscribeHoverEnd = eventDisplay.onObjectHoverEnd(hoverEndCallback);

    (eventDisplay as any).fireObjectHoveredCallback(
      { id: 'obj-1' },
      { uuid: 'u1', name: 'Object 1' },
    );
    (eventDisplay as any).fireObjectHoverEndCallback({ id: 'obj-1' });

    expect(hoveredCallback).toHaveBeenCalledWith(
      { id: 'obj-1' },
      { uuid: 'u1', name: 'Object 1' },
    );
    expect(hoverEndCallback).toHaveBeenCalledWith({ id: 'obj-1' });

    unsubscribeHovered();
    unsubscribeHoverEnd();

    (eventDisplay as any).fireObjectHoveredCallback(
      { id: 'obj-2' },
      { uuid: 'u2', name: 'Object 2' },
    );
    (eventDisplay as any).fireObjectHoverEndCallback({ id: 'obj-2' });

    expect(hoveredCallback).toHaveBeenCalledTimes(1);
    expect(hoverEndCallback).toHaveBeenCalledTimes(1);
  });

  it('should subscribe and unsubscribe selection changed callbacks with selectionData', () => {
    const callback = jest.fn();
    const unsubscribe = eventDisplay.onSelectionChanged(callback);

    (eventDisplay as any).fireSelectionChangedCallback([{ id: 'obj-1' }], {
      selectionSet: new Set([{ id: 'obj-1' }]),
      selectionArray: [{ id: 'obj-1' }],
    });

    expect(callback).toHaveBeenCalledWith([{ id: 'obj-1' }], {
      selectionSet: new Set([{ id: 'obj-1' }]),
      selectionArray: [{ id: 'obj-1' }],
    });

    unsubscribe();

    (eventDisplay as any).fireSelectionChangedCallback([{ id: 'obj-2' }], {
      selectionSet: new Set([{ id: 'obj-2' }]),
      selectionArray: [{ id: 'obj-2' }],
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
