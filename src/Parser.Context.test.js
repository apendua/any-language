/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint prefer-arrow-callback: "off" */

import chai, { expect } from 'chai';
import Scope from './Scope.js';
import Context from './Parser.Context.js';
import Symbol from './Parser.Symbol.js';
import {
  SYMBOL_LITERAL,
  SYMBOL_WHITESPACE,
  SYMBOL_IDENTIFIER,
  SYMBOL_COMMENT,
  SYMBOL_END,

  TOKEN_TYPE_NAME,
  TOKEN_TYPE_NUMBER,
  TOKEN_TYPE_OPERATOR,
  TOKEN_TYPE_COMMENT,
  TOKEN_TYPE_STRING,
  TOKEN_TYPE_WHITESPACE } from './core/constants.js';

const should = chai.should();

function binary(parse, { value }, left) {
  return { value,
    left,
    right: parse.expression(1),
  };
}

export function createGrammar(constants) {
  const literal = new Symbol(SYMBOL_LITERAL)
    .ifUsedAsPrefix((parse, token) => ({ value: token.value }));

  const variable = new Symbol(SYMBOL_IDENTIFIER)
    .ifUsedAsPrefix((parse, token) => {
      if (constants[token.value] === undefined) {
        return { name: token.value };
      }
      return { value: constants[token.value] };
    });

  const add = new Symbol('+')
    .setBindingPower(1)
    .ifUsedAsInfix(binary);

  const mul = new Symbol('*')
    .setBindingPower(2)
    .ifUsedAsInfix(binary);

  const definition = new Symbol('let').ifUsedAsStatement((parse) => {
    const left =
      parse.advance(SYMBOL_IDENTIFIER).value;
    parse.advance('=');
    const right =
      parse.expression(0);
    parse.advance(';');
    return { value: 'let', left, right };
  });

  return {
    [SYMBOL_LITERAL]: literal,
    [SYMBOL_WHITESPACE]: new Symbol(SYMBOL_WHITESPACE, { ignored: true }),
    [SYMBOL_COMMENT]: new Symbol(SYMBOL_COMMENT, { ignored: true }),
    [SYMBOL_IDENTIFIER]: variable,
    [SYMBOL_END]: new Symbol(SYMBOL_END),
    '=': new Symbol('='),
    ';': new Symbol(';'),
    ',': new Symbol(','),
    '{': new Symbol('{'),
    '}': new Symbol('}'),
    let: definition,
    and: new Symbol('and'),
    '+': add,
    '*': mul,
  };
}

