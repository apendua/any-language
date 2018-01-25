/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint prefer-arrow-callback: "off" */
/* eslint no-param-reassign: "off" */

import chai from 'chai';
import Tokenizer from '../src/Tokenizer.js';
import Interpreter from '../src/Interpreter.js';
import Parser from '../src/Parser.js';
import {
  TOKEN_TYPE_LITERAL,
  TOKEN_TYPE_IDENTIFIER,
} from '../src/core/constants.js';

import {
  SemanticError,
} from '../src/core/errors.js';

const should = chai.should();
const tokenizer = new Tokenizer();
const parser = new Parser();
const interpreter = new Interpreter();
const semantics = new Interpreter();

// ---------------------
// --- GRAMMAR RULES ---
// ---------------------


function subRoutine() {
  return (grammar) => {
    grammar
      .token('function')
      .ifUsedAsPrefix((parse) => {
        const name =
          parse.advance(TOKEN_TYPE_IDENTIFIER);
        parse.advance('(');
        const args = parse.tuple({
          separator: ',',
          end: ')',
          id: TOKEN_TYPE_IDENTIFIER,
        });
        parse.advance('{');
        return {
          name,
          args,
          body: parse.block({ separator: ';', end: '}' }),
        };
      });
  };
}

function parenthesis() {
  return (grammar) => {
    grammar
      .token(')');

    grammar
      .token('(')
      .ifUsedAsPrefix((parse) => {
        const e = parse.expression(0);
        parse.advance(')');
        return e;
      });
  };
}

function unary(id, bp) {
  return (grammar) => {
    grammar
      .token(id)
      .ifUsedAsPrefix(parse => ({
        value: id,
        right: parse.expression(bp),
      }));
  };
}

function binary(id, bp) {
  return (grammar) => {
    grammar
      .token(id)
      .setBindingPower(bp)
      .ifUsedAsInfix((parse, token, left) => ({
        left,
        value: id,
        right: parse.expression(bp),
      }));
  };
}

function binaryRight(id, bp) {
  return (grammar) => {
    grammar
      .token(id)
      .setBindingPower(bp)
      .ifUsedAsInfix((parse, token, left) => ({
        left,
        value: id,
        right: parse.expression(bp - 1),
      }));
  };
}

function tuple() {
  return (grammar) => {
    grammar.token(']');
    grammar.token(',');
    grammar
      .token('[')
      .ifUsedAsPrefix(parse => ({
        items: parse.tuple({ separator: ',', end: ']' }),
      }));
  };
}

function literal() {
  return (grammar) => {
    grammar
      .token(TOKEN_TYPE_LITERAL)
      .ifUsedAsPrefix((parse, token) => ({
        value: token.value,
      }));
  };
}

// -------------------------
// --- INTERPRETER STEPS ---
// -------------------------

semantics
  .define('BLOCK', (evaluation, node, state) => {
    if (!state.initialized) {
      for (let i = node.statements.length - 1; i >= 0; i -= 1) {
        evaluation.do({
          node: node.statements[i],
        });
      }
      evaluation.beginScope();
      state.initialized = true;
    } else {
      evaluation.endScope();
      return {};
    }
    return undefined;
  });

semantics
  .define('IDENTIFIER', (evaluation, node) => {
    const variable = evaluation.getScope().lookup(node.value);
    if (!variable) {
      throw new SemanticError(`Unknown identifier ${node.value}`);
    }
    return {};
  });

// THE ACTUAL TEST IMPLEMENTATION

[
  literal(),

  unary('-', 70),
  unary('+', 70),

  binary('+', 20),
  binary('-', 20),
  binary('*', 40),
  binary('/', 40),

  parenthesis(),

].forEach(plugin => plugin(parser));

describe('Test Formula language', () => {

});

