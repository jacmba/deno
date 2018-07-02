// Copyright 2018 Ryan Dahl <ry@tinyclouds.org>
// All rights reserved. MIT License.

import { assertEqual, test } from "liltest";
import { generateDoc } from "./parser";

// tslint:disable-next-line:no-require-imports
const options = require("./tsconfig.json");

test(async function test_enum() {
  const docs = generateDoc("testdata/enum.ts", options);
  // Test enum
  assertEqual(docs[0].type, "enum");
  assertEqual(docs[0].name, "Operator");
  assertEqual(docs[0].documentation,
    "Some values representing basic mathematical operations.");
  // Test enum members
  assertEqual(docs[0].members.length, 4);
  assertEqual(docs[0].members[0].type, "EnumMember");
  assertEqual(docs[0].members[0].name, "ADD");
  assertEqual(docs[0].members[0].documentation, "Comment for ADD");
  assertEqual(docs[0].members[1].type, "EnumMember");
  assertEqual(docs[0].members[1].name, "DIV");
  assertEqual(docs[0].members[1].documentation, "Comment for DIV");
  assertEqual(docs[0].members[2].type, "EnumMember");
  assertEqual(docs[0].members[2].name, "MUL");
  assertEqual(docs[0].members[2].documentation, "Comment for MUL");
  assertEqual(docs[0].members[3].type, "EnumMember");
  assertEqual(docs[0].members[3].name, "SUB");
  assertEqual(docs[0].members[3].documentation, "");
  // Test initializer
  assertEqual(docs[0].members[3].initializer.type, "number");
  assertEqual(docs[0].members[3].initializer.text, "3");
});

