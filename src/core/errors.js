
const createMessage = (error, reason) => {
  if (reason) {
    return `[${error}] ${reason}`;
  }
  return error;
};

export class AnyError extends Error {
  constructor(error, reason, details) {
    super(createMessage(error, reason));
    Object.assign(this, { error, reason, details });
  }
}

export class ParseError extends AnyError {
}

export class LexicalError extends AnyError {
}

export class SyntacticError extends AnyError {
}

export class SemanticError extends AnyError {
}

export class RuntimeError extends AnyError {
}
