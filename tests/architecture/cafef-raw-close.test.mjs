import { it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

it('application code cannot read CafeF price fields outside the owner-policy normalizer',()=>{
  const violations=[];
  function scan(directory){
    for(const entry of readdirSync(directory,{withFileTypes:true})){
      const file=path.join(directory,entry.name);
      if(file==='src/infrastructure/db/generated')continue;
      if(entry.isDirectory()){scan(file);continue;}
      if(!/\.[cm]?[jt]sx?$/.test(file))continue;
      const source=ts.createSourceFile(file,readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);
      function visit(node){
        let field;
        if(ts.isPropertyAccessExpression(node))field=node.name.text;
        if(ts.isElementAccessExpression(node)&&node.argumentExpression&&ts.isStringLiteralLike(node.argumentExpression))field=node.argumentExpression.text;
        if(field==='GiaDieuChinh'||(field==='GiaDongCua'&&file!=='src/domain/market-boundary/cafef-raw-close.ts')){
          violations.push(`${file}:${source.getLineAndCharacterOfPosition(node.getStart(source)).line+1}:${field}`);
        }
        ts.forEachChild(node,visit);
      }
      visit(source);
    }
  }
  scan('src');scan('app');
  expect(violations).toEqual([]);
});
