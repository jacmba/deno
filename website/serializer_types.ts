// Copyright 2018 Ryan Dahl <ry@tinyclouds.org>
// All rights reserved. MIT License.

import * as ts from "typescript";
import { visit, VISITOR } from "./parser";
import { removeSpaces, setFilename } from "./util";

// tslint:disable:only-arrow-functions
// tslint:disable:object-literal-sort-keys

VISITOR("TypeAliasDeclaration", function(e, node: ts.TypeAliasDeclaration) {
  const names = [];
  visit.call(this, names, node.name);
  const name = names[0];
  const types = [];
  visit.call(this, types, node.type);
  const symbol = this.checker.getSymbolAtLocation(node.name);
  const docs = symbol.getDocumentationComment(this.checker);
  let parameters;
  const len = this.typeParameters.length;
  if (node.typeParameters) {
    parameters = [];
    for (const t of node.typeParameters) {
      visit.call(this, parameters, t);
    }
  }
  e.push({
    type: "type",
    name: name.text,
    definition: types[0],
    documentation: ts.displayPartsToString(docs),
    parameters
  });
  this.typeParameters.splice(len);
  setFilename(this, name.refName);
});

VISITOR("TypeReference", function(e, node: ts.TypeReferenceNode) {
  const names = [];
  visit.call(this, names, node.typeName);
  const name = names[0];
  let typeArguments;
  if (node.typeArguments) {
    typeArguments = [];
    for (const t of node.typeArguments) {
      visit.call(this, typeArguments, t);
    }
  }
  const doc = {
    type: "TypeReference",
    name: name.text,
    arguments: typeArguments
  };
  e.push(doc);
  // If this node does not refer to a type parameter search for its definition.
  if (this.typeParameters.indexOf(name.refName) < 0) {
    this.privateNames.add(name.refName, doc);
  }
});

VISITOR("UnionType", function(e, node: ts.UnionTypeNode) {
  const types = [];
  for (const t of node.types) {
    visit.call(this, types, t);
  }
  e.push({
    type: "UnionType",
    types
  });
});

VISITOR("IntersectionType", function(e, node: ts.IntersectionTypeNode) {
  const types = [];
  for (const t of node.types) {
    visit.call(this, types, t);
  }
  e.push({
    type: "IntersectionType",
    types
  });
});

VISITOR("LiteralType", function(e, node: ts.LiteralTypeNode) {
  visit.call(this, e, node.literal);
});

VISITOR("StringLiteral", function(e, node: ts.StringLiteral) {
  e.push({
    type: "string",
    text: node.text
  });
});

VISITOR("FirstLiteralToken", function(e, node: ts.NumericLiteral) {
  e.push({
    type: "number",
    text: node.text
  });
});

VISITOR("ArrayType", function(e, node: ts.ArrayTypeNode) {
  const types = [];
  visit.call(this, types, node.elementType);
  e.push({
    type: "ArrayType",
    elementType: types[0]
  });
});

VISITOR("FunctionType", function(e, node: ts.FunctionTypeNode) {
  // Serialize parameters.
  const parameters = [];
  for (const param of node.parameters) {
    visit.call(this, parameters, param);
  }

  // Get return type
  const returnTypes = [];
  if (node.type) {
    visit.call(this, returnTypes, node.type);
  }

  const typeParameters = [];
  const len = this.typeParameters.length;
  if (node.typeParameters) {
    for (const t of node.typeParameters) {
      visit.call(this, typeParameters, t);
    }
  }

  e.push({
    type: "FunctionType",
    parameters,
    returnType: returnTypes[0],
    typeParameters
  });
  this.typeParameters.splice(len);
});

VISITOR("TupleType", function(e, node: ts.TupleTypeNode) {
  const types = [];
  for (const t of node.elementTypes) {
    visit.call(this, types, t);
  }
  e.push({
    type: "TupleType",
    elementTypes: types
  });
});

VISITOR("ParenthesizedType", function(e, node: ts.ParenthesizedTypeNode) {
  const types = [];
  visit.call(this, types, node.type);
  e.push({
    type: "ParenthesizedType",
    elementType: types[0]
  });
});

VISITOR("TypeLiteral", function(e, node: ts.TypeLiteralNode) {
  const members = [];
  for (const t of node.members) {
    visit.call(this, members, t);
  }
  e.push({
    type: "TypeLiteral",
    members
  });
});

VISITOR("IndexSignature", function(e, node: ts.IndexSignatureDeclaration) {
  const sig = this.checker.getSignatureFromDeclaration(node);
  const docs = sig.getDocumentationComment(this.checker);
  const parameters = [];
  for (const t of node.parameters) {
    visit.call(this, parameters, t);
  }
  const types = [];
  visit.call(this, types, node.type);
  e.push({
    type: "IndexSignature",
    parameters,
    returnType: types[0],
    documentation: ts.displayPartsToString(docs)
  });
});

