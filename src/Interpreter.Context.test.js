/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint prefer-arrow-callback: "off" */
/* eslint no-param-reassign: "off" */

import chai from 'chai';
import {

  TOKEN_TYPE_LITERAL,
  TOKEN_TYPE_IDENTIFIER,

} from './core/constants.js';

import { RuntimeError } from './core/errors.js';
import Scope from './Scope.js';
import Context from './Interpreter.Context.js';

chai.should();

function binary(op) {
  return function (evaluation, node, state) {
    if (!state.left) {
      evaluation.do({
        node: node.left,
        done: (result) => {
          state.left = result;
        },
      });
    } else if (!state.right) {
      evaluation.do({
        node: node.right,
        done: (result) => {
          state.right = result;
        },
      });
    } else {
      return {
        value: op(state.left.value, state.right.value),
      };
    }
    return undefined;
  };
}

export function createSteps() {
  return {
    [TOKEN_TYPE_LITERAL](evaluation, node) {
      return { value: node.value };
    },
    [TOKEN_TYPE_IDENTIFIER](evaluation, node) {
      const variable =
        evaluation
          .getScope()
          .lookup(node.value);
      if (!variable) { throw new RuntimeError(`Unknown variable ${node.value}.`); }
      return { value: variable.value };
    },
    '+': binary((x, y) => x + y),
    '*': binary((x, y) => x * y),
  };
}

describe('Test Interpreter.Context;', () => {
  beforeEach(function () {
    this.ast = {
      id: '+',
      left: {
        id: TOKEN_TYPE_LITERAL,
        value: 1,
      },
      right: {
        id: '*',
        left: {
          id: TOKEN_TYPE_LITERAL,
          value: 2,
        },
        right: {
          id: TOKEN_TYPE_IDENTIFIER,
          value: 'three',
        },
      },
    };
    this.context = new Context({
      ast: this.ast,
      scope: new Scope(null, {
        three: { value: 3 },
      }),
      steps: createSteps(),
    });
  });

  describe('after 1x step()', () => {
    beforeEach(function () {
      this.context.step();
    });
    it('should have stack of size 2', function () {
      this.context.stack.size().should.equal(2);
    });
    it('should have "(literal)" at the top of the stack', function () {
      this.context.stack.top().node.should.deep.equal(this.ast.left);
    });
  });

  describe('after 2x step()', () => {
    beforeEach(function () {
      this.context.step();
      this.context.step();
    });
    it('should have stack of size 1', function () {
      this.context.stack.size().should.equal(1);
    });
    it('should have "+" at the top of the stack', function () {
      this.context.stack.top().node.should.deep.equal(this.ast);
    });
  });

  describe('after 3x step()', () => {
    beforeEach(function () {
      this.context.step();
      this.context.step();
      this.context.step();
    });
    it('should have stack of size 2', function () {
      this.context.stack.size().should.equal(2);
    });
    it('should have "*" at the top of the stack', function () {
      this.context.stack.top().node.should.deep.equal(this.ast.right);
    });
  });

  describe('after 4x step()', () => {
    beforeEach(function () {
      this.context.step();
      this.context.step();
      this.context.step();
      this.context.step();
    });
    it('should have stack of size 3', function () {
      this.context.stack.size().should.equal(3);
    });
    it('should have "(literal)" at the top of the stack', function () {
      this.context.stack.top().node.should.deep.equal(this.ast.right.left);
    });
  });

  describe('after 5x step()', () => {
    beforeEach(function () {
      this.context.step();
      this.context.step();
      this.context.step();
      this.context.step();
      this.context.step();
    });
    it('should have stack of size 2', function () {
      this.context.stack.size().should.equal(2);
    });
    it('should have "(identifier)" at the top of the stack', function () {
      this.context.stack.top().node.should.deep.equal(this.ast.right);
    });
  });

  describe('after 6x step()', () => {
    beforeEach(function () {
      this.context.step();
      this.context.step();
      this.context.step();
      this.context.step();
      this.context.step();
      this.context.step();
    });
    it('should have stack of size 3', function () {
      this.context.stack.size().should.equal(3);
    });
    it('should have "(identifier)" at the top of the stack', function () {
      this.context.stack.top().node.should.deep.equal(this.ast.right.right);
    });
  });

  describe('after 7x step()', () => {
    beforeEach(function () {
      this.context.step();
      this.context.step();
      this.context.step();
      this.context.step();
      this.context.step();
      this.context.step();
      this.context.step();
    });
    it('should have stack of size 2', function () {
      this.context.stack.size().should.equal(2);
    });
    it('should have "*" at the top of the stack', function () {
      this.context.stack.top().node.should.deep.equal(this.ast.right);
    });
  });

  describe('after 8x step()', () => {
    beforeEach(function () {
      this.context.step();
      this.context.step();
      this.context.step();
      this.context.step();
      this.context.step();
      this.context.step();
      this.context.step();
      this.context.step();
    });
    it('should have stack of size 1', function () {
      this.context.stack.size().should.equal(1);
    });
    it('should have "+" at the top of the stack', function () {
      this.context.stack.top().node.should.deep.equal(this.ast);
    });
  });

  describe('after all steps', () => {
    beforeEach(function () {
      this.context.evaluate();
    });
    it('should properly evaluate the formula', function () {
      this.context.result.should.deep.equal({
        value: 7,
      });
    });
  });
});

