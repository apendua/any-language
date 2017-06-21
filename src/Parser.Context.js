import { ParseError } from './core/errors.js';
import {
  SYMBOL_IDENTIFIER,
  SYMBOL_LITERAL,
  SYMBOL_COMMENT,
  SYMBOL_WHITESPACE,
  SYMBOL_END,

  TOKEN_TYPE_NAME,
  TOKEN_TYPE_NUMBER,
  TOKEN_TYPE_OPERATOR,
  TOKEN_TYPE_STRING,
  TOKEN_TYPE_WHITESPACE,
  TOKEN_TYPE_COMMENT,

} from './core/constants.js';

import Symbol from './Parser.Symbol.js';
import Scope from './Scope.js';

export default class Context {
  constructor({
    order = 1,
    tokens = [],
    grammar = new Scope(),
  } = {}) {
    this.order = order;
    this.tokens = tokens;
    this.grammar = grammar;

    this.index = -1;
    this.symbols = [null];

    for (let i = 0; i < order; i += 1) {
      this.symbols.push(null);
    }

    for (let i = 0; i < order; i += 1) {
      this.advance();
    }
  }

  /**
   * Return one of the upcoming symbols.
   */
  look(offset) {
    if (offset > this.order) {
      throw new Error('Look ahead offset too large.');
    }
    return this.symbols[offset];
  }

  /**
   * Consume the statement or an expression
   * followed by separator.
   */
  statement({ separator = ';' }) {
    if (this.look(1).canBeUsedAsStatement()) {
      return this.advance().resolve('statement', this, this.look(0));
    }
    const e = this.expression(0);
    this.advance(separator);
    return e;
  }

  /**
   * Consume the entire block of statements.
   */
  block({ separator = ';', end = '}' }) {
    const block = [];
    if (this.look(1).id !== end) {
      do {
        block.push(this.statement({ separator }));
      } while (
        this.look(1).id !== end &&
        this.look(1).id !== SYMBOL_END
      );
    }
    this.advance(end);
    return block;
  }

  /**
   * Consume all statements in the source code.
   */
  statements({ separator = ';' }) {
    return this.block({ separator, end: SYMBOL_END });
  }

  tuple({ separator = ',', end = ']', id }) {
    const tuple = [];
    if (this.look(1).id !== end) {
      do {
        if (id) {
          const { type, value } = this.advance(id);
          tuple.push({ type, value });
        } else {
          tuple.push(this.expression(0));
        }
      } while (
        this.look(1).id !== end &&
        this.advance(separator)
      );
    }
    this.advance(end);
    return tuple;
  }

  /**
   * Consume the expression based on operator precedence.
   */
  expression(rbp = 0) {
    let left = this
      .advance()
      .resolve('prefix', this, this.look(0));

    while (rbp < this.look(1).lbp) {
      left = this
        .advance()
        .resolve('infix', this, this.look(0), left);
    }
    return left;
  }

  /**
   * Try to find a language symbol representation of
   * the given token. If no symbol is found generate
   * a new one. This would probably result in further
   * parser error, but that's fine.
   *
   * Throws parse error if token is of unknown type.
   */
  recognizeToken({ type, value }) {
    switch (type) {
      case TOKEN_TYPE_NAME:
        return this.grammar.lookup(value) ||
               this.grammar.lookup(SYMBOL_IDENTIFIER) ||
               new Symbol(SYMBOL_IDENTIFIER);

      case TOKEN_TYPE_NUMBER:
      case TOKEN_TYPE_STRING:
        return this.grammar.lookup(SYMBOL_LITERAL) ||
               new Symbol(SYMBOL_LITERAL);

      case TOKEN_TYPE_OPERATOR:
        return this.grammar.lookup(value) ||
               new Symbol(value, { unknown: true });

      case TOKEN_TYPE_COMMENT:
        return this.grammar.lookup(SYMBOL_COMMENT) ||
               new Symbol(SYMBOL_COMMENT, { ignored: true });

      case TOKEN_TYPE_WHITESPACE:
        return this.grammar.lookup(SYMBOL_WHITESPACE) ||
               new Symbol(SYMBOL_WHITESPACE, { ignored: true });

      default:
        throw new ParseError(`Unknown token ${type}: ${value}`);
    }
  }

  /**
   * Test this list of upcoming symbols against the provided
   * identifiers. Only return true, if all symbols matches
   * the given identifiers. Testing starts from the next
   * symbol, not from the current one.
   */
  match(...IDs) {
    if (IDs.length > this.order) {
      throw new Error(`A parser context of order ${this.order}
cannot reckognize next ${IDs.length} tokens.`);
    }

    // NOTE: `this.symbols` is of length `this.order+1`
    for (let i = 0; i < IDs.length; i += 1) {
      if (this.symbols[i + 1].id !== IDs[i]) {
        return false;
      }
    }
    return true;
  }

  /**
   * Advance is the main building block of the parsing strategy.
   * It moves the "cursor" forward by one and returns the current
   * symbol as long as it can be properly recognized. It also
   * updates the "ahead" property.
   */
  advance(id) {
    this.index += 1;

    // The following condition should be equivalent to saying that
    // this.look(0).id === SYMBOL_END
    if (this.index > this.tokens.length + this.order) {
      throw new ParseError('Unexpected end of input.');
    }

    // Analize the new symbol
    let symbol;
    if (this.index < this.tokens.length) {
      const { type, value } = this.tokens[this.index];
      symbol = this.recognizeToken({ type, value }).copy({ type, value });
    } else if (this.index === this.tokens.length) {
      symbol = (this.grammar.lookup(SYMBOL_END) || new Symbol(SYMBOL_END)).copy();
    } else {
      symbol = null;
    }

    // Skip this symbol if it's ignored
    if (symbol && symbol.ignored) {
      return this.advance();
    }

    // Perform a "move" in the symbols queue
    this.symbols.push(symbol);
    this.symbols.shift();

    if (this.symbols[0]) {
      if (id && this.symbols[0].id !== id) {
        throw new ParseError(`Expected ${id}, got ${this.symbols[0].id}.`);
      }

      if (this.symbols[0].unknown) {
        throw new ParseError(`Unknown symbol: ${this.symbols[0].value}.`);
      }
    }
    return this.symbols[0];
  }
}