VISITOR("ConstructSignature", function(e, n: ts.ConstructSignatureDeclaration) {
  const sig = this.checker.getSignatureFromDeclaration(n);
  const docs = sig.getDocumentationComment(this.checker);
  const parameters = [];
  for (const t of n.parameters) {
    visit.call(this, parameters, t);
  }
  const types = [];
  visit.call(this, types, n.type);
  e.push({
    type: "ConstructSignature",
    parameters,
    returnType: types[0],
    documentation: ts.displayPartsToString(docs)
  });
});

VISITOR("PropertySignature", function(e, node: ts.PropertySignature) {
  const types = [];
  visit.call(this, types, node.type);
  const symbol = this.checker.getSymbolAtLocation(node.name);
  const docs = symbol.getDocumentationComment(this.checker);
  const names = [];
  visit.call(this, names, node.name);
  e.push({
    types: "PropertySignature",
    name: names[0].text,
    optional: !!node.questionToken,
    dataType: types[0],
    documentation: ts.displayPartsToString(docs)
  });
});

VISITOR("ComputedPropertyName", function(e, node: ts.ComputedPropertyName) {
  visit.call(this, e, node.expression);
});

VISITOR("PropertyAccessExpression", function(
  e,
  node: ts.PropertyAccessExpression
) {
  const code = this.sourceFile.text.substring(node.pos, node.end);
  let identifierNode = node as any;
  while (identifierNode && !ts.isIdentifier(identifierNode)) {
    identifierNode = identifierNode.expression;
  }
  e.push({
    type: "name",
    text: removeSpaces(code),
    refName: identifierNode.text
  });
});

VISITOR("ConditionalType", function(e, node: ts.ConditionalTypeNode) {
  const array = [];
  visit.call(this, array, node.checkType);
  const checkType = array[0];
  array.length = 0;
  visit.call(this, array, node.extendsType);
  const extendsType = array[0];
  array.length = 0;
  visit.call(this, array, node.falseType);
  const falseType = array[0];
  array.length = 0;
  visit.call(this, array, node.trueType);
  const trueType = array[0];
  e.push({
    type: "ConditionalType",
    checkType,
    extendsType,
    falseType,
    trueType
  });
});

VISITOR("TypeParameter", function(e, node: ts.TypeParameterDeclaration) {
  // constraint
  const constraints = [];
  if (node.constraint) {
    visit.call(this, constraints, node.constraint);
  }
  const names = [];
  visit.call(this, names, node.name);
  const name = names[0];
  this.typeParameters.push(name.refName);
  e.push({
    type: "TypeParameter",
    name: name.text,
    constraint: constraints[0]
  });
});

VISITOR("IndexedAccessType", function(e, node: ts.IndexedAccessTypeNode) {
  const array = [];
  visit.call(this, array, node.indexType);
  const index = array[0];
  array.length = 0;
  visit.call(this, array, node.objectType);
  const object = array[0];
  e.push({
    type: "IndexedAccessTypeNode",
    index,
    object
  });
});

VISITOR("TypeOperator", function(e, node: ts.TypeOperatorNode) {
  // tslint:disable-next-line:no-any
  const operator = (ts as any).SyntaxKind[node.operator];
  const types = [];
  visit.call(this, types, node.type);
  e.push({
    type: "TypeOperator",
    operator,
    subject: types[0]
  });
});

VISITOR("MappedType", function(e, node: ts.MappedTypeNode) {
  // TODO Support modifiers such as readonly, +, -
  // See https://github.com/Microsoft/TypeScript/pull/12563
  const array = [];
  const len = this.typeParameters.length;
  visit.call(this, array, node.typeParameter);
  const parameter = array[0];
  array.length = 0;
  visit.call(this, array, node.type);
  const dataType = array[0];
  e.push({
    type: "MappedType",
    parameter,
    dataType
  });
  this.typeParameters.splice(len);
});

VISITOR("InferType", function(e, node: ts.InferTypeNode) {
  const parameters = [];
  const len = this.typeParameters.length;
  visit.call(this, parameters, node.typeParameter);
  e.push({
    type: "InferType",
    parameter: parameters[0]
  });
  this.typeParameters.splice(len);
});

VISITOR("FirstTypeNode", function(e, node: ts.TypePredicateNode) {
  const array = [];
  visit.call(this, array, node.parameterName);
  const parameterName = array[0];
  array.length = 0;
  visit.call(this, array, node.type);
  const dataType = array[0];
  e.push({
    type: "TypePredicate",
    parameterName: parameterName.text,
    dataType
  });
});

VISITOR("ThisType", function(e, node: ts.ThisTypeNode) {
  // Based on how renderHTML() works it's better to not introduce a new type.
  e.push({
    type: "keyword",
    name: "this"
  });
});

VISITOR("TypeQuery", function(e, node: ts.TypeQueryNode) {
  const array = [];
  visit.call(this, array, node.exprName);
  e.push({
    type: "TypeQuery",
    name: array[0]
  });
});

VISITOR("FirstNode", function(e, node: ts.QualifiedName) {
  const code = this.sourceFile.text.substring(node.pos, node.end);
  let refNameNode = node as any;
  while (refNameNode && !ts.isIdentifier(refNameNode)) {
    refNameNode = refNameNode.left;
  }
  e.push({
    type: "name",
    text: removeSpaces(code),
    refName: refNameNode.text
  });
});
