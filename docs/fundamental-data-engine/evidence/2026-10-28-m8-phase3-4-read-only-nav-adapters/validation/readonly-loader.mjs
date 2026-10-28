import ts from 'typescript';
import {readFile} from 'node:fs/promises';import{existsSync}from'node:fs';
const root=process.cwd()+'/';
export async function resolve(s,c,n){if(s.startsWith('@/'))return{url:new URL(root+'src/'+s.slice(2)+(existsSync(root+'src/'+s.slice(2)+'.ts')?'.ts':'/index.ts'),'file:').href,shortCircuit:true};if(s.startsWith('.')&&c.parentURL?.endsWith('.ts')&&!/\.[a-z]+$/.test(s))return{url:new URL(s+'.ts',c.parentURL).href,shortCircuit:true};return n(s,c);}
export async function load(u,c,n){if(u.endsWith('.ts'))return{format:'module',source:ts.transpileModule(await readFile(new URL(u),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText,shortCircuit:true};return n(u,c);}
