import Context from './Interpreter.Context.js';

export default class Interpreter {
  constructor() {
    this.steps = {};
  }

  usePlugin(plugin, options) {
    plugin(this, options);
  }

  evaluate(ast, scope) {
    const steps = this.steps;
    const context = new this.constructor.Context({
      ast,
      scope,
      steps,
    });
    return context.evaluate();
  }

  define(id, step) {
    this.steps[id] = step;
  }
}

Interpreter.Context = Context;
