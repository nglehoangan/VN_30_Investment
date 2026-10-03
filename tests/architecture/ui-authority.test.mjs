import { it, expect } from 'vitest';
import ts from 'typescript';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
it('M6.7 UI has no runtime dependency on investment/accounting engines or output assignments', () => {
  const files = readdirSync('src/ui').filter(f => f.endsWith('.tsx'));
  for (const file of files) {
    const source = ts.createSourceFile(file, readFileSync(path.join('src/ui', file), 'utf8'), ts.ScriptTarget.Latest, true);
    const visit = node => {
      if (ts.isImportDeclaration(node) && /\/(domain|application)\//.test(node.moduleSpecifier.text) && node.moduleSpecifier.text !== '@/application/dashboard/model') expect(node.importClause?.isTypeOnly, `${file}: investment imports must be type only`).toBe(true);
      if (ts.isCallExpression(node)) expect(node.expression.getText(source)).not.toMatch(/^(decide|rankScorecards|calculateScorecard|reconstructPortfolio|valuePortfolio|projectAllocation|assessMarginalAllocation)$/);
      if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) expect(node.left.getText(source)).not.toMatch(/\.(decisionState|totalScore|displayRank|authorizedLot|cash|realizedPnl|unrealizedPnl)$/);
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
});
