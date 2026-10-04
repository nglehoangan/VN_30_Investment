import { it,expect } from 'vitest';
import { readdirSync,readFileSync } from 'node:fs';
import path from 'node:path';
function sources(directory){return readdirSync(directory,{withFileTypes:true}).flatMap(entry=>{
 const file=path.join(directory,entry.name);return entry.isDirectory()?sources(file):/\.[jt]sx?$/.test(file)?[file]:[];
});}
it('M6.8: no exposed next/og renderer or image-generation convention reaches the advisory surface',()=>{
 for(const file of sources('app')){
  expect(file).not.toMatch(/(?:opengraph|twitter)-image\.[jt]sx?$/);
  expect(readFileSync(file,'utf8')).not.toMatch(/next\/og|next\/dist\/compiled\/@vercel\/og|ImageResponse/);
 }
});
it('M6.8: workflow and analytical layers have no ledger write authority',()=>{
 for(const directory of ['src/domain/scoring','src/domain/ranking','src/domain/decision','src/domain/workflow','src/application/scoring','src/application/decision','src/application/workflow'])for(const file of sources(directory)){
  const source=readFileSync(file,'utf8');
  expect(source,file).not.toMatch(/PrismaPortfolioLedger|new\s+PortfolioEngine|\.ledger\.commit\(|\.ledger\.post\(/);
 }
});
