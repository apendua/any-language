import {
  TOKEN_TYPE_IDENTIFIER,
  TOKEN_TYPE_KEYWORD,
} from '../core/constants.js';

export default function name({
  keywords = [],
} = {}) {
  const keys = {};
  for (const k of keywords) {
    keys[k] = k;
  }
  return {
    accept({ index }, c) {
      if (c === '_') {
        return true;
      }
      if (index > 0 && c >= '0' && c <= '9') {
        return true;
      }
      return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
    },
    create({ value }) {
      if (keys[value]) {
        return {
          value,
          type: TOKEN_TYPE_KEYWORD,
        };
      }
      return {
        value,
        type: TOKEN_TYPE_IDENTIFIER,
      };
    },
  };
}
