// Sandboxed live pages cannot use real storage; inject an in-memory fallback so apps keep running.
const SHIM = `<script>(function(){function m(){var d={};return{getItem:function(k){return Object.prototype.hasOwnProperty.call(d,k)?d[k]:null},setItem:function(k,v){d[k]=String(v)},removeItem:function(k){delete d[k]},clear:function(){d={}},key:function(i){return Object.keys(d)[i]||null},get length(){return Object.keys(d).length}}}["localStorage","sessionStorage"].forEach(function(n){try{window[n].getItem("x")}catch(e){try{Object.defineProperty(window,n,{value:m(),configurable:true})}catch(_){}}})})();</script>`;

export function withStorageShim(html: string): string {
  const m = /<head[^>]*>/i.exec(html);
  if (m) return html.slice(0, m.index + m[0].length) + SHIM + html.slice(m.index + m[0].length);
  return SHIM + html;
}
