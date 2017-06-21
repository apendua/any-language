
export default class Scope {
  // TODO: The arguments should go the other way around.
  constructor(parent, symbols) {
    this.symbols = {};
    if (symbols) {
      Object.assign(this.symbols, symbols);
    }
    if (parent && !(parent instanceof Scope)) {
      throw new Error('Scope parent must be an instanceof Scope.');
    }
    this.parent = parent;
  }

  populate(symbols) {
    for (const key of Object.keys(symbols)) {
      this.define(key, symbols[key]);
    }
  }

  get(key) {
    return this.symbols[key];
  }

  remove(key) {
    delete this.symbols[key];
  }

  define(key, value) {
    this.symbols[key] = value;
  }

  // NOTE: This could also be implemented using with prototypes.
  lookup(name) {
    let scope = this;
    while (scope) {
      if (scope.symbols[name]) {
        return scope.symbols[name];
      }
      scope = scope.parent;
    }
    return undefined;
  }

  child(symbols) {
    return new this.constructor(this, symbols);
  }
}
