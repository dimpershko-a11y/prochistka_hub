export const eventBus = {
  listeners: new Map(),

  on(eventName, callback) {
    const callbacks = this.listeners.get(eventName) || [];
    callbacks.push(callback);
    this.listeners.set(eventName, callbacks);

    return () => this.off(eventName, callback);
  },

  off(eventName, callback) {
    const callbacks = this.listeners.get(eventName) || [];
    this.listeners.set(
      eventName,
      callbacks.filter((item) => item !== callback)
    );
  },

  emit(eventName, payload) {
    const callbacks = this.listeners.get(eventName) || [];
    return callbacks.map((callback) => callback(payload));
  }
};
