/* eslint no-param-reassign: "off" */
import {
  TOKEN_TYPE_STRING,
} from '../core/constants.js';

export default function string({
  type = TOKEN_TYPE_STRING,
} = {}) {
  return {
    accept({ index, state }, c) {
      if (state.done) {
        return false;
      }
      if (index === 0) {
        return c === '"';
      }
      if (c === '"' && !state.escape) {
        state.done = true;
        return true;
      }
      if (c === '\\' && !state.escape) {
        state.escape = true;
        return true;
      }
      state.escape = false;

      return true;
    },
    create(ctx) {
      return { type, value: JSON.parse(ctx.value) };
    },
  };
}
