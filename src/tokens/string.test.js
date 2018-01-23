/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint prefer-arrow-callback: "off" */

import chai, { expect } from 'chai';
import string from './string.js';
import { TOKEN_TYPE_STRING } from '../core/constants.js';

chai.should();

describe('Test String parser', () => {
  beforeEach(function () {
    this.parser = string();
  });

  it('should accept starting quotes', function () {
    const state = {};
    this.parser.accept({ state,
      index: 0,
      value: '',
      ahead: 'a',
    }, '"').should.be.true;
  });

  it('should not accept other characters at the beginning', function () {
    const state = {};
    this.parser.accept({ state,
      index: 0,
      value: '',
      ahead: '',
    }, 'a').should.be.false;
  });

  it('should accept escaping slash', function () {
    const state = {};
    this.parser.accept({ state,
      index: 1,
      value: '"',
      ahead: '"',
    }, '\\').should.be.true;
    state.escape.should.be.true;
  });

  it('should accept escaped quotes', function () {
    const state = { escape: true };
    this.parser.accept({ state,
      index: 1,
      value: '"\\',
      ahead: '"',
    }, '"').should.be.true;
    expect(state.escape).to.be.false;
    expect(state.done).not.to.be.true;
  });

  it('should finish if at ending quotes', function () {
    const state = {};
    this.parser.accept({ state,
      index: 1,
      value: '"',
      ahead: '',
    }, '"').should.be.true;
    expect(state.done).to.be.true;
  });

  it('should not accept anything agter it is done', function () {
    const state = { done: true };
    this.parser.accept({ state,
      index: 2,
      value: '""',
      ahead: '',
    }, 'x').should.be.false;
  });

  it('should parse the resulting string', function () {
    const text = 'This is a text\n "containing" escaped characters';
    this.parser.create({
      value: JSON.stringify(text),
      ahead: '',
    }).should.deep.equal({
      type: TOKEN_TYPE_STRING,
      value: text,
    });
  });
});
