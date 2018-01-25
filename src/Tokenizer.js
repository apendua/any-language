import Context from './Tokenizer.Context.js';

// TODO: Check if regexp based version would be faster
//       than the simple scanning technique.

export default class Tokenizer {
  constructor({
    plugins = [],
    options: {
      keywords = [],
      operators,
      lineCommentDelimiter = '#',
    } = {},
  } = {}) {
    this.options = {
      keywords,
      operators,
      lineCommentDelimiter,
    };
    this.parsers = plugins.map(plugin => plugin(this.options));
  }

  addPlugin(plugin) {
    this.parsers.push(plugin(this.options));
  }

  readToken(line, start, options) {
    const context = new this.constructor.Context(line, start, options);
    let c = context.advance();
    if (!c) { // empty string
      return undefined;
    }
    for (const parser of this.parsers) {
      if (parser.accept(context.get(), c)) {
        c = context.advance();
        while (c && parser.accept(context.get(), c)) {
          c = context.advance();
        }
        return context.wrap(parser.create(context.get()));
      }
    }
    return undefined;
  }

  tokenize(text) {
    const lines = text.split('\n');
    const tokens = [];
    for (let lineNo = 0; lineNo < lines.length; lineNo += 1) {
      const line = lines[lineNo];
      if (!line) {
        // empty line token?
      } else {
        let index = 0;
        while (index < line.length) {
          const token = this.readToken(line, index, { lineNo });
          if (!token) {
            return {
              error : `Unexpected character: ${line.charAt(index)}`,
              line  : lineNo,
              from  : index,
              to    : index,
            };
          } else if (token.error) {
            return token;
          }
          tokens.push(token);
          index += (token.to - token.from) + 1;
        }
      }
    }
    return { tokens };
  }
}

Tokenizer.Context = Context;
