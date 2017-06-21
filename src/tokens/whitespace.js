import {
  TOKEN_TYPE_WHITESPACE } from '../core/constants.js';

export function whitespace({
  type = TOKEN_TYPE_WHITESPACE,
} = {}) {
  return {
    accept(ctx, c) {
      return c === ' ' || c === '\t' || c === '\n' || c === '\r';
    },
    create(ctx) {
      return { type, value: ctx.value };
    },
  };
}
