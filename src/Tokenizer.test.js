/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint prefer-arrow-callback: "off" */

import chai from 'chai';
import Tokenizer from './Tokenizer.js';
import {
  name,
  number,
  operator,
  string,
  whitespace,
  lineComment,
} from './tokens';
import {
  TOKEN_TYPE_IDENTIFIER,
  TOKEN_TYPE_LITERAL,
  TOKEN_TYPE_OPERATOR,
  TOKEN_TYPE_WHITESPACE,
  TOKEN_TYPE_LINE_COMMENT,

  VALUE_TYPE_INTEGER,
  VALUE_TYPE_DECIMAL,
  VALUE_TYPE_STRING,
} from './core/constants.js';

chai.should();

export const createTokenizer = function () {
  const tokenizer = new Tokenizer();
  [
    name,
    number,
    operator,
    string,
    whitespace,
    lineComment,
  ].forEach(parser => tokenizer.addParser(parser));
  return tokenizer;
};

describe('Test Tokenizer', () => {
  beforeEach(function () {
    this.tokenizer = createTokenizer();
  });

  it('should reckognize a name', function () {
    this.tokenizer.readToken('any', 0).should.deep.equal({
      type: TOKEN_TYPE_IDENTIFIER,
      value: 'any',
      from: 0,
      to: 2,
      line: 0,
    });
  });

  it('should reckognize a name prefixed with lodash', function () {
    this.tokenizer.readToken('_any', 0).should.deep.equal({
      type: TOKEN_TYPE_IDENTIFIER,
      value: '_any',
      from: 0,
      to: 3,
      line: 0,
    });
  });

  it('should reckognize a name containing digits', function () {
    this.tokenizer.readToken('x12', 0).should.deep.equal({
      type: TOKEN_TYPE_IDENTIFIER,
      value: 'x12',
      from: 0,
      to: 2,
      line: 0,
    });
  });

  it('should not reckognize a name started with a digit', function () {
    this.tokenizer.readToken('1x', 0).should.deep.equal({
      type: TOKEN_TYPE_LITERAL,
      valueType: VALUE_TYPE_INTEGER,
      value: 1,
      from: 0,
      to: 0,
      line: 0,
    });
  });

  it('should reckognize an integer number', function () {
    this.tokenizer.readToken('123', 0).should.deep.equal({
      type: TOKEN_TYPE_LITERAL,
      valueType: VALUE_TYPE_INTEGER,
      value: 123,
      from: 0,
      to: 2,
      line: 0,
    });
  });

  it('should reckognize a decimal number', function () {
    this.tokenizer.readToken('1234.5', 0).should.deep.equal({
      type: TOKEN_TYPE_LITERAL,
      valueType: VALUE_TYPE_DECIMAL,
      value: 1234.5,
      from: 0,
      to: 5,
      line: 0,
    });
  });

  it('should reckognize a basic operator', function () {
    this.tokenizer.readToken('+', 0).should.deep.equal({
      type: TOKEN_TYPE_OPERATOR,
      value: '+',
      from: 0,
      to: 0,
      line: 0,
    });
  });

  it('should reckognize a compound operator', function () {
    this.tokenizer.readToken('==', 0).should.deep.equal({
      type: TOKEN_TYPE_OPERATOR,
      value: '==',
      from: 0,
      to: 1,
      line: 0,
    });
  });

  it('should reckognize a string literal', function () {
    this.tokenizer.readToken('"abc"', 0).should.deep.equal({
      type: TOKEN_TYPE_LITERAL,
      valueType: VALUE_TYPE_STRING,
      value: 'abc',
      from: 0,
      to: 4,
      line: 0,
    });
  });

  it('should reckognize a string literal with escaped "', function () {
    this.tokenizer.readToken('"\\""', 0).should.deep.equal({
      type: TOKEN_TYPE_LITERAL,
      valueType: VALUE_TYPE_STRING,
      value: '"',
      from: 0,
      to: 3,
      line: 0,
    });
  });

  it('should reckognize a string literal with escaped \\', function () {
    this.tokenizer.readToken('"\\\\"', 0).should.deep.equal({
      type: TOKEN_TYPE_LITERAL,
      valueType: VALUE_TYPE_STRING,
      value: '\\',
      from: 0,
      to: 3,
      line: 0,
    });
  });

  it('should reckognize a whitespace token', function () {
    this.tokenizer.readToken(' \t\t ', 0).should.deep.equal({
      type: TOKEN_TYPE_WHITESPACE,
      value: ' \t\t ',
      from: 0,
      to: 3,
      line: 0,
    });
  });

  it('should reckognize a line comment', function () {
    this.tokenizer.readToken('# abc\n1', 0).should.deep.equal({
      type: TOKEN_TYPE_LINE_COMMENT,
      value: '# abc',
      from: 0,
      to: 4,
      line: 0,
    });
  });
});
