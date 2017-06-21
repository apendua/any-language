/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint prefer-arrow-callback: "off" */

import jsc from 'jsverify';
import sample from 'lodash.sample';
import shortid from 'shortid';
import {
  TOKEN_TYPE_NAME,
  TOKEN_TYPE_NUMBER,
  TOKEN_TYPE_OPERATOR,
  TOKEN_TYPE_STRING,
  TOKEN_TYPE_WHITESPACE,
  DEFAULT_OPERATOR_PREFIXES,
  DEFAULT_OPERATOR_SUFFIXES } from './core/constants.js';
import { createTokenizer } from './Tokenizer.test.js';

const arbitrary = {};

arbitrary.name = jsc.bless({
  generator() {
    const name = shortid.generate();
    const ch = name.charAt(0);
    if (ch >= '0' && ch <= '9') {
      return `_${ch}`;
    }
    return ch;
  },
});

arbitrary.operator = jsc.bless({
  generator() {
    const value = jsc.random(0, 1);
    if (value === 0) {
      return sample(DEFAULT_OPERATOR_PREFIXES.split(''));
    } else if (value === 1) {
      return sample(DEFAULT_OPERATOR_PREFIXES.split('')) + sample(DEFAULT_OPERATOR_SUFFIXES.split(''));
    }
    return undefined;
  },
});

arbitrary.token = jsc.oneof([
  jsc.record({
    type: jsc.constant(TOKEN_TYPE_NAME),
    value: arbitrary.name,
  }),

  jsc.record({
    type: jsc.constant(TOKEN_TYPE_STRING),
    value: jsc.asciinestring,
  }),

  jsc.record({
    type  : jsc.constant(TOKEN_TYPE_NUMBER),
    value : jsc.nat,
  }),

  jsc.record({
    type  : jsc.constant(TOKEN_TYPE_OPERATOR),
    value : arbitrary.operator,
  }),
]);


function property(arb, verify) {
  let error = null;
  const test = jsc.forall(arb, function (...args) {
    try {
      return verify(...args);
    } catch (err) {
      error = err;
    }
    return false;
  });
  return function () {
    try {
      jsc.assert(test);
    } catch (err) {
      if (error) {
        error.message = `${err.message}; Original message: ${error.message}`;
        throw error;
      }
      throw err;
    }
  };
}

function compile(rawTokens) {
  const tokens = [];
  let prev = TOKEN_TYPE_WHITESPACE;
  let code = '';
  for (const { value, type } of rawTokens) {
    let str = '';
    let sep = '';
    switch (type) {
      case TOKEN_TYPE_NAME:
        str = value;
        if (prev !== TOKEN_TYPE_OPERATOR &&
            prev !== TOKEN_TYPE_WHITESPACE) {
          sep = ' ';
        }
        break;

      case TOKEN_TYPE_NUMBER:
        str = value.toString();
        if (prev !== TOKEN_TYPE_OPERATOR &&
            prev !== TOKEN_TYPE_WHITESPACE) {
          sep = ' ';
        }
        break;

      case TOKEN_TYPE_OPERATOR:
        str = value;
        if ((value === '.' && prev === TOKEN_TYPE_NUMBER) || prev === TOKEN_TYPE_OPERATOR) {
          sep = ' ';
        }
        break;

      case TOKEN_TYPE_STRING:
        str = JSON.stringify(value);
        break;
      default:
        // do nothing
    }
    if (sep) {
      tokens.push({
        type: TOKEN_TYPE_WHITESPACE,
        value: sep,
        line: 0,
        from: code.length,
        to: (code.length + sep.length) - 1,
      });
    }
    tokens.push({
      value,
      type,
      line: 0,
      from: code.length + sep.length,
      to: (code.length + sep.length + str.length) - 1,
    });
    code += sep + str;
    prev = type;
  }
  return { code, tokens };
}

describe('Test Tokenizer', () => {
  const tokenizer = createTokenizer();

  it('should properly tokenize random chains of tokens', property(
    jsc.array(arbitrary.token),

    (tokens) => {
      const compiled = compile(tokens);
      const parsed = tokenizer.tokenize(compiled.code);
      if (parsed.error) {
        throw new Error(`Parse error: ${parsed.error} in "${compiled.code}"`);
      }
      parsed.tokens.should.deep.equal(compiled.tokens);
      return true;
    }));
});
