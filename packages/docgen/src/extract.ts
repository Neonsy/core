import doctrine from 'doctrine';
import * as ts from 'typescript';
import { formatTypeAliasSignature, formatTypeFromType, formatTypeNode } from './FormatType.js';
import type {
  DocConstructor,
  DocEnumMember,
  DocInterfaceProperty,
  DocMethod,
  DocParam,
  DocProperty,
  DocSource,
} from './Schema.js';

function getJSDoc(node: ts.Node): string {
  const sourceFile = node.getSourceFile();
  const text = sourceFile.getFullText();
  const commentRanges = ts.getLeadingCommentRanges(text, node.getFullStart());
  if (!commentRanges?.length) return '';
  const range = commentRanges[commentRanges.length - 1];
  return text.slice(range.pos, range.end);
}

function parseJSDoc(comment: string): doctrine.Annotation | null {
  try {
    return doctrine.parse(comment, { unwrap: true });
  } catch {
    return null;
  }
}

function cleanDescription(s: string): string {
  return s
    .replace(/\r\n/g, '\n')
    .replace(/\s*\/\s*$/, '')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

function getDescriptionFromJSDoc(comment: string): string {
  const parsed = parseJSDoc(comment);
  if (!parsed) return '';
  return cleanDescription(parsed.description ?? '');
}

function getParamDescriptions(comment: string): Map<string, string> {
  const parsed = parseJSDoc(comment);
  const map = new Map<string, string>();
  if (!parsed?.tags) return map;
  for (const tag of parsed.tags) {
    if (tag.title === 'param' && 'name' in tag) {
      const name = (tag as doctrine.type.ParameterTag).name;
      const desc = (tag as doctrine.type.ParameterTag).description ?? '';
      if (name) map.set(name.replace(/^\[|\]$/g, ''), cleanDescription(desc));
    }
  }
  return map;
}

function _getReturnsFromJSDoc(comment: string): string | undefined {
  const parsed = parseJSDoc(comment);
  if (!parsed?.tags) return undefined;
  const tag = parsed.tags.find((t) => t.title === 'returns');
  if (tag && tag.type === 'ReturnTag') {
    return ((tag as doctrine.type.ReturnTag).description ?? '').trim();
  }
  return undefined;
}

function getExamplesFromJSDoc(comment: string): string[] {
  const parsed = parseJSDoc(comment);
  if (!parsed?.tags) return [];
  return parsed.tags
    .filter((t) => t.title === 'example')
    .map((t) => ((t as doctrine.type.Tag).description ?? '').trim())
    .filter(Boolean);
}

export function getDeprecatedFromJSDoc(comment: string): boolean | string | undefined {
  const parsed = parseJSDoc(comment);
  if (!parsed?.tags) return undefined;
  const tag = parsed.tags.find((t) => t.title === 'deprecated');
  if (!tag) return undefined;
  const desc = (tag as doctrine.type.Tag).description?.trim();
  return desc || true;
}

export function getSeeFromJSDoc(comment: string): string[] | undefined {
  const parsed = parseJSDoc(comment);
  if (!parsed?.tags) return undefined;
  const sees = parsed.tags
    .filter((t) => t.title === 'see')
    .map((t) => ((t as doctrine.type.Tag).description ?? '').trim())
    .filter(Boolean);
  return sees.length ? sees : undefined;
}

export function getDescriptionFromJSDocComment(comment: string): string {
  return getDescriptionFromJSDoc(comment);
}

function getSource(node: ts.Node): DocSource | undefined {
  const sourceFile = node.getSourceFile();
  const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
  const fileName = sourceFile.fileName.split(/[/\\]/).pop() ?? '';
  return { file: fileName, line: line + 1 };
}

export function extractConstructor(
  checker: ts.TypeChecker,
  node: ts.ConstructorDeclaration,
): DocConstructor | undefined {
  const comment = getJSDoc(node);
  const paramDescs = getParamDescriptions(comment);

  const params: DocParam[] = node.parameters.map((p) => {
    const name = (p.name as ts.Identifier).getText();
    const type = p.type
      ? formatTypeNode(checker, p.type)
      : formatTypeFromType(checker, checker.getTypeAtLocation(p));
    const optional = !!p.questionToken;
    const description = paramDescs.get(name);
    return { name, type, optional, description };
  });

  const examples = getExamplesFromJSDoc(comment);

  return {
    params,
    description: getDescriptionFromJSDoc(comment) || undefined,
    examples: examples.length ? examples : undefined,
  };
}

export function extractProperty(
  checker: ts.TypeChecker,
  node: ts.PropertyDeclaration | ts.PropertySignature,
): DocProperty | null {
  const name = (node.name as ts.Identifier)?.getText();
  if (!name || name.startsWith('_')) return null;

  const comment = getJSDoc(node);
  const type = node.type
    ? formatTypeNode(checker, node.type)
    : formatTypeFromType(checker, checker.getTypeAtLocation(node));
  const readonly = !!(node as ts.PropertyDeclaration).modifiers?.some(
    (m) => m.kind === ts.SyntaxKind.ReadonlyKeyword,
  );
  const optional = !!(node as ts.PropertySignature).questionToken;
  const description = getDescriptionFromJSDoc(comment) || undefined;
  const examples = getExamplesFromJSDoc(comment);

  return {
    name,
    type,
    readonly,
    optional,
    description,
    examples: examples.length ? examples : undefined,
  };
}

export function extractMethod(
  checker: ts.TypeChecker,
  node: ts.MethodDeclaration | ts.MethodSignature,
): DocMethod | null {
  const name = (node.name as ts.Identifier)?.getText();
  if (!name || name.startsWith('_')) return null;

  const comment = getJSDoc(node);
  const paramDescs = getParamDescriptions(comment);

  const params: DocParam[] = (node.parameters ?? []).map((p) => {
    const pname = (p.name as ts.Identifier).getText();
    const type = p.type
      ? formatTypeNode(checker, p.type)
      : formatTypeFromType(checker, checker.getTypeAtLocation(p));
    const optional = !!p.questionToken;
    const description = paramDescs.get(pname);
    return { name: pname, type, optional, description };
  });

  const returnType = node.type
    ? formatTypeNode(checker, node.type)
    : (node as ts.MethodDeclaration).body
      ? formatTypeFromType(
          checker,
          checker.getReturnTypeOfSignature(checker.getSignatureFromDeclaration(node)!),
        )
      : 'void';

  const async = !!(node as ts.MethodDeclaration).modifiers?.some(
    (m) => m.kind === ts.SyntaxKind.AsyncKeyword,
  );

  const deprecated = getDeprecatedFromJSDoc(comment);
  const examples = getExamplesFromJSDoc(comment);

  return {
    name,
    params,
    returns: returnType,
    description: getDescriptionFromJSDoc(comment) || undefined,
    examples: examples.length ? examples : undefined,
    async,
    deprecated,
    source: getSource(node),
  };
}

export function extractGetterProperty(
  checker: ts.TypeChecker,
  node: ts.GetAccessorDeclaration,
): DocProperty | null {
  const name = (node.name as ts.Identifier)?.getText();
  if (!name || name.startsWith('_')) return null;

  const comment = getJSDoc(node);
  const returnType = node.type
    ? formatTypeNode(checker, node.type)
    : formatTypeFromType(
        checker,
        checker.getReturnTypeOfSignature(checker.getSignatureFromDeclaration(node)!),
      );
  const description = getDescriptionFromJSDoc(comment) || undefined;
  const examples = getExamplesFromJSDoc(comment);

  return {
    name,
    type: returnType,
    readonly: true,
    optional: false,
    description,
    examples: examples.length ? examples : undefined,
  };
}

export function extractInterfaceProperty(
  checker: ts.TypeChecker,
  node: ts.PropertySignature,
): DocInterfaceProperty | null {
  return extractProperty(checker, node) as DocInterfaceProperty | null;
}

/**
 * Expand `export type Foo = { ... }` into properties; literal unions into unionMembers;
 * otherwise return an expanded typeSignature string.
 */
export function extractTypeAliasMembers(
  checker: ts.TypeChecker,
  node: ts.TypeAliasDeclaration,
): {
  properties: DocInterfaceProperty[];
  typeSignature?: string;
  unionMembers?: DocEnumMember[];
} {
  const typeNode = node.type;
  const typeSignature = formatTypeAliasSignature(checker, node);

  if (ts.isTypeLiteralNode(typeNode)) {
    const properties: DocInterfaceProperty[] = [];
    for (const member of typeNode.members) {
      if (ts.isPropertySignature(member)) {
        const prop = extractInterfaceProperty(checker, member);
        if (prop) properties.push(prop);
      }
    }
    properties.sort((a, b) => a.name.localeCompare(b.name));
    return { properties };
  }

  // Intersection of object literals: A & { ... }
  if (ts.isIntersectionTypeNode(typeNode)) {
    const properties: DocInterfaceProperty[] = [];
    let sawLiteral = false;
    for (const part of typeNode.types) {
      if (ts.isTypeLiteralNode(part)) {
        sawLiteral = true;
        for (const member of part.members) {
          if (ts.isPropertySignature(member)) {
            const prop = extractInterfaceProperty(checker, member);
            if (prop) properties.push(prop);
          }
        }
      }
    }
    if (sawLiteral && properties.length) {
      properties.sort((a, b) => a.name.localeCompare(b.name));
      return { properties, typeSignature };
    }
  }

  const unionMembers = extractLiteralUnionMembers(typeNode);
  if (unionMembers?.length) {
    return { properties: [], typeSignature, unionMembers };
  }

  return { properties: [], typeSignature };
}

/** `'a' | 'b' | 1` → members for docs tables. */
function extractLiteralUnionMembers(typeNode: ts.TypeNode): DocEnumMember[] | undefined {
  const parts = ts.isUnionTypeNode(typeNode) ? typeNode.types : [typeNode];
  const members: DocEnumMember[] = [];
  for (const part of parts) {
    const node = ts.isParenthesizedTypeNode(part) ? part.type : part;
    if (!ts.isLiteralTypeNode(node)) return undefined;
    const lit = node.literal;
    if (ts.isStringLiteral(lit) || ts.isNoSubstitutionTemplateLiteral(lit)) {
      members.push({ name: lit.text, value: lit.text });
    } else if (ts.isNumericLiteral(lit)) {
      members.push({ name: lit.text, value: Number(lit.text) });
    } else if (lit.kind === ts.SyntaxKind.TrueKeyword) {
      members.push({ name: 'true', value: 'true' });
    } else if (lit.kind === ts.SyntaxKind.FalseKeyword) {
      members.push({ name: 'false', value: 'false' });
    } else if (lit.kind === ts.SyntaxKind.NullKeyword) {
      members.push({ name: 'null', value: 'null' });
    } else {
      return undefined;
    }
  }
  return members.length ? members : undefined;
}

export function extractEnumMember(node: ts.EnumMember): DocEnumMember {
  const name = (node.name as ts.Identifier).getText();
  let value: string | number = name;
  if (node.initializer) {
    if (ts.isNumericLiteral(node.initializer)) {
      value = parseInt(node.initializer.getText(), 10);
    } else if (ts.isStringLiteral(node.initializer)) {
      value = node.initializer.getText().slice(1, -1);
    }
  }
  return { name, value };
}
