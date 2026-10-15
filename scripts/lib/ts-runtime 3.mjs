import {registerHooks} from 'node:module';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import ts from 'typescript';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
registerHooks({
  resolve(specifier, context, next) {
    const base = specifier.startsWith('@/') ? join(root,'src',specifier.slice(2))
      : specifier.startsWith('.') && context.parentURL?.endsWith('.ts')
        ? resolve(dirname(fileURLToPath(context.parentURL)),specifier) : null;
    if (base) for (const candidate of [base + '.ts',join(base,'index.ts')]) {
      if (existsSync(candidate)) return { url:pathToFileURL(candidate).href, shortCircuit:true };
    }
    return next(specifier,context);
  },
  load(url,context,next) {
    if (url.startsWith(pathToFileURL(join(root,'src')).href + '/') && url.endsWith('.ts')) {
      return { format:'module',shortCircuit:true,source:ts.transpileModule(readFileSync(fileURLToPath(url),'utf8'),
        { compilerOptions:{ target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext } }).outputText };
    }
    return next(url,context);
  },
});
