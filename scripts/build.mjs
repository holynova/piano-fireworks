// An explicit runtime allowlist keeps editable scores and offline audio duplicates off the Worker.
import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const dist=path.join(root,'dist');
await rm(dist,{recursive:true,force:true});
await mkdir(path.join(dist,'music'),{recursive:true});
for(const name of ['index.html','player.css','tuning-preview.css','tuning-preview.html','player.js',
  'tuning.js','tuning-preview.js','choreography.js','landscapes.js','fireworks.js','scene.js','project-link.js','export.js','vendor']){
  await cp(path.join(root,name),path.join(dist,name),{recursive:true});
}
for(const name of await readdir(path.join(root,'music'))){
  if(name==='tracks.js'||name.endsWith('.m4a'))await cp(path.join(root,'music',name),path.join(dist,'music',name));
}
