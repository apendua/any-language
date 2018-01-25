/* eslint no-param-reassign: "off" */
import {
  TOKEN_TYPE_LINE_COMMENT,
} from '../core/constants.js';

export default function lineComment({
  pattern = '#',
} = {}) {
  return {
    accept(ctx, c) {
      if (ctx.index < pattern.length) {
        return c === pattern.charAt(ctx.index);
      }
      if (c === '\n' || c === '\r') {
        return false;
      }
      return true;
    },
    create(ctx) {
      return {
        type: TOKEN_TYPE_LINE_COMMENT,
        value: ctx.value,
      };
    },
  };
}
