/* Minimal static server for local dev (no node install needed — run via
   ELECTRON_RUN_AS_NODE, see tools/serve.cmd). Usage: serve.js [port] */
const http=require("http"),fs=require("fs"),path=require("path");
const root=path.join(__dirname,"..");
const port=+(process.argv[2]||8790);
const mime={".html":"text/html",".js":"text/javascript",".css":"text/css",
  ".svg":"image/svg+xml",".json":"application/json",".png":"image/png",".md":"text/plain"};
http.createServer((req,res)=>{
  let p=decodeURIComponent(req.url.split("?")[0]);
  if(p.endsWith("/")) p+="index.html";
  const f=path.join(root,p);
  if(!f.startsWith(root)){ res.writeHead(403); res.end(); return; }
  fs.readFile(f,(err,data)=>{
    if(err){ res.writeHead(404); res.end("not found"); return; }
    res.writeHead(200,{"Content-Type":mime[path.extname(f)]||"application/octet-stream",
      "Cache-Control":"no-store"});
    res.end(data);
  });
}).listen(port,()=>console.log("aural lab dev server on http://localhost:"+port));
