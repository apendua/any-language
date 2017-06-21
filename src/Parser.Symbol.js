import { ParseError } from './core/errors.js';

export default class Symbol {
  constructor(id, {

    lbp = 0,
    rules = {},
    unknown = false,
    ignored = false,
    type = null,
    value = null,
    original = null,

  } = {}) {
    Object.assign(this, {
      id,
      lbp,
      rules,
      unknown,
      ignored,
      type,
      value,
      original,
    });
  }

  /**
   * Use rules attached to this symbol to parse it in the given
   * position. Return the first valid "ast".
   */
  resolve(pos, ...args) {
    if (this.rules[pos]) {
      for (const rule of this.rules[pos]) {
        const ast = rule(...args);
        if (ast) {
          return ast;
        }
      }
    }
    throw new ParseError(`Unexpected ${pos} symbol ${this.id}.`);
  }

  // TODO: Add tests for this method!
  copy({ type = this.type, value = this.value } = {}) {
    const { id, lbp, rules, unknown, ignored } = this;
    return new this.constructor(id, {
      lbp,
      rules,
      unknown,
      ignored,
      type,
      value,
      original: this,
    });
  }

  setBindingPower(lbp) {
    this.lbp = Math.max(this.lbp, lbp);
    return this;
  }

  ifUsedAsPrefix(rule) {
    return this.ifUsedAs('prefix', rule);
  }

  ifUsedAsInfix(rule) {
    return this.ifUsedAs('infix', rule);
  }

  ifUsedAsStatement(rule) {
    return this.ifUsedAs('statement', rule);
  }

  canBeUsedAsPrefix() {
    return this.canBeUsedAs('prefix');
  }

  canBeUsedAsInfix() {
    return this.canBeUsedAs('infix');
  }

  canBeUsedAsStatement() {
    return this.canBeUsedAs('statement');
  }

  canBeUsedAs(pos) {
    return !!this.rules[pos] && this.rules[pos].length > 0;
  }

  ifUsedAs(pos, rule) {
    if (!this.rules[pos]) {
      this.rules[pos] = [];
    }
    this.rules[pos].push(rule);
    return this;
  }
}