test(async function test_types() {
  const docs = generateDoc("testdata/types.ts", options);
  assertEqual(docs.length, 9);

  // Test Point
  const point = docs[0];
  assertEqual(point.name, "Point");
  assertEqual(point.documentation, "comment 1");
  assertEqual(point.definition.members.length, 2);
  // Test Point.x
  assertEqual(point.definition.members[0].name, "x");
  assertEqual(point.definition.members[0].optional, false);
  assertEqual(point.definition.members[0].documentation, "comment 2");
  assertEqual(point.definition.members[0].dataType.type, "keyword");
  assertEqual(point.definition.members[0].dataType.name, "number");
  // Test Point.y
  assertEqual(point.definition.members[1].name, "y");
  assertEqual(point.definition.members[1].optional, true);
  assertEqual(point.definition.members[1].documentation, "comment 3");
  assertEqual(point.definition.members[1].dataType.type, "TypeReference");
  assertEqual(point.definition.members[1].dataType.name, "BigNumber.number");
  assertEqual(point.definition.members[1].dataType.filename,
              "http://site.com/bignum/index.ts");

  // Test T01
  const T01 = docs[1];
  assertEqual(T01.name, "T01");
  assertEqual(T01.documentation, "comment 4");
  // Test T01 definition
  assertEqual(T01.definition.type, "TypeReference");
  assertEqual(T01.definition.name, "ReturnType");
  // Test T01 definition type arguments
  assertEqual(T01.definition.arguments.length, 1);
  assertEqual(T01.definition.arguments[0].type, "FunctionType");
  assertEqual(T01.definition.arguments[0].returnType.type, "keyword");
  assertEqual(T01.definition.arguments[0].returnType.name, "string");
  assertEqual(T01.definition.arguments[0].parameters.length, 0);

  // Test T02
  const T02 = docs[2];
  assertEqual(T02.name, "T02");
  assertEqual(T02.documentation, "comment 5");
  // Test T02 definition
  assertEqual(T02.definition.type, "UnionType");
  assertEqual(T02.definition.types.length, 2);
  assertEqual(T02.definition.types[0].type, "string");
  assertEqual(T02.definition.types[0].text, "Name");
  assertEqual(T02.definition.types[1].type, "number");
  assertEqual(T02.definition.types[1].text, "2");

  // Test T03
  const T03 = docs[3];
  assertEqual(T03.name, "T03");
  assertEqual(T03.documentation, "comment 6");
  // Test type parameters
  assertEqual(T03.parameters.length, 1);
  assertEqual(T03.parameters[0].name, "X");
  assertEqual(T03.parameters[0].type, "TypeParameter");
  // Test T03 definition
  assertEqual(T03.definition.type, "TypeReference");
  assertEqual(T03.definition.name, "X");

  // Test T04
  const T04 = docs[4];
  assertEqual(T04.name, "T04");
  assertEqual(T04.documentation, "comment 7");
  // Test parameters
  assertEqual(T04.parameters.length, 2);
  assertEqual(T04.parameters[1].constraint.type, "TypeReference");
  assertEqual(T04.parameters[1].constraint.name, "X");
  assertEqual(T04.parameters[1].constraint.arguments, undefined);
  // Test definition
  const D04 = T04.definition;
  assertEqual(D04.type, "MappedType");
  assertEqual(D04.parameter.type, "TypeParameter");
  assertEqual(D04.parameter.name, "key");
  assertEqual(D04.parameter.constraint.type, "TypeOperator");
  assertEqual(D04.parameter.constraint.operator, "KeyOfKeyword");
  assertEqual(D04.parameter.constraint.subject.type, "TypeReference");
  assertEqual(D04.parameter.constraint.subject.name, "X");
  assertEqual(D04.parameter.constraint.subject.arguments, undefined);
  assertEqual(D04.dataType.type, "IndexedAccessTypeNode");
  assertEqual(D04.dataType.index.type, "TypeReference");
  assertEqual(D04.dataType.index.name, "key");
  assertEqual(D04.dataType.index.arguments, undefined);
  assertEqual(D04.dataType.object.type, "TypeReference");
  assertEqual(D04.dataType.object.name, "Y");
  assertEqual(D04.dataType.object.arguments, undefined);

  // Test T05
  const T05 = docs[5];
  assertEqual(T05.name, "T05");
  assertEqual(T05.documentation, "comment 8");
  // Test definitions
  const D05 = T05.definition;
  assertEqual(D05.type, "TypeOperator");
  assertEqual(D05.operator, "KeyOfKeyword");
  assertEqual(D05.subject.type, "ParenthesizedType");
  assertEqual(D05.subject.elementType.type, "IntersectionType");
  assertEqual(D05.subject.elementType.types.length, 2);
  // Test definition element type types
  assertEqual(D05.subject.elementType.types[0].type, "TypeReference");
  assertEqual(D05.subject.elementType.types[0].name, "A");
  assertEqual(D05.subject.elementType.types[0].arguments, undefined);
  assertEqual(D05.subject.elementType.types[1].type, "TypeReference");
  assertEqual(D05.subject.elementType.types[1].name, "B");
  assertEqual(D05.subject.elementType.types[1].arguments, undefined);
  // Skipping parameters, tested several times.

  // Test T06
  const T06 = docs[6];
  assertEqual(T06.name, "T06");
  assertEqual(T06.documentation, "comment 9");
  // Test definition.
  const D06 = T06.definition;
  assertEqual(D06.type, "ConditionalType");
  // Test checkType
  assertEqual(D06.checkType.type, "TypeReference");
  assertEqual(D06.checkType.name, "X");
  // Test extendsType
  assertEqual(D06.extendsType.type, "TypeReference");
  assertEqual(D06.extendsType.name, "Y");
  // Test falseType
  assertEqual(D06.falseType.type, "keyword");
  assertEqual(D06.falseType.name, "string");
  // Test trueType
  assertEqual(D06.trueType.type, "keyword");
  assertEqual(D06.trueType.name, "number");
  // Skipping parameters, tested several times.

  // Test T07
  const T07 = docs[7];
  assertEqual(T07.name, "T07");
  assertEqual(T07.documentation, "comment 10");
  // Test definition
  const D07 = T07.definition;
  assertEqual(D07.type, "MappedType");
  // No need to test D07.parameter completely, just check if it contains that.
  assertEqual(D07.parameter.type, "TypeParameter");
  assertEqual(D07.parameter.name, "P");
  // IndexedAccessTypeNode has been already tested
  assertEqual(D07.dataType.type, "IndexedAccessTypeNode");

  // Test T08
  const T08 = docs[8];
  assertEqual(T08.name, "T08");
  assertEqual(T08.documentation, "comment 11");
  assertEqual(T08.definition.dataType.type, "UnionType");
  assertEqual(T08.definition.dataType.types.length, 2);
  assertEqual(T08.definition.dataType.types[1].type, "keyword");
  assertEqual(T08.definition.dataType.types[1].name, "null");
});

test(async function test_findDefinition() {
  const doc = generateDoc("testdata/import.ts", options);
  const Y = doc[1];
  assertEqual(Y.name, "Y");
  const YF = Y.statements[0];
  assertEqual(YF.name, "F");
  assertEqual(YF.parameters[0].dataType.filename, "http://site.com/foo");
  const YP = Y.statements[1];
  assertEqual(YP.name, "P");
  const YPT = YP.statements[0];
  assertEqual(YPT.name, "T");
  assertEqual(YPT.parameters[0].dataType.filename, "#Y.P");
  const YPG = YP.statements[1];
  assertEqual(YPG.name, "G");
  assertEqual(YPG.parameters[0].dataType.filename, "#Y.P");
  const YPF = YP.statements[2];
  assertEqual(YPF.name, "F");
  assertEqual(YPF.parameters[0].dataType.filename, "http://site.com/foo");
  const YG = Y.statements[2]
  assertEqual(YG.name, "G");
  assertEqual(YG.parameters[0].dataType.filename, "http://site.com/bar");
});

