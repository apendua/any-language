
export default class Context {
  constructor(line, start, { lineNo = 0 } = {}) {
    Object.assign(this, {
      line,
      start,
      lineNo,
    });
  }

  advance() {
    const { line, start } = this;
    if (!this.ctx) {
      this.ctx = {
        index: 0,
        value: '',
        ahead: line.charAt(start + 1) || '',
        state: {},
      };
      return line.charAt(start);
    }
    const { index, value, ahead, state } = this.ctx;
    this.ctx = {
      index: index + 1,
      value: value + line.charAt(start + index),
      ahead: line.charAt(start + index + 2) || '',
      state,
    };
    return ahead;
  }

  get() {
    return this.ctx;
  }

  wrap(token) {
    if (!this.ctx) {
      return {};
    }
    return { ...token,
      line : this.lineNo,
      from : this.start,
      to   : (this.start + this.ctx.index) - 1,
    };
  }
}
