/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint prefer-arrow-callback: "off" */

import chai, { expect } from 'chai';
import Scope from './Scope.js';

chai.should();

describe('Test Scope; ', () => {
  describe('given a simple scope', () => {
    beforeEach(function () {
      this.scope = new Scope(null, {
        a: 1,
        b: 2,
      });
    });

    it('should be able to lookup symbols', function () {
      this.scope.lookup('a').should.equal(1);
      this.scope.lookup('b').should.equal(2);
    });

    it('should be able to get symbols', function () {
      this.scope.get('a').should.equal(1);
      this.scope.get('b').should.equal(2);
    });

    it('should be able to define symbols', function () {
      this.scope.define('c', 3);
      this.scope.lookup('c').should.equal(3);
    });

    it('should be able to populate with new symbols', function () {
      this.scope.populate({ x: 1, y: 2 });
      this.scope.lookup('x').should.equal(1);
      this.scope.lookup('y').should.equal(2);
    });

    it('should be able to remove existing symbols', function () {
      this.scope.remove('a');
      expect(this.scope.lookup('a')).to.be.undefined;
    });
  });

  describe('Given a scope hierarchy', () => {
    beforeEach(function () {
      this.scope1 = new Scope(null, { a: 4 });
      this.scope2 = this.scope1.child({ b: 5 });
    });

    it('should be able to lookup symbol', function () {
      this.scope2.lookup('b').should.equal(5);
    });

    it('should be able to lookup symbol from parent scope', function () {
      this.scope2.lookup('a').should.equal(4);
    });

    it('should not be able to access symbol from nested scope', function () {
      expect(this.scope1.lookup('b')).to.be.undefined;
    });

    it('should not affect parent scope when defining new symbol', function () {
      this.scope2.define('c', 6);
      expect(this.scope1.lookup('c')).to.be.undefined;
      expect(this.scope2.lookup('c')).to.equal(6);
    });

    it('should be able to overwrite parent symbol', function () {
      this.scope2.define('a', 100);
      this.scope2.lookup('a').should.equal(100);
    });

    it('however, should not affect the parent value', function () {
      this.scope2.define('a', 100);
      this.scope1.lookup('a').should.equal(4);
    });
  });
});
