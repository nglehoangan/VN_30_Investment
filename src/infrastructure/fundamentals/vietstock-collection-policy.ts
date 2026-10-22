/** Owner-selected transport boundary; historical resource parsing remains separate. */
export function vietstockCollectionResource(raw:string,base?:string):string {
 const url=new URL(raw,base);
 if(url.protocol!=='https:'||url.username||url.password||url.hash||url.port||!['finance.vietstock.vn','static2.vietstock.vn'].includes(url.hostname))throw new Error('VIETSTOCK_ONLY_SOURCE_POLICY');
 return url.href;
}
