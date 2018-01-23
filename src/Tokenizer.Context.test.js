/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint prefer-arrow-callback: "off" */
import chai from 'chai';
import Context from './Tokenizer.Context.js';

chai.should();

describe('Test Tokenizer.Context', () => {
  describe('Given "abc" string', () => {
    beforeEach(function () {
      this.context = new Context('abc', 0, { lineNo: 1 });
    });

    describe('after first advance()', () => {
      beforeEach(function () {
        this.character = this.context.advance();
      });

      it('the returned value should be "a"', function () {
        this.character.should.equal('a');
      });

      it('get() should return current state', function () {
        this.context.get().should.deep.equal({
          index: 0,
          value: '',
          ahead: 'b',
          state: {},
        });
      });

      it('wrap() should return current position', function () {
        this.context.wrap({}).should.deep.equal({
          from: 0,
          to: -1,
          line: 1,
        });
      });
    });

    describe('after second advance()', () => {
      beforeEach(function () {
        this.context.advance();
        this.character = this.context.advance();
      });

      it('the returned value should be "b"', function () {
        this.character.should.equal('b');
      });

      it('get() should return current state', function () {
        this.context.get().should.deep.equal({
          index: 1,
          value: 'a',
          ahead: 'c',
          state: {},
        });
      });

      it('wrap() should return current position', function () {
        this.context.wrap({}).should.deep.equal({
          from: 0,
          to: 0,
          line: 1,
        });
      });
    });

    describe('after third advance()', () => {
      beforeEach(function () {
        this.context.advance();
        this.context.advance();
        this.character = this.context.advance();
      });

      it('the returned value should be "c"', function () {
        this.character.should.equal('c');
      });

      it('get() should return current state', function () {
        this.context.get().should.deep.equal({
          index: 2,
          value: 'ab',
          ahead: '',
          state: {},
        });
      });

      it('wrap() should return current position', function () {
        this.context.wrap({}).should.deep.equal({
          from: 0,
          to: 1,
          line: 1,
        });
      });
    });
  });
});
