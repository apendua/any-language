# any-language

** Q&A

> Why can't we identify symbol type in tokenizer?

We can't do that because symbols can depend on the current parser context, while
tokens are clearly context-free.

> Why we are not using variables in parser context?

Because the semantic analysis can be easily done as a separated process
and removing it from the parser logic simplifies everything, starting from
grammatic rules definition, lookahead, and finally AST caching.
