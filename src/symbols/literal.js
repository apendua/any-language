import { SYMBOL_LITERAL } from '../core/constants.js';

export function literal(gramar) {
  gramar
    .define(SYMBOL_LITERAL)
    .ifUsedAsPrefix((parse, token) => ({
      value: token.value,
    }));
}
