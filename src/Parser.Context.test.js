/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint prefer-arrow-callback: "off" */

import chai, { expect } from 'chai';
import Scope from './Scope.js';
import Context from './Parser.Context.js';
import Token from './Parser.Token.js';
import {
  TOKEN_TYPE_IDENTIFIER,
  TOKEN_TYPE_LITERAL,
  TOKEN_TYPE_OPERATOR,
  TOKEN_TYPE_LINE_COMMENT,
  TOKEN_TYPE_WHITESPACE,
  TOKEN_TYPE_END,
} from './core/constants.js';

chai.should();

function binary(parse, { value }, left) {
  return { value,
    left,
    right: parse.expression(1),
  };
}

export function createGrammar(constants) {
  const literal = new Token(TOKEN_TYPE_LITERAL)
    .ifUsedAsPrefix((parse, token) => ({ value: token.value }));

  const variable = new Token(TOKEN_TYPE_IDENTIFIER)
    .ifUsedAsPrefix((parse, token) => {
      if (constants[token.value] === undefined) {
        return { name: token.value };
      }
      return { value: constants[token.value] };
    });

  const add = new Token('+')
    .setBindingPower(1)
    .ifUsedAsInfix(binary);

  const mul = new Token('*')
    .setBindingPower(2)
    .ifUsedAsInfix(binary);

  const definition = new Token('let').ifUsedAsStatement((parse) => {
    const left =
      parse.advance(TOKEN_TYPE_IDENTIFIER).value;
    parse.advance('=');
    const right =
      parse.expression(0);
    parse.advance(';');
    return { value: 'let', left, right };
  });

  return {
    [TOKEN_TYPE_LITERAL]: literal,
    [TOKEN_TYPE_WHITESPACE]: new Token(TOKEN_TYPE_WHITESPACE, { ignored: true }),
    [TOKEN_TYPE_LINE_COMMENT]: new Token(TOKEN_TYPE_LINE_COMMENT, { ignored: true }),
    [TOKEN_TYPE_IDENTIFIER]: variable,
    [TOKEN_TYPE_END]: new Token(TOKEN_TYPE_END),
    '=': new Token('='),
    ';': new Token(';'),
    ',': new Token(','),
    '{': new Token('{'),
    '}': new Token('}'),
    let: definition,
    and: new Token('and'),
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
      this.context.advance().id.should.equal(TOKEN_TYPE_END);
    });
  });

  describe('given a dymmy context and a IDENTIFIER', () => {
    beforeEach(function () {
      this.tokens = [{ type: TOKEN_TYPE_IDENTIFIER, value: 'name' }];
      this.context = new Context({
        tokens: this.tokens,
      });
    });
    it('should return "identifier" after the first advance', function () {
      this.context.advance().id.should.equal(TOKEN_TYPE_IDENTIFIER);
    });
    it('should throw if we are expecting another token', function () {
      (() => {
        this.context.advance(TOKEN_TYPE_END);
      }).should.throw(/Expected/);
    });
    it('should return "end" after the second advance', function () {
      this.context.advance();
      this.context.advance().id.should.equal(TOKEN_TYPE_END);
    });
  });

  describe('given a dymmy context and a LITERAL', () => {
    beforeEach(function () {
      this.tokens = [{ type: TOKEN_TYPE_LITERAL }];
      this.context = new Context({
        tokens: this.tokens,
      });
    });
    it('should return "literal" after the first advance', function () {
      this.context.advance().id.should.equal(TOKEN_TYPE_LITERAL);
    });
    it('should throw if we are expecting another token', function () {
      (() => {
        this.context.advance(TOKEN_TYPE_END);
      }).should.throw(/Expected/);
    });
    it('should return "end" after the second advance', function () {
      this.context.advance();
      this.context.advance().id.should.equal(TOKEN_TYPE_END);
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
        this.context.advance(TOKEN_TYPE_END);
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
      this.context.advance().id.should.equal(TOKEN_TYPE_END);
    });
  });

  describe('given a dymmy context and a COMMENT', () => {
    beforeEach(function () {
      this.tokens = [{ type: TOKEN_TYPE_LINE_COMMENT }];
      this.context = new Context({
        tokens: this.tokens,
      });
    });
    it('should return "end" after the first advance', function () {
      this.context.advance().id.should.equal(TOKEN_TYPE_END);
    });
  });

  describe('given a dymmy context and a bunch of tokens', () => {
    beforeEach(function () {
      this.tokens = [
        { type: TOKEN_TYPE_WHITESPACE },
        { type: TOKEN_TYPE_OPERATOR, value: '(' },
        { type: TOKEN_TYPE_IDENTIFIER },
        { type: TOKEN_TYPE_WHITESPACE },
        { type: TOKEN_TYPE_OPERATOR, value: ',' },
      ];
      this.context = new Context({
        order  : 3,
        tokens : this.tokens,
      });
    });
    it('should properly match the upcoming tokens', function () {
      this.context.match('(', TOKEN_TYPE_IDENTIFIER, ',').should.be.true;
    });
    it('should recognize that tokens do not match', function () {
      this.context.match('(', TOKEN_TYPE_LITERAL, ',').should.be.false;
    });
    it('should match if nothing is expected', function () {
      this.context.match().should.be.true;
    });
    it('should throw if match list is too long', function () {
      (() => {
        this.context.match('(', TOKEN_TYPE_LITERAL, ',', TOKEN_TYPE_LITERAL);
      }).should.throw(/of order/);
    });
  });

  describe('given different types of tokens', () => {
    beforeEach(function () {
      this.grammar = createGrammar();
      this.context = new Context({
        tokens: [],
        symbols: new Scope(null, this.grammar),
      });
    });

    it('should recognize a number LITERAL', function () {
      this.context.token({ type: TOKEN_TYPE_LITERAL, value: 1 })
        .should.equal(this.grammar[TOKEN_TYPE_LITERAL]);
    });

    it('should recognize a string LITERAL', function () {
      this.context.token({ type: TOKEN_TYPE_LITERAL, value: 'a' })
        .should.equal(this.grammar[TOKEN_TYPE_LITERAL]);
    });

    it('should recognize WHITESPACE', function () {
      this.context.token({ type: TOKEN_TYPE_WHITESPACE, value: ' ' })
        .should.equal(this.grammar[TOKEN_TYPE_WHITESPACE]);
    });

    it('should recognize COMMENT', function () {
      this.context.token({ type: TOKEN_TYPE_LINE_COMMENT, value: '' })
        .should.equal(this.grammar[TOKEN_TYPE_LINE_COMMENT]);
    });

    it('should recognize OPERATOR', function () {
      this.context.token({ type: TOKEN_TYPE_OPERATOR, value: '+' })
        .should.equal(this.grammar['+']);
    });

    it('should recognize IDENTIFIER', function () {
      this.context.token({ type: TOKEN_TYPE_IDENTIFIER, value: 'name' })
        .should.equal(this.grammar[TOKEN_TYPE_IDENTIFIER]);
    });

    it('should recognize IDENTIFIER that is an operator', function () {
      this.context.token({ type: TOKEN_TYPE_IDENTIFIER, value: 'and' })
        .should.equal(this.grammar.and);
    });

    it('should throw if token type is unknown', function () {
      (() => {
        this.context.token({ type: '(unknown)' });
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
          { type: TOKEN_TYPE_IDENTIFIER, value: 'one' },
          { type: TOKEN_TYPE_OPERATOR, value: '+' },
          { type: TOKEN_TYPE_LITERAL, value:  1 },
          { type: TOKEN_TYPE_WHITESPACE, value: ' ' },
        ];
        this.context = new Context({
          tokens: this.tokens,
          symbols: new Scope(null, this.grammar),
        });
      });

      describe('after 1x advance()', () => {
        beforeEach(function () {
          this.symbol = this.context.advance();
        });
        it('should return the right symbol', function () {
          this.symbol.original.should.equal(this.grammar[TOKEN_TYPE_IDENTIFIER]);
        });
        it('look(0) should return this right symbol', function () {
          this.context.look(0).original.should.equal(this.grammar[TOKEN_TYPE_IDENTIFIER]);
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
          this.context.look(1).original.should.equal(this.grammar[TOKEN_TYPE_LITERAL]);
        });
      });

      describe('after 3x advance()', () => {
        beforeEach(function () {
          this.context.advance();
          this.context.advance();
          this.symbol = this.context.advance();
        });
        it('should return the right symbol', function () {
          this.symbol.original.should.equal(this.grammar[TOKEN_TYPE_LITERAL]);
        });
        it('look(0) should return this right symbol', function () {
          this.context.look(0).original.should.equal(this.grammar[TOKEN_TYPE_LITERAL]);
        });
        it('look(1) should return this right symbol', function () {
          this.context.look(1).original.should.equal(this.grammar[TOKEN_TYPE_END]);
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
          this.symbol.original.should.equal(this.grammar[TOKEN_TYPE_END]);
        });
        it('look(0) should return this right symbol', function () {
          this.context.look(0).original.should.equal(this.grammar[TOKEN_TYPE_END]);
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
          { type: TOKEN_TYPE_IDENTIFIER, value: 'one' },
          { type: TOKEN_TYPE_OPERATOR, value: '+' },
          { type: TOKEN_TYPE_LITERAL, value:  1 },
          { type: TOKEN_TYPE_WHITESPACE, value: ' ' },
        ];
        this.context = new Context({
          order: 2,
          tokens: this.tokens,
          symbols: new Scope(null, this.grammar),
        });
      });

      describe('after 1x advance()', () => {
        beforeEach(function () {
          this.symbol = this.context.advance();
        });
        it('should return the right symbol', function () {
          this.symbol.original.should.equal(this.grammar[TOKEN_TYPE_IDENTIFIER]);
        });
        it('look(0) should return this right symbol', function () {
          this.context.look(0).original.should.equal(this.grammar[TOKEN_TYPE_IDENTIFIER]);
        });
        it('look(1) should return this right symbol', function () {
          this.context.look(1).original.should.equal(this.grammar['+']);
        });
        it('look(2) should return this right symbol', function () {
          this.context.look(2).original.should.equal(this.grammar[TOKEN_TYPE_LITERAL]);
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
          this.context.look(1).original.should.equal(this.grammar[TOKEN_TYPE_LITERAL]);
        });
        it('look(2) should return this right symbol', function () {
          this.context.look(2).original.should.equal(this.grammar[TOKEN_TYPE_END]);
        });
      });

      describe('after 3x advance()', () => {
        beforeEach(function () {
          this.context.advance();
          this.context.advance();
          this.symbol = this.context.advance();
        });
        it('should return the right symbol', function () {
          this.symbol.original.should.equal(this.grammar[TOKEN_TYPE_LITERAL]);
        });
        it('look(0) should return this right symbol', function () {
          this.context.look(0).original.should.equal(this.grammar[TOKEN_TYPE_LITERAL]);
        });
        it('look(1) should return this right symbol', function () {
          this.context.look(1).original.should.equal(this.grammar[TOKEN_TYPE_END]);
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
          this.symbol.original.should.equal(this.grammar[TOKEN_TYPE_END]);
        });
        it('look(0) should return this right symbol', function () {
          this.context.look(0).original.should.equal(this.grammar[TOKEN_TYPE_END]);
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
          { type: TOKEN_TYPE_IDENTIFIER, value: 'one' },
          { type: TOKEN_TYPE_OPERATOR, value: '+' },
          { type: TOKEN_TYPE_IDENTIFIER, value: 'two' },
        ];
        this.context = new Context({
          tokens: this.tokens,
          symbols: new Scope(null, this.grammar),
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
          { type: TOKEN_TYPE_IDENTIFIER, value: 'one' },
          { type: TOKEN_TYPE_OPERATOR, value: '+' },
          { type: TOKEN_TYPE_IDENTIFIER, value: 'two' },
          { type: TOKEN_TYPE_OPERATOR, value: '*' },
          { type: TOKEN_TYPE_LITERAL, value:  4 },
        ];
        this.context = new Context({
          tokens: this.tokens,
          symbols: new Scope(null, this.grammar),
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
          symbols: new Scope(null, this.grammar),
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
          { type: TOKEN_TYPE_IDENTIFIER, value: 'let' },
          { type: TOKEN_TYPE_IDENTIFIER, value: 'a' },
          { type: TOKEN_TYPE_IDENTIFIER, value: '=' },
          { type: TOKEN_TYPE_IDENTIFIER, value: 'three' },
          { type: TOKEN_TYPE_IDENTIFIER, value: ';' },
          { type: TOKEN_TYPE_IDENTIFIER, value: 'a' },
          { type: TOKEN_TYPE_OPERATOR, value: '+' },
          { type: TOKEN_TYPE_IDENTIFIER, value: 'two' },
          { type: TOKEN_TYPE_IDENTIFIER, value: ';' },
          { type: TOKEN_TYPE_OPERATOR, value: '}' },
        ];
        this.context = new Context({
          tokens: this.tokens,
          symbols: new Scope(null, this.grammar),
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
          { type: TOKEN_TYPE_IDENTIFIER, value: 'let' },
          { type: TOKEN_TYPE_IDENTIFIER, value: 'a' },
          { type: TOKEN_TYPE_IDENTIFIER, value: '=' },
          { type: TOKEN_TYPE_IDENTIFIER, value: 'three' },
          { type: TOKEN_TYPE_IDENTIFIER, value: ';' },
          { type: TOKEN_TYPE_IDENTIFIER, value: 'a' },
          { type: TOKEN_TYPE_OPERATOR, value: '+' },
          { type: TOKEN_TYPE_IDENTIFIER, value: 'two' },
          { type: TOKEN_TYPE_IDENTIFIER, value: ';' },
        ];
        this.context = new Context({
          tokens: this.tokens,
          symbols: new Scope(null, this.grammar),
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
          symbols: new Scope(null, this.grammar),
        });
      });
      it('should be able to parse all items', function () {
        this.context.advance('{');
        this.context.tuple({ separator: ',', end: '}', id: TOKEN_TYPE_IDENTIFIER })
          .should.deep.equal([]);
      });
    });

    describe('given a tuple of identifiers', () => {
      beforeEach(function () {
        this.tokens = [
          { type: TOKEN_TYPE_OPERATOR, value: '{' },
          { type: TOKEN_TYPE_IDENTIFIER, value: 'a' },
          { type: TOKEN_TYPE_OPERATOR, value: ',' },
          { type: TOKEN_TYPE_IDENTIFIER, value: 'b' },
          { type: TOKEN_TYPE_OPERATOR, value: '}' },
        ];
        this.context = new Context({
          tokens: this.tokens,
          symbols: new Scope(null, this.grammar),
        });
      });
      it('should be able to parse all items', function () {
        this.context.advance('{');
        this.context.tuple({ separator: ',', end: '}', id: TOKEN_TYPE_IDENTIFIER })
          .should.deep.equal([
            { type: TOKEN_TYPE_IDENTIFIER, value: 'a' },
            { type: TOKEN_TYPE_IDENTIFIER, value: 'b' },
          ]);
      });
    });

    describe('given a tuple of expressions', () => {
      beforeEach(function () {
        this.tokens = [
          { type: TOKEN_TYPE_OPERATOR, value: '{' },
          { type: TOKEN_TYPE_LITERAL, value:  1 },
          { type: TOKEN_TYPE_OPERATOR, value: '+' },
          { type: TOKEN_TYPE_LITERAL, value:  1 },
          { type: TOKEN_TYPE_OPERATOR, value: ',' },
          { type: TOKEN_TYPE_LITERAL, value:  2 },
          { type: TOKEN_TYPE_OPERATOR, value: '+' },
          { type: TOKEN_TYPE_LITERAL, value:  2 },
          { type: TOKEN_TYPE_OPERATOR, value: '}' },
        ];
        this.context = new Context({
          tokens: this.tokens,
          symbols: new Scope(null, this.grammar),
        });
      });
      it('should throw if identifiers are expected', function () {
        this.context.advance('{');
        (() => {
          this.context.tuple({ separator: ',', end: '}', id: TOKEN_TYPE_IDENTIFIER });
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

