import Scope from './Scope.js';
import Stack from './Interpreter.Stack.js';
import { RuntimeError } from './core/errors.js';

export default class Context {
  constructor({ ast, scope = new Scope(), steps = {} }) {
    this.steps = steps;
    this.stack = new Stack();
    this.scope = new Stack();
    this.result = null;
    //---------------------
    this.scope.push(scope);
    this.stack.push({
      node: ast,
      done: (result) => {
        this.result = result;
      },
    });
  }

  do(task) {
    this.stack.push(task);
  }

  newScope() {
    const newScope = this.scope.top().child();
    this.scope.push(newScope);
    return {
      end: () => {
        if (this.scope.top() !== newScope) {
          throw new RuntimeError('Scope got out of sync.');
        }
        this.scope.pop();
      },
    };
  }

  getScope() {
    return this.scope.top();
  }

  evaluate() {
    let run = true;
    while (run) {
      run = this.step();
    }
    return this.result;
  }

  step() {
    if (this.stack.isEmpty()) return false;

    const task = this.stack.top();
    const node = task.node;
    const step = this.steps[node.id];

    if (!step) {
      throw new RuntimeError(`Cannot evaluate ${node.id}.`, { node });
    }

    const result = step(this, node, task);
    if (result) {
      this.stack.pop();
      if (typeof task.done === 'function') {
        task.done(result);
      }
    }
    return true;
  }
}
