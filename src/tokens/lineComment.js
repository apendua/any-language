/* eslint no-param-reassign: "off" */
import {
  TOKEN_TYPE_LINE_COMMENT,
} from '../core/constants.js';

export default function lineComment({
  lineCommentDelimiter = '#',
} = {}) {
  return {
    accept(ctx, c) {
      if (ctx.index < lineCommentDelimiter.length) {
        return c === lineCommentDelimiter.charAt(ctx.index);
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
