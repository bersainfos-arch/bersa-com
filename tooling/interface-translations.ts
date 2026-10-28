import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";
import generateModule from "@babel/generator";
import * as types from "@babel/types";
import type { Plugin } from "vite";
import { interfaceCopy } from "../src/lib/interface-copy";

const traverse = (traverseModule as unknown as { default?: typeof traverseModule }).default ?? traverseModule;
const generate = (generateModule as unknown as { default?: typeof generateModule }).default ?? generateModule;
// Compile static interface copy only; never translate user documents or API payloads.
export function interfaceTranslations(): Plugin {
  return {
    name: "bersa-interface-translations", enforce: "pre",
    transform(source, id) {
      const filename = id.split("?")[0] ?? id;
      if (!/\/src\/(components|routes)\/.*\.tsx$/.test(filename) || /\/ui\//.test(filename)) return;
      const ast = parse(source, { sourceType: "module", plugins: ["typescript", "jsx"] });
      let changed = false;
      const translated = (node: types.Expression) => types.callExpression(types.identifier("bersaTranslateUi"), [node]);
      traverse(ast, {
        FunctionDeclaration: { exit(path) {
          if (!path.node.id || !/^[A-Z]/.test(path.node.id.name)) return;
          let containsJsx = false;
          path.traverse({ JSXElement() { containsJsx = true; } });
          if (containsJsx) { path.node.body.body.unshift(types.expressionStatement(types.callExpression(types.identifier("bersaUseUiLanguage"), []))); changed = true; }
        } },
        JSXText(path) {
          const value = path.node.value.replace(/\s+/g, " ");
          if (!/[A-Za-zÀ-ÿ]/.test(value)) return;
          path.replaceWith(types.jsxExpressionContainer(translated(types.stringLiteral(value)))); changed = true;
          path.skip();
        },
        JSXAttribute(path) {
          const name = types.isJSXIdentifier(path.node.name) ? path.node.name.name : "";
          if (!["title", "subtitle", "placeholder", "aria-label", "alt", "label"].includes(name)) return;
          if (types.isStringLiteral(path.node.value)) {
            path.node.value = types.jsxExpressionContainer(translated(path.node.value)); changed = true;
          }
        },
        StringLiteral(path) {
          const property = path.parentPath;
          if (property.isObjectProperty() && types.isIdentifier(property.node.key) && ["title", "content", "label", "role"].includes(property.node.key.name)) {
            // Static metadata and built-in labels only, not prompts or payload values.
            const cleaned = interfaceCopy(path.node.value);
            if (cleaned !== path.node.value) { path.node.value = cleaned; changed = true; }
          }
          if (!/[A-Za-zÀ-ÿ]/.test(path.node.value)) return;
          const parent = path.parentPath;
          const inJsx = Boolean(path.findParent(p => p.isJSXExpressionContainer()));
          const call = parent.isCallExpression() && (
            types.isIdentifier(parent.node.callee, { name: "prompt" }) ||
            types.isMemberExpression(parent.node.callee) && types.isIdentifier(parent.node.callee.object, { name: "toast" })
          );
          // Do not touch comparisons, state values, commands, links or styling.
          if (!(inJsx && (parent.isConditionalExpression() || parent.isLogicalExpression()) || call)) return;
          if (parent.isConditionalExpression() && path.key === "test") return;
          path.replaceWith(translated(types.cloneNode(path.node))); changed = true; path.skip();
        },
        JSXExpressionContainer(path) {
          const expression = path.node.expression;
          if (types.isJSXEmptyExpression(expression)) return;
          // Known built-in labels, not names/titles supplied by users.
          if (types.isIdentifier(expression) && ["label", "name"].includes(expression.name) ||
              types.isMemberExpression(expression) && types.isIdentifier(expression.object) && ["d", "g", "s", "item"].includes(expression.object.name) && types.isIdentifier(expression.property) && ["fr", "en", "name", "nameEn", "title", "titleEn"].includes(expression.property.name)) {
            path.node.expression = translated(expression); changed = true; path.skip();
          }
          if (types.isOptionalMemberExpression(expression) && types.isIdentifier(expression.object, { name: "s" }) && types.isIdentifier(expression.property, { name: "label" })) {
            path.node.expression = translated(expression); changed = true; path.skip();
          }
        },
      });
      if (!changed) return;
      ast.program.body.unshift(types.importDeclaration([types.importSpecifier(types.identifier("bersaTranslateUi"), types.identifier("translateUi")), types.importSpecifier(types.identifier("bersaUseUiLanguage"), types.identifier("useUiLanguage"))], types.stringLiteral("@/lib/translate-ui")));
      const output = generate(ast, { retainLines: true, sourceMaps: true, sourceFileName: id }, source);
      return { code: output.code, map: output.map ? JSON.stringify(output.map) : null };
    },
  };
}