test(async function test_export() {
  const doc = generateDoc("testdata/export.ts", options);
  const Test = doc.filter(x => x.name === "Test")[0];
  assertEqual(!!Test, true);
  assertEqual(Test.isPrivate, true);
  const X = doc.filter(x => x.type === "VariableDeclaration" &&
                       x.declarations[0].name === "X");
  assertEqual(X.length, 1);
  assertEqual(X[0].declarations[0].name, "X");
  assertEqual(X[0].isPrivate, true);
  const P = doc.filter(p => p.type === "VariableDeclaration" &&
                       p.declarations[0].name === "P");
  assertEqual(P.length, 1);
  assertEqual(P[0].declarations[0].name, "P");
  assertEqual(P[0].isPrivate, true);
});

test(async function test_js() {
  const doc = generateDoc("testdata/file.js", options);
  assertEqual(doc.length, 4);
  const fooExport = doc.filter(x => x.name === "foo" && x.type === "export");
  assertEqual(fooExport.length, 1);
  const fooFn = doc.filter(x => x.name === "foo" && x.type === "function");
  assertEqual(fooFn.length, 1);
  const defaultExport = doc.filter(x => x.type === "export" && x.isDefault);
  assertEqual(defaultExport.length, 1);
  assertEqual(defaultExport[0].propertyName, "defaultExport");
  const fn = doc.filter(x => x.type === "function" &&
                             x.name == "defaultExport");
  assertEqual(fn.length, 1);
});


test(async function test_class() {
  const doc = generateDoc("testdata/class.ts", options);
  assertEqual(doc.length, 1);
  const C1 = doc[0];
  assertEqual(C1.type, "class");
  assertEqual(C1.name, "Point");
  assertEqual(C1.isAbstract, false);
  assertEqual(C1.implementsClauses.length, 1);
  assertEqual(C1.implementsClauses[0].filename, "./point");
  assertEqual(C1.members.length, 4);
  // Test Constructor
  assertEqual(C1.members[0].type, "Constructor");
  assertEqual(C1.members[0].parameters.length, 3);
  assertEqual(C1.members[0].parameters[0].name, "x");
  assertEqual(C1.members[0].parameters[0].visibility, "public");
  // Test distance()
  assertEqual(C1.members[1].type, "MethodDeclaration");
  assertEqual(C1.members[1].name, "distance");
  assertEqual(C1.members[1].parameters.length, 1);
  assertEqual(C1.members[1].parameters[0].dataType.name, "types.Point");
  assertEqual(C1.members[1].parameters[0].dataType.filename, "./point");
  assertEqual(C1.members[1].returnType.type, "keyword");
  assertEqual(C1.members[1].returnType.name, "number");
  // Test square()
  assertEqual(C1.members[2].type, "MethodDeclaration");
  assertEqual(C1.members[2].name, "square");
  assertEqual(C1.members[2].visibility, "private");
  // Test isUnderXAxis()
  assertEqual(C1.members[3].type, "MethodDeclaration");
  assertEqual(C1.members[3].name, "isUnderXAxis");
  assertEqual(C1.members[3].isStatic, true);
});

test(async function test_interface() {
  const doc = generateDoc("testdata/point.ts", options);
  // Test Point
  const Point = doc[0];
  assertEqual(Point.name, "Point");
  assertEqual(Point.type, "interface");
  assertEqual(Point.documentation, "Represents a point in 3D space.");
  assertEqual(Point.members.length, 3);
  assertEqual(Point.parameters.length, 0);
  assertEqual(Point.members[0].name, "x");
  assertEqual(Point.members[0].dataType.type, "keyword");
  assertEqual(Point.members[0].dataType.name, "number");
  // Test Vec4
  const Vec4 = doc[1];
  assertEqual(Vec4.name, "Vec4");
  assertEqual(Vec4.type, "interface");
  assertEqual(Vec4.heritageClauses.length, 1);
  assertEqual(Vec4.heritageClauses[0].filename, "#");
  assertEqual(Vec4.heritageClauses[0].expression, "Point");
  assertEqual(Vec4.members.length, 1);
  // Test V
  const V = doc[2];
  assertEqual(V.name, "V");
  assertEqual(V.type, "interface");
  assertEqual(V.members.length, 2);
  assertEqual(V.parameters.length, 1);
  assertEqual(V.parameters[0].type, "TypeParameter");
  assertEqual(V.parameters[0].name, "T");
  assertEqual(V.parameters[0].constraint.name, "Vec4");
});
