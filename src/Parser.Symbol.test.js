/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint prefer-arrow-callback: "off" */

import chai from 'chai';
import Symbol from './Parser.Symbol.js';

chai.should();

describe('Test Symbol; ', () => {
  beforeEach(function () {
    this.s1 = new Symbol();
    this.s1.ifUsedAsPrefix(i => (i === 1 ? 'prefix_1' : null));
    this.s1.ifUsedAsPrefix(i => (i === 2 ? 'prefix_2' : null));
    this.s1.ifUsedAsInfix(i => (i === 1 ? 'infix_1' : null));
    this.s1.ifUsedAsInfix(i => (i === 2 ? 'infix_2' : null));
    this.s1.ifUsedAsStatement(() => 'statement_1');

    this.s2 = new Symbol();
  });

  it('should know if it can be used as prefix', function () {
    this.s1.canBeUsedAsPrefix().should.be.true;
  });

  it('should know if it can be used as infix', function () {
    this.s1.canBeUsedAsInfix().should.be.true;
  });

  it('should know if it can be used as statement', function () {
    this.s1.canBeUsedAsStatement().should.be.true;
  });

  it('should know if it cannot be used as prefix', function () {
    this.s2.canBeUsedAsPrefix().should.be.false;
  });

  it('should know if it cannot be used as infix', function () {
    this.s2.canBeUsedAsInfix().should.be.false;
  });

  it('should know if it cannot be used as statement', function () {
    this.s2.canBeUsedAsStatement().should.be.false;
  });

  it('should resolve at prefix postion', function () {
    this.s1.resolve('prefix', 1).should.equal('prefix_1');
  });

  it('should resolve at infix postion', function () {
    this.s1.resolve('infix', 1).should.equal('infix_1');
  });

  it('should resolve at statement postion', function () {
    this.s1.resolve('statement').should.equal('statement_1');
  });

  it('should find alternative path at prefix postion', function () {
    this.s1.resolve('prefix', 2).should.equal('prefix_2');
  });

  it('should find alternative path infix postion', function () {
    this.s1.resolve('infix', 2).should.equal('infix_2');
  });

  it('should throw if resolved in unknown context', function () {
    (() => {
      this.s1.resolve('unknown');
    }).should.throw(/Unexpected/);
  });

  it('should throw if no resulution path is find', function () {
    (() => {
      this.s1.resolve('infix', 3);
    }).should.throw(/Unexpected/);
  });
});
