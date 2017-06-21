import Scope from './Scope.js';
import Symbol from './Parser.Symbol.js';
import Context from './Parser.Context.js';

export default class Parser {
  constructor() {
    this.symbols = new Scope();
    this.Context = class ParserContext extends this.constructor.Context {};
  }

  usePlugin(plugin, options) {
    plugin(this, options);
  }

  symbol(id) {
    let symbol = this.symbols.get(id);
    if (!symbol) {
      symbol = new Symbol(id);
      this.symbols.define(id, symbol);
    }
    return symbol;
  }

  parse(tokens, globals) {
    const symbols = this.symbols.child(globals);
    const context = new this.Context({
      tokens,
      symbols,
    });
    return context.expression();
  }
}

Parser.Context = Context;
