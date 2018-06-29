export { X }

const X = 24;

class Test {}

export { Test as T }

const P = {};

/**
 * Some valuable doc.
 * TODO This is already ignored by parser, should be fixed.
 */
P.name = {};

export default P;
