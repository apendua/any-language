// TODO: Split "NUMBER" into "INTEGER" and "DECIMAL"

export const TOKEN_TYPE_NAME = 'NAME';
export const TOKEN_TYPE_OPERATOR = 'OPERATOR';
export const TOKEN_TYPE_NUMBER = 'NUMBER';
export const TOKEN_TYPE_STRING = 'STRING';
export const TOKEN_TYPE_LINE_COMMENT = 'LINE_COMMENT';
export const TOKEN_TYPE_WHITESPACE = 'WHITESPACE';

export const DEFAULT_OPERATOR_PREFIXES = '.<>+-*/=!()';
export const DEFAULT_OPERATOR_SUFFIXES = '.=>';

// TODO: Consider adding another type of symbol: SYMBOL_KEYWORD

export const SYMBOL_LITERAL = '(literal)';
export const SYMBOL_IDENTIFIER = '(identifier)';
export const SYMBOL_WHITESPACE = '(whitespace)';
export const SYMBOL_COMMENT = '(comment)';
export const SYMBOL_END = '(end)';
