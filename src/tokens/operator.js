import {
  TOKEN_TYPE_OPERATOR,
  DEFAULT_OPERATOR_PREFIXES,
  DEFAULT_OPERATOR_SUFFIXES,
} from '../core/constants.js';

export default function operator({
  type = TOKEN_TYPE_OPERATOR,
  prefixes = DEFAULT_OPERATOR_PREFIXES,
  suffixes = DEFAULT_OPERATOR_SUFFIXES,
} = {}) {
  const map1 = {};
  for (const c of prefixes.split('')) {
    map1[c] = true;
  }

  const map2 = {};
  for (const c of suffixes.split('')) {
    map2[c] = true;
  }

  return {
    accept({ index }, c) {
      if (index === 0) {
        return !!map1[c];
      }
      return !!map2[c];
    },
    create({ value }) {
      return { value, type };
    },
  };
}
