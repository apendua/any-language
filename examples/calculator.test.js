/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint prefer-arrow-callback: "off" */
/* eslint no-param-reassign: "off" */

import chai from 'chai';
import Tokenizer from '../src/Tokenizer.js';
import Parser from '../src/Parser.js';
import {
  number,
  operator,
  whitespace,
} from '../src/tokens';
import {
  SYMBOL_LITERAL,
} from '../src/core/constants.js';

chai.should();

// ---------------------
// --- GRAMMAR RULES ---
// ---------------------

function unary(id, bp, transform) {
  return (grammar) => {
    grammar
      .symbol(id)
      .ifUsedAsPrefix(parse => ({
        value: transform(parse.expression(bp).value),
      }));
  };
}

function binary(id, bp, transform) {
  return (grammar) => {
    grammar
      .symbol(id)
      .setBindingPower(bp)
      .ifUsedAsInfix((parse, token, left) => ({
        value: transform(left.value, parse.expression(bp).value),
      }));
  };
}

const createGrammar = () => {
  const grammar = new Parser();

  grammar
    .symbol(SYMBOL_LITERAL)
    .ifUsedAsPrefix((parse, token) => ({
      value: token.value,
    }));

  grammar
    .symbol(')');

  grammar
    .symbol('(')
    .ifUsedAsPrefix((parse) => {
      const e = parse.expression(0);
      parse.advance(')');
      return e;
    });

  [
    unary('-', 70, x => -x),
    unary('+', 70, x => x),

    binary('*', 40, (x, y) => x * y),
    binary('/', 40, (x, y) => x / y),
    binary('+', 20, (x, y) => x + y),
    binary('-', 20, (x, y) => x - y),

  ].forEach(plugin => plugin(grammar));

  return grammar;
};

const createTokenizer = () => {
  const tokenizer = new Tokenizer();
  [
    number,
    operator,
    whitespace,
  ].forEach(parser => tokenizer.addParser(parser));
  return tokenizer;
};

describe('Test calculator', () => {
  beforeEach(function () {
    this.grammar = createGrammar();
    this.tokenizer = createTokenizer();
    this.evaluate = (code) => {
      const { tokens } = this.tokenizer.tokenize(code);
      return this.grammar.parse(tokens).value;
    };
  });

  it('should evaluate literal', function () {
    this.evaluate('1').should.equal(1);
  });

  it('should evaluate unary -', function () {
    this.evaluate('-1').should.equal(-1);
  });

  it('should evaluate unary +', function () {
    this.evaluate('+1').should.equal(1);
  });

  it('should evaluate parenthesis', function () {
    this.evaluate('(1)').should.equal(1);
  });

  it('should evaluate parenthesis with unary operator', function () {
    this.evaluate('(-1)').should.equal(-1);
  });

  it('should evaluate binary +', function () {
    this.evaluate('1+2').should.equal(3);
  });

  it('should evaluate binary -', function () {
    this.evaluate('1-2').should.equal(-1);
  });

  it('should evaluate binary *', function () {
    this.evaluate('2*2').should.equal(4);
  });

  it('should evaluate binary /', function () {
    this.evaluate('2/2').should.equal(1);
  });

  it('should evaluate two operators', function () {
    this.evaluate('1+2+4').should.equal(7);
  });

  it('should respect operator precedence', function () {
    this.evaluate('1+2*4').should.equal(9);
  });

  it('should respect operator precedence (2)', function () {
    this.evaluate('2*3-4').should.equal(2);
  });

  it('should evaluate a complex expression', function () {
    this.evaluate('(1+1)*((2+1)*3-4)').should.equal(10);
  });
});
