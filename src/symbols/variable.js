import { SYMBOL_IDENTIFIER } from '../core/constants.js';
import { ParseError } from '../core/errors.js';

export function literal(grammar) {
  grammar
    .define(SYMBOL_IDENTIFIER)
    .ifUsedAsPrefix((parse, token) => {
      const variable = parse.symbols.lookup(token.value);
      if (!variable) {
        throw new ParseError(`Unknown variable: ${token.value}`);
      }
      return {
        value: variable.value,
      };
    });
}
