/** Callback function type. */
export type CallbackFunction<T = any> = (updatedValue: T) => void;

/**
 * An active variable whose value can be changed and the change can be observed.
 */
export class ActiveVariable<T = any> {
  /**
   * Create the observable active variable.
   * @param value Initial value.
   */
  constructor(public value?: T) {}

  /**
   * Callbacks to call on update.
   */
  private callbacks: CallbackFunction<T>[] = [];

  /**
   * Update the value of variable.
   * @param updatedValue New updated value.
   */
  public update(updatedValue: T) {
    this.value = updatedValue;
    this.callbacks.forEach((callback) => callback(updatedValue));
  }

  /**
   * Call a function on updating the value of variable.
   * @param callback Callback to call with updated value when the variable is updated.
   */
  public onUpdate(callback: CallbackFunction<T>) {
    this.callbacks.push(callback);
  }
}