describe('Test Parser.Context;', () => {
  describe('given a dummy context object', () => {
    beforeEach(function () {
      this.context = new Context();
    });
    it('should return "end" after the first advance', function () {
      this.context.advance().id.should.equal(SYMBOL_END);
    });
  });

  describe('given a dymmy context and a NAME', () => {
    beforeEach(function () {
      this.tokens = [{ type: TOKEN_TYPE_NAME, value: 'name' }];
      this.context = new Context({
        tokens: this.tokens,
      });
    });
    it('should return "identifier" after the first advance', function () {
      this.context.advance().id.should.equal(SYMBOL_IDENTIFIER);
    });
    it('should throw if we are expecting another token', function () {
      (() => {
        this.context.advance(SYMBOL_END);
      }).should.throw(/Expected/);
    });
    it('should return "end" after the second advance', function () {
      this.context.advance();
      this.context.advance().id.should.equal(SYMBOL_END);
    });
  });

  describe('given a dymmy context and a NUMBER', () => {
    beforeEach(function () {
      this.tokens = [{ type: TOKEN_TYPE_NUMBER }];
      this.context = new Context({
        tokens: this.tokens,
      });
    });
    it('should return "literal" after the first advance', function () {
      this.context.advance().id.should.equal(SYMBOL_LITERAL);
    });
    it('should throw if we are expecting another token', function () {
      (() => {
        this.context.advance(SYMBOL_END);
      }).should.throw(/Expected/);
    });
    it('should return "end" after the second advance', function () {
      this.context.advance();
      this.context.advance().id.should.equal(SYMBOL_END);
    });
  });

  describe('given a dymmy context and a STRING', () => {
    beforeEach(function () {
      this.tokens = [{ type: TOKEN_TYPE_STRING }];
      this.context = new Context({
        tokens: this.tokens,
      });
    });
    it('should return "literal" after the first advance', function () {
      this.context.advance().id.should.equal(SYMBOL_LITERAL);
    });
    it('should throw if we are expecting another token', function () {
      (() => {
        this.context.advance(SYMBOL_END);
      }).should.throw(/Expected/);
    });
    it('should return "end" after the second advance', function () {
      this.context.advance();
      this.context.advance().id.should.equal(SYMBOL_END);
    });
  });

  describe('given a dymmy context and an unknown OPERATOR', () => {
    beforeEach(function () {
      this.tokens = [{ type: TOKEN_TYPE_OPERATOR, value: '+' }];
      this.context = new Context({
        tokens: this.tokens,
      });
    });
    it('should throw if we are expecting another token', function () {
      (() => {
        this.context.advance(SYMBOL_END);
      }).should.throw(/Expected/);
    });
    it('should throw after the first advance', function () {
      (() => {
        this.context.advance();
      }).should.throw(/Unknown symbol/);
    });
  });

  describe('given a dymmy context and a WHITESPACE', () => {
    beforeEach(function () {
      this.tokens = [{ type: TOKEN_TYPE_WHITESPACE }];
      this.context = new Context({
        tokens: this.tokens,
      });
    });
    it('should return "end" after the first advance', function () {
      this.context.advance().id.should.equal(SYMBOL_END);
    });
  });

  describe('given a dymmy context and a COMMENT', () => {
    beforeEach(function () {
      this.tokens = [{ type: TOKEN_TYPE_COMMENT }];
      this.context = new Context({
        tokens: this.tokens,
      });
    });
    it('should return "end" after the first advance', function () {
      this.context.advance().id.should.equal(SYMBOL_END);
    });
  });

  describe('given a dymmy context and a bunch of tokens', () => {
    beforeEach(function () {
      this.tokens = [
        { type: TOKEN_TYPE_WHITESPACE },
        { type: TOKEN_TYPE_OPERATOR, value: '(' },
        { type: TOKEN_TYPE_NAME },
        { type: TOKEN_TYPE_WHITESPACE },
        { type: TOKEN_TYPE_OPERATOR, value: ',' },
      ];
      this.context = new Context({
        order  : 3,
        tokens : this.tokens,
      });
    });
    it('should properly match the upcoming tokens', function () {
      this.context.match('(', SYMBOL_IDENTIFIER, ',').should.be.true;
    });
    it('should recognize that tokens do not match', function () {
      this.context.match('(', SYMBOL_LITERAL, ',').should.be.false;
    });
    it('should match if nothing is expected', function () {
      this.context.match().should.be.true;
    });
    it('should throw if match list is too long', function () {
      (() => {
        this.context.match('(', SYMBOL_LITERAL, ',', SYMBOL_LITERAL);
      }).should.throw(/of order/);
    });
  });

  describe('given different types of tokens', () => {
    beforeEach(function () {
      this.grammar = createGrammar();
      this.context = new Context({
        tokens: [],
        grammar: new Scope(null, this.grammar),
      });
    });

    it('should recognize NUMBER', function () {
      this.context.recognizeToken({ type: TOKEN_TYPE_NUMBER, value: 1 })
        .should.equal(this.grammar[SYMBOL_LITERAL]);
    });

    it('should recognize STRING', function () {
      this.context.recognizeToken({ type: TOKEN_TYPE_STRING, value: 'a' })
        .should.equal(this.grammar[SYMBOL_LITERAL]);
    });

    it('should recognize WHITESPACE', function () {
      this.context.recognizeToken({ type: TOKEN_TYPE_WHITESPACE, value: ' ' })
        .should.equal(this.grammar[SYMBOL_WHITESPACE]);
    });

    it('should recognize COMMENT', function () {
      this.context.recognizeToken({ type: TOKEN_TYPE_COMMENT, value: '' })
        .should.equal(this.grammar[SYMBOL_COMMENT]);
    });

    it('should recognize OPERATOR', function () {
      this.context.recognizeToken({ type: TOKEN_TYPE_OPERATOR, value: '+' })
        .should.equal(this.grammar['+']);
    });

    it('should recognize NAME', function () {
      this.context.recognizeToken({ type: TOKEN_TYPE_NAME, value: 'name' })
        .should.equal(this.grammar[SYMBOL_IDENTIFIER]);
    });

    it('should recognize NAME that is an operator', function () {
      this.context.recognizeToken({ type: TOKEN_TYPE_NAME, value: 'and' })
        .should.equal(this.grammar.and);
    });

    it('should throw if token type is unknown', function () {
      (() => {
        this.context.recognizeToken({ type: '(unknown)' });
      }).should.throw('Unknown');
    });
  });

  describe('given a simple grammar', () => {
    beforeEach(function () {
      this.grammar = createGrammar({
        one: 1, two: 2, three: 3,
      });
    });

    describe('and a parser context', () => {
      beforeEach(function () {
        this.tokens = [
          { type: TOKEN_TYPE_NAME, value: 'one' },
          { type: TOKEN_TYPE_OPERATOR, value: '+' },
          { type: TOKEN_TYPE_NUMBER, value:  1 },
          { type: TOKEN_TYPE_WHITESPACE, value: ' ' },
        ];
        this.context = new Context({
          tokens: this.tokens,
          grammar: new Scope(null, this.grammar),
        });
      });

      describe('after 1x advance()', () => {
        beforeEach(function () {
          this.symbol = this.context.advance();
        });
        it('should return the right symbol', function () {
          this.symbol.original.should.equal(this.grammar[SYMBOL_IDENTIFIER]);
        });
        it('look(0) should return this right symbol', function () {
          this.context.look(0).original.should.equal(this.grammar[SYMBOL_IDENTIFIER]);
        });
        it('look(1) should return this right symbol', function () {
          this.context.look(1).original.should.equal(this.grammar['+']);
        });
        it('look(2) should throw an error', function () {
          (() => {
            this.context.look(2);
          }).should.throw(/too large/);
        });
      });

      describe('after 2x advance()', () => {
        beforeEach(function () {
          this.context.advance();
          this.symbol = this.context.advance();
        });
        it('should return the right symbol', function () {
          this.symbol.original.should.equal(this.grammar['+']);
        });
        it('look(0) should return this right symbol', function () {
          this.context.look(0).original.should.equal(this.grammar['+']);
        });
        it('look(1) should return this right symbol', function () {
          this.context.look(1).original.should.equal(this.grammar[SYMBOL_LITERAL]);
        });
      });

      describe('after 3x advance()', () => {
        beforeEach(function () {
          this.context.advance();
          this.context.advance();
          this.symbol = this.context.advance();
        });
        it('should return the right symbol', function () {
          this.symbol.original.should.equal(this.grammar[SYMBOL_LITERAL]);
        });
        it('look(0) should return this right symbol', function () {
          this.context.look(0).original.should.equal(this.grammar[SYMBOL_LITERAL]);
        });
        it('look(1) should return this right symbol', function () {
          this.context.look(1).original.should.equal(this.grammar[SYMBOL_END]);
        });
      });

      describe('after 4x advance()', () => {
        beforeEach(function () {
          this.context.advance();
          this.context.advance();
          this.context.advance();
          this.symbol = this.context.advance();
        });
        it('should return the right symbol', function () {
          this.symbol.original.should.equal(this.grammar[SYMBOL_END]);
        });
        it('look(0) should return this right symbol', function () {
          this.context.look(0).original.should.equal(this.grammar[SYMBOL_END]);
        });
        it('look(1) should return this right symbol', function () {
          expect(this.context.look(1)).to.be.null;
        });
        it('should throw on the next advance()', function () {
          (() => {
            this.context.advance();
          }).should.throw(/end of input/);
        });
      });
    });

    describe('and a parser context of order 2', () => {
      beforeEach(function () {
        this.tokens = [
          { type: TOKEN_TYPE_NAME, value: 'one' },
          { type: TOKEN_TYPE_OPERATOR, value: '+' },
          { type: TOKEN_TYPE_NUMBER, value:  1 },
          { type: TOKEN_TYPE_WHITESPACE, value: ' ' },
        ];
        this.context = new Context({
          order: 2,
          tokens: this.tokens,
          grammar: new Scope(null, this.grammar),
        });
      });

      describe('after 1x advance()', () => {
        beforeEach(function () {
          this.symbol = this.context.advance();
        });
        it('should return the right symbol', function () {
          this.symbol.original.should.equal(this.grammar[SYMBOL_IDENTIFIER]);
        });
        it('look(0) should return this right symbol', function () {
          this.context.look(0).original.should.equal(this.grammar[SYMBOL_IDENTIFIER]);
        });
        it('look(1) should return this right symbol', function () {
          this.context.look(1).original.should.equal(this.grammar['+']);
        });
        it('look(2) should return this right symbol', function () {
          this.context.look(2).original.should.equal(this.grammar[SYMBOL_LITERAL]);
        });
      });

      describe('after 2x advance()', () => {
        beforeEach(function () {
          this.context.advance();
          this.symbol = this.context.advance();
        });
        it('should return the right symbol', function () {
          this.symbol.original.should.equal(this.grammar['+']);
        });
        it('look(0) should return this right symbol', function () {
          this.context.look(0).original.should.equal(this.grammar['+']);
        });
        it('look(1) should return this right symbol', function () {
          this.context.look(1).original.should.equal(this.grammar[SYMBOL_LITERAL]);
        });
        it('look(2) should return this right symbol', function () {
          this.context.look(2).original.should.equal(this.grammar[SYMBOL_END]);
        });
      });

      describe('after 3x advance()', () => {
        beforeEach(function () {
          this.context.advance();
          this.context.advance();
          this.symbol = this.context.advance();
        });
        it('should return the right symbol', function () {
          this.symbol.original.should.equal(this.grammar[SYMBOL_LITERAL]);
        });
        it('look(0) should return this right symbol', function () {
          this.context.look(0).original.should.equal(this.grammar[SYMBOL_LITERAL]);
        });
        it('look(1) should return this right symbol', function () {
          this.context.look(1).original.should.equal(this.grammar[SYMBOL_END]);
        });
        it('look(2) should return this right symbol', function () {
          expect(this.context.look(2)).to.be.null;
        });
      });

      describe('after 4x advance()', () => {
        beforeEach(function () {
          this.context.advance();
          this.context.advance();
          this.context.advance();
          this.symbol = this.context.advance();
        });
        it('should return the right symbol', function () {
          this.symbol.original.should.equal(this.grammar[SYMBOL_END]);
        });
        it('look(0) should return this right symbol', function () {
          this.context.look(0).original.should.equal(this.grammar[SYMBOL_END]);
        });
        it('look(1) should return this right symbol', function () {
          expect(this.context.look(1)).to.be.null;
        });
        it('look(2) should return this right symbol', function () {
          expect(this.context.look(1)).to.be.null;
        });
        it('should throw on the next advance()', function () {
          (() => {
            this.context.advance();
          }).should.throw(/end of input/);
        });
      });
    });

    describe('and given tokens: [one, +, two]', () => {
      beforeEach(function () {
        this.tokens = [
          { type: TOKEN_TYPE_NAME, value: 'one' },
          { type: TOKEN_TYPE_OPERATOR, value: '+' },
          { type: TOKEN_TYPE_NAME, value: 'two' },
        ];
        this.context = new Context({
          tokens: this.tokens,
          grammar: new Scope(null, this.grammar),
        });
      });
      it('should be able to parse expression', function () {
        this.context.expression().should.deep.equal({
          value : '+',
          left  : { value: 1 },
          right : { value: 2 },
        });
      });
    });

    describe('and given tokens: [one, +, two, *, 4]', () => {
      beforeEach(function () {
        this.tokens = [
          { type: TOKEN_TYPE_NAME, value: 'one' },
          { type: TOKEN_TYPE_OPERATOR, value: '+' },
          { type: TOKEN_TYPE_NAME, value: 'two' },
          { type: TOKEN_TYPE_OPERATOR, value: '*' },
          { type: TOKEN_TYPE_NUMBER, value:  4 },
        ];
        this.context = new Context({
          tokens: this.tokens,
          grammar: new Scope(null, this.grammar),
        });
      });
      it('should be able to parse expression', function () {
        this.context.expression().should.deep.equal({
          value : '+',
          left  : { value: 1 },
          right : { value: '*', left: { value: 2 }, right: { value: 4 } },
        });
      });
    });

    describe('given an empty bock', () => {
      beforeEach(function () {
        this.tokens = [
          { type: TOKEN_TYPE_OPERATOR, value: '{' },
          { type: TOKEN_TYPE_OPERATOR, value: '}' },
        ];
        this.context = new Context({
          tokens: this.tokens,
          grammar: new Scope(null, this.grammar),
        });
      });
      it('should be able to parse all statement in block', function () {
        this.context.advance('{');
        this.context.block({ separator: ';', end: '}' }).should.deep.equal([]);
      });
    });

    describe('given a bock of statements', () => {
      beforeEach(function () {
        this.tokens = [
          { type: TOKEN_TYPE_OPERATOR, value: '{' },
          { type: TOKEN_TYPE_NAME, value: 'let' },
          { type: TOKEN_TYPE_NAME, value: 'a' },
          { type: TOKEN_TYPE_NAME, value: '=' },
          { type: TOKEN_TYPE_NAME, value: 'three' },
          { type: TOKEN_TYPE_NAME, value: ';' },
          { type: TOKEN_TYPE_NAME, value: 'a' },
          { type: TOKEN_TYPE_OPERATOR, value: '+' },
          { type: TOKEN_TYPE_NAME, value: 'two' },
          { type: TOKEN_TYPE_NAME, value: ';' },
          { type: TOKEN_TYPE_OPERATOR, value: '}' },
        ];
        this.context = new Context({
          tokens: this.tokens,
          grammar: new Scope(null, this.grammar),
        });
      });
      it('should be able to parse a single statement', function () {
        this.context.advance('{'); // skip the first token
        this.context.statement({ separator: ';' }).should.deep.equal({
          value : 'let',
          left  : 'a',
          right : { value: 3 },
        });
      });
      it('should be able to parse all statement in block', function () {
        this.context.advance('{');
        this.context.block({ separator: ';', end: '}' }).should.deep.equal([{
          value : 'let',
          left  : 'a',
          right : { value: 3 },
        }, {
          value : '+',
          left  : { name: 'a' },
          right : { value: 2 },
        }]);
      });
    });

    describe('given a chain of statements', () => {
      beforeEach(function () {
        this.tokens = [
          { type: TOKEN_TYPE_NAME, value: 'let' },
          { type: TOKEN_TYPE_NAME, value: 'a' },
          { type: TOKEN_TYPE_NAME, value: '=' },
          { type: TOKEN_TYPE_NAME, value: 'three' },
          { type: TOKEN_TYPE_NAME, value: ';' },
          { type: TOKEN_TYPE_NAME, value: 'a' },
          { type: TOKEN_TYPE_OPERATOR, value: '+' },
          { type: TOKEN_TYPE_NAME, value: 'two' },
          { type: TOKEN_TYPE_NAME, value: ';' },
        ];
        this.context = new Context({
          tokens: this.tokens,
          grammar: new Scope(null, this.grammar),
        });
      });
      it('should be able to parse a single statement', function () {
        this.context.statement({ separator: ';' }).should.deep.equal({
          value : 'let',
          left  : 'a',
          right : { value: 3 },
        });
      });
      it('should be able to parse all statement in block', function () {
        this.context.statements({ separator: ';' }).should.deep.equal([{
          value : 'let',
          left  : 'a',
          right : { value: 3 },
        }, {
          value : '+',
          left  : { name: 'a' },
          right : { value: 2 },
        }]);
      });
    });

    describe('given an empty tuple', () => {
      beforeEach(function () {
        this.tokens = [
          { type: TOKEN_TYPE_OPERATOR, value: '{' },
          { type: TOKEN_TYPE_OPERATOR, value: '}' },
        ];
        this.context = new Context({
          tokens: this.tokens,
          grammar: new Scope(null, this.grammar),
        });
      });
      it('should be able to parse all items', function () {
        this.context.advance('{');
        this.context.tuple({ separator: ',', end: '}', id: SYMBOL_IDENTIFIER })
          .should.deep.equal([]);
      });
    });

    describe('given a tuple of identifiers', () => {
      beforeEach(function () {
        this.tokens = [
          { type: TOKEN_TYPE_OPERATOR, value: '{' },
          { type: TOKEN_TYPE_NAME, value: 'a' },
          { type: TOKEN_TYPE_OPERATOR, value: ',' },
          { type: TOKEN_TYPE_NAME, value: 'b' },
          { type: TOKEN_TYPE_OPERATOR, value: '}' },
        ];
        this.context = new Context({
          tokens: this.tokens,
          grammar: new Scope(null, this.grammar),
        });
      });
      it('should be able to parse all items', function () {
        this.context.advance('{');
        this.context.tuple({ separator: ',', end: '}', id: SYMBOL_IDENTIFIER })
          .should.deep.equal([
            { type: 'NAME', value: 'a' },
            { type: 'NAME', value: 'b' },
          ]);
      });
    });

    describe('given a tuple of expressions', () => {
      beforeEach(function () {
        this.tokens = [
          { type: TOKEN_TYPE_OPERATOR, value: '{' },
          { type: TOKEN_TYPE_NUMBER, value:  1 },
          { type: TOKEN_TYPE_OPERATOR, value: '+' },
          { type: TOKEN_TYPE_NUMBER, value:  1 },
          { type: TOKEN_TYPE_OPERATOR, value: ',' },
          { type: TOKEN_TYPE_NUMBER, value:  2 },
          { type: TOKEN_TYPE_OPERATOR, value: '+' },
          { type: TOKEN_TYPE_NUMBER, value:  2 },
          { type: TOKEN_TYPE_OPERATOR, value: '}' },
        ];
        this.context = new Context({
          tokens: this.tokens,
          grammar: new Scope(null, this.grammar),
        });
      });
      it('should throw if identifiers are expected', function () {
        this.context.advance('{');
        (() => {
          this.context.tuple({ separator: ',', end: '}', id: SYMBOL_IDENTIFIER });
        }).should.throw(/Expected/);
      });
      it('should be able to parse all expressions', function () {
        this.context.advance('{');
        this.context.tuple({ separator: ',', end: '}' })
          .should.deep.equal([
            {
              value : '+',
              left  : { value: 1 },
              right : { value: 1 },
            },
            {
              value : '+',
              left  : { value: 2 },
              right : { value: 2 },
            },
          ]);
      });
    });
  });
});

