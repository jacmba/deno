// Copyright 2018 Ryan Dahl <ry@tinyclouds.org>
// All rights reserved. MIT License.

import * as ts from "typescript";
import { visit, VISITOR } from "./parser";
import { getModifiers, setFilename } from "./util";

// tslint:disable:only-arrow-functions
// tslint:disable:object-literal-sort-keys

VISITOR("ClassDeclaration", function(e, node: ts.ClassDeclaration) {
  const symbol = this.checker.getSymbolAtLocation(node.name);
  const docs = symbol.getDocumentationComment(this.checker);

  const members = [];
  for (const m of node.members) {
    visit.call(this, members, m);
  }

  const typeParameters = [];
  const len = this.typeParameters.length;
  if (node.typeParameters) {
    for (const t of node.typeParameters) {
      visit.call(this, typeParameters, t);
    }
  }

  const parents = [];
  const implementsClauses = [];
  if (node.heritageClauses) {
    for (const c of node.heritageClauses) {
      for (const t of c.types) {
        if (c.token === ts.SyntaxKind.ExtendsKeyword) {
          visit.call(this, parents, t);
        } else {
          visit.call(this, implementsClauses, t);
        }
      }
    }
  }

  // TODO Use util.getModifiers
  const modifierFlags = ts.getCombinedModifierFlags(node);
  const isAbstract = (modifierFlags & ts.ModifierFlags.Abstract) !== 0;
  const isDefault = (modifierFlags & ts.ModifierFlags.Default) !== 0;

  e.push({
    type: "class",
    name: node.name && node.name.text,
    documentation: ts.displayPartsToString(docs),
    parent: parents[0],
    implementsClauses,
    members,
    typeParameters,
    isAbstract,
    isDefault
  });

  this.typeParameters.splice(len);
  if (node.name) {
    setFilename(this, node.name.text);
  }
});

VISITOR("PropertyDeclaration", function(e, node: ts.PropertyDeclaration) {
  const symbol = this.checker.getSymbolAtLocation(node.name);
  const docs = symbol.getDocumentationComment(this.checker);

  // Random note: using an array might not be a good/sufficient choice
  // Maybe we can create some array-like function with only push implemented
  // in it, like so:
  // Class ArrayLike {
  //   data = undefined;
  //   push(data) {
  //     if (this.data !== undefined) return;
  //     this.data = data;
  //   }
  //   set length(n) {
  //     if (n === 0) this.data = undefined;
  //   }
  // }
  // const array = new ArrayLike();
  // Not sure about the effect but it needs benchmarks
  // It should be revisited after landing first phase.
  const array = [];
  visit.call(this, array, node.name);
  const name = array[0];
  array.length = 0;
  visit.call(this, array, node.initializer);
  const initializer = array[0];
  array.length = 0;
  visit.call(this, array, node.type);
  const dataType = array[0];

  e.push({
    type: "PropertyDeclaration",
    documentation: ts.displayPartsToString(docs),
    name: name.text,
    initializer,
    dataType,
    ...getModifiers(node)
  });
});

VISITOR("Constructor", function(e, node: ts.ConstructorDeclaration) {
  const sig = this.checker.getSignatureFromDeclaration(node);
  const docs = sig.getDocumentationComment(this.checker);

  const parameters = [];
  for (const p of node.parameters) {
    visit.call(this, parameters, p);
  }

  e.push({
    type: "Constructor",
    documentation: ts.displayPartsToString(docs),
    parameters
  });
});

VISITOR("MethodDeclaration", function(e, node: ts.MethodDeclaration) {
  const symbol = this.checker.getSymbolAtLocation(node.name);
  const docs = symbol.getDocumentationComment(this.checker);

  const array = [];
  visit.call(this, array, node.name);
  const name = array[0];
  array.length = 0;
  visit.call(this, array, node.type);
  const returnType = array[0];
  array.length = 0;
  for (const p of node.parameters) {
    visit.call(this, array, p);
  }

  e.push({
    type: "MethodDeclaration",
    name: name.text,
    documentation: ts.displayPartsToString(docs),
    parameters: array,
    returnType,
    ...getModifiers(node)
  });
});

VISITOR("GetAccessor", function(e, node: ts.GetAccessorDeclaration) {
  const symbol = this.checker.getSymbolAtLocation(node.name);
  const docs = symbol.getDocumentationComment(this.checker);

  const array = [];
  visit.call(this, array, node.name);
  const name = array[0];
  array.length = 0;
  visit.call(this, array, node.type);
  const returnType = array[0];

  e.push({
    type: "GetAccessor",
    name: name.text,
    documentation: ts.displayPartsToString(docs),
    returnType,
    ...getModifiers(node)
  });
});

VISITOR("SetAccessor", function(e, node: ts.SetAccessorDeclaration) {
  const symbol = this.checker.getSymbolAtLocation(node.name);
  const docs = symbol.getDocumentationComment(this.checker);

  const array = [];
  visit.call(this, array, node.name);
  const name = array[0];
  array.length = 0;
  for (const p of node.parameters) {
    visit.call(this, array, p);
  }

  e.push({
    type: "SetAccessor",
    name: name.text,
    documentation: ts.displayPartsToString(docs),
    parameter: array[0],
    ...getModifiers(node)
  });
});
