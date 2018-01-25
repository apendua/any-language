import {
  TOKEN_TYPE_IDENTIFIER,
  TOKEN_TYPE_OPERATOR,
} from '../core/constants.js';

export default function name({
  isOperator = () => false,
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
        return {
          value,
          type: TOKEN_TYPE_OPERATOR,
        };
      }
      return {
        value,
        type: TOKEN_TYPE_IDENTIFIER,
      };
    },
  };
}
