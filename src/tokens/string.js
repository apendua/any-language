/* eslint no-param-reassign: "off" */
import {
  TOKEN_TYPE_LITERAL,
  VALUE_TYPE_STRING,
} from '../core/constants.js';

export default function string() {
  return {
    accept({ index, state }, c) {
      state.escape = state.escape || 0;
      if (state.done) {
        return false;
      }
      if (index === 0) {
        return c === '"';
      }
      if (c === '"' && (state.escape % 2 === 0)) {
        state.done = true;
        return true;
      }
      if (c === '\\') {
        state.escape += 1;
        return true;
      }
      state.escape = 0;
      return true;
    },
    create(ctx) {
      return {
        type: TOKEN_TYPE_LITERAL,
        value: JSON.parse(ctx.value),
        valueType: VALUE_TYPE_STRING,
      };
    },
  };
}
