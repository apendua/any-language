import {
  TOKEN_TYPE_NAME,
  TOKEN_TYPE_OPERATOR } from '../core/constants.js';

export function name({
  isOperator = () => false,
  type = TOKEN_TYPE_NAME,
  typeOperator = TOKEN_TYPE_OPERATOR,
} = {}) {
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
      if (isOperator(value)) {
        return { value,
          type: typeOperator,
        };
      }
      return { value, type };
    },
  };
}
