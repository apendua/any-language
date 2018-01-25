import { ParseError } from './core/errors.js';
import {
  TOKEN_TYPE_IDENTIFIER,
  TOKEN_TYPE_KEYWORD,
  TOKEN_TYPE_LITERAL,
  TOKEN_TYPE_OPERATOR,
  TOKEN_TYPE_WHITESPACE,
  TOKEN_TYPE_LINE_COMMENT,
  TOKEN_TYPE_END,
} from './core/constants.js';

import Token from './Parser.Token.js';
import Scope from './Scope.js';

export default class Context {
  constructor({
    order = 1,
    tokens = [],
    symbols = new Scope(),
  } = {}) {
    this.order = order;
    this.tokens = tokens;
    this.symbols = symbols;

    this.index = -1;
    this.queue = [null];

    for (let i = 0; i < order; i += 1) {
      this.queue.push(null);
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
    return this.queue[offset];
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
        this.look(1).id !== TOKEN_TYPE_END
      );
    }
    this.advance(end);
    return block;
  }

  /**
   * Consume all statements in the source code.
   */
  statements({ separator = ';' }) {
    return this.block({ separator, end: TOKEN_TYPE_END });
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
  token({ type, value }) {
    switch (type) {
      case TOKEN_TYPE_KEYWORD:
      case TOKEN_TYPE_IDENTIFIER:
        return this.symbols.lookup(value) ||
               this.symbols.lookup(TOKEN_TYPE_IDENTIFIER) ||
               new Token(TOKEN_TYPE_IDENTIFIER);

      case TOKEN_TYPE_LITERAL:
        return this.symbols.lookup(TOKEN_TYPE_LITERAL) ||
               new Token(TOKEN_TYPE_LITERAL);

      case TOKEN_TYPE_OPERATOR:
        return this.symbols.lookup(value) ||
               new Token(value, { unknown: true });

      case TOKEN_TYPE_LINE_COMMENT:
        return this.symbols.lookup(TOKEN_TYPE_LINE_COMMENT) ||
               new Token(TOKEN_TYPE_LINE_COMMENT, { ignored: true });

      case TOKEN_TYPE_WHITESPACE:
        return this.symbols.lookup(TOKEN_TYPE_WHITESPACE) ||
               new Token(TOKEN_TYPE_WHITESPACE, { ignored: true });

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
      throw new Error(`A parser of order ${this.order} cannot lookahead ${IDs.length} tokens.`);
    }

    // NOTE: `this.queue` is of length `this.order+1`
    for (let i = 0; i < IDs.length; i += 1) {
      if (this.queue[i + 1].id !== IDs[i]) {
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
    // this.look(0).id === TOKEN_TYPE_END
    if (this.index > this.tokens.length + this.order) {
      throw new ParseError('Unexpected end of input.');
    }

    // Analize the new token
    let token;
    if (this.index < this.tokens.length) {
      const { type, value } = this.tokens[this.index];
      token = this.token({ type, value }).copy({ type, value });
    } else if (this.index === this.tokens.length) {
      token = (this.symbols.lookup(TOKEN_TYPE_END) || new Token(TOKEN_TYPE_END)).copy();
    } else {
      token = null;
    }

    // Skip this symbol if it's ignored
    if (token && token.ignored) {
      return this.advance();
    }

    // Perform a "move" in the symbols queue
    this.queue.push(token);
    this.queue.shift();

    if (this.queue[0]) {
      if (id && this.queue[0].id !== id) {
        throw new ParseError(`Expected ${id}, got ${this.queue[0].id}.`);
      }

      if (this.queue[0].unknown) {
        throw new ParseError(`Unknown symbol: ${this.queue[0].value}.`);
      }
    }
    return this.queue[0];
  }
}
