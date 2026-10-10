import {spawn} from 'node:child_process';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
/** System TLS validation; no cookies, credentials, redirects, or shell interpolation. */
export async function systemPublicHttp(url,init){
 const directory=await mkdtemp(join(tmpdir(),'vn30-public-http-')),headers=join(directory,'headers');
 try{return await new Promise((resolve,reject)=>{const parts=[];let size=0;const child=spawn('curl',['--silent','--show-error','--proto','=https','--max-time','45','--max-filesize','64000000','--dump-header',headers,'--header','Accept: '+init.headers.Accept,url],{stdio:['ignore','pipe','ignore'],signal:init.signal});
 child.stdout.on('data',chunk=>{size+=chunk.length;if(size>64_000_000){child.kill();reject(new Error('BODY_LIMIT'));}else parts.push(chunk);});child.on('error',reject);child.on('close',async code=>{if(code!==0){reject(new Error(code===28?'TIMEOUT':code===63?'BODY_LIMIT':'TRANSPORT_ERROR'));return;}try{const text=await readFile(headers,'utf8'),blocks=text.trim().split(/\r?\n\r?\n/),block=blocks.at(-1),lines=block.split(/\r?\n/),status=Number(lines[0].match(/HTTP\/\S+\s+(\d{3})/)?.[1]),values=new Headers();for(const line of lines.slice(1)){const i=line.indexOf(':');if(i>0&&!/^set-cookie:/i.test(line))values.append(line.slice(0,i),line.slice(i+1).trim());}resolve(new Response(Buffer.concat(parts),{status,headers:values}));}catch(error){reject(error);}});
 });}finally{await rm(directory,{recursive:true,force:true});}
}
