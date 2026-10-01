import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const OUT = path.join(process.cwd(), "public", "assets", "hero");
fs.mkdirSync(OUT, { recursive: true });

let seed = 0x6a09e667;
function rand() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 0xffffffff;
}
function clamp(v, a = 0, b = 255) { return Math.max(a, Math.min(b, v)); }

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function pngChunk(type, data) {
  const t = Buffer.from(type);
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}
function makePng(width, height, pixelFn) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x++) {
      const rgba = pixelFn(x, y);
      const off = row + 1 + x * 4;
      raw[off] = rgba[0]; raw[off + 1] = rgba[1]; raw[off + 2] = rgba[2]; raw[off + 3] = rgba[3] ?? 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}
function textureSet(rgb, rough, metal, flags = {}) {
  const size = 48;
  const base = makePng(size, size, (x, y) => {
    const grain = (rand() - 0.5) * 9 + (flags.vertical ? Math.sin(x * 0.85) * 2.2 : 0);
    let mult = flags.seams && x % 12 === 0 ? 0.83 : 1;
    return [
      clamp((rgb[0] + grain) * mult),
      clamp((rgb[1] + grain) * mult),
      clamp((rgb[2] + grain) * mult),
      255,
    ];
  });
  const mr = makePng(size, size, () => [255, clamp(rough * 255 + (rand() - 0.5) * 10), clamp(metal * 255 + (rand() - 0.5) * 6), 255]);
  const normal = makePng(size, size, (x, y) => {
    const a = Math.sin(x * 0.6 + y * 0.17) * 3 + (rand() - 0.5) * 3;
    const b = Math.cos(y * 0.55 + x * 0.11) * 3 + (rand() - 0.5) * 3;
    return [clamp(128 + a), clamp(128 + b), 250, 255];
  });
  return { base, mr, normal };
}

const materialSpecs = {
  stainless: { rgb:[188,194,192], rough:.28, metal:.82, vertical:true },
  galvanized:{ rgb:[157,164,160], rough:.52, metal:.68, vertical:true },
  dark:      { rgb:[29,34,32], rough:.58, metal:.55 },
  white:     { rgb:[222,218,206], rough:.66, metal:.05, seams:true },
  blue:      { rgb:[31,92,143], rough:.44, metal:.28 },
  yellow:    { rgb:[224,174,37], rough:.48, metal:.16 },
  carton:    { rgb:[139,128,109], rough:.92, metal:0 },
  glass:     { rgb:[112,139,145], rough:.12, metal:0, alpha:.32, doubleSided:true },
};

function mat4Euler(rx=0, ry=0, rz=0) {
  const [cx,sx,cy,sy,cz,sz] = [Math.cos(rx),Math.sin(rx),Math.cos(ry),Math.sin(ry),Math.cos(rz),Math.sin(rz)];
  return [
    cy*cz, sx*sy*cz-cx*sz, cx*sy*cz+sx*sz,
    cy*sz, sx*sy*sz+cx*cz, cx*sy*sz-sx*cz,
    -sy, sx*cy, cx*cy,
  ];
}
function transformVertex(v, pos, rot) {
  const m = mat4Euler(...rot);
  return [
    m[0]*v[0]+m[1]*v[1]+m[2]*v[2]+pos[0],
    m[3]*v[0]+m[4]*v[1]+m[5]*v[2]+pos[1],
    m[6]*v[0]+m[7]*v[1]+m[8]*v[2]+pos[2],
  ];
}
function transformNormal(n, rot) {
  const m = mat4Euler(...rot);
  return [
    m[0]*n[0]+m[1]*n[1]+m[2]*n[2],
    m[3]*n[0]+m[4]*n[1]+m[5]*n[2],
    m[6]*n[0]+m[7]*n[1]+m[8]*n[2],
  ];
}
function part() { return { p:[], n:[], uv:[], i:[] }; }
function pushVertex(g, p, n, uv) { g.p.push(...p); g.n.push(...n); g.uv.push(...uv); return g.p.length/3-1; }

function addBox(g, size, pos, rot=[0,0,0]) {
  const [hx,hy,hz] = size.map(v=>v/2);
  const faces = [
    [[1,0,0], [[hx,-hy,-hz],[hx,hy,-hz],[hx,hy,hz],[hx,-hy,hz]]],
    [[-1,0,0],[[-hx,-hy,hz],[-hx,hy,hz],[-hx,hy,-hz],[-hx,-hy,-hz]]],
    [[0,1,0],[[-hx,hy,-hz],[-hx,hy,hz],[hx,hy,hz],[hx,hy,-hz]]],
    [[0,-1,0],[[-hx,-hy,hz],[-hx,-hy,-hz],[hx,-hy,-hz],[hx,-hy,hz]]],
    [[0,0,1], [[-hx,-hy,hz],[hx,-hy,hz],[hx,hy,hz],[-hx,hy,hz]]],
    [[0,0,-1],[[hx,-hy,-hz],[-hx,-hy,-hz],[-hx,hy,-hz],[hx,hy,-hz]]],
  ];
  for (const [normal, vs] of faces) {
    const base = g.p.length/3;
    const nn = transformNormal(normal, rot);
    vs.forEach((v, idx)=>pushVertex(g, transformVertex(v,pos,rot), nn, [[0,0],[1,0],[1,1],[0,1]][idx]));
    g.i.push(base,base+1,base+2, base,base+2,base+3);
  }
}
function addCylinder(g, radius, height, pos, sections=18, rot=[0,0,0], coneTop=radius) {
  const h=height/2;
  for (let s=0;s<sections;s++) {
    const a=s/sections*Math.PI*2, b=(s+1)/sections*Math.PI*2;
    const ca=Math.cos(a), sa=Math.sin(a), cb=Math.cos(b), sb=Math.sin(b);
    const base=g.p.length/3;
    const n1=transformNormal([ca,0,sa],rot), n2=transformNormal([cb,0,sb],rot);
    const verts=[
      [ca*radius,-h,sa*radius],[cb*radius,-h,sb*radius],[cb*coneTop,h,sb*coneTop],[ca*coneTop,h,sa*coneTop]
    ];
    const ns=[n1,n2,n2,n1];
    verts.forEach((v,k)=>pushVertex(g,transformVertex(v,pos,rot),ns[k],[k===1||k===2?1:0,k>=2?1:0]));
    g.i.push(base,base+1,base+2,base,base+2,base+3);
  }
  for (const [y,r,normal,flip] of [[-h,radius,[0,-1,0],true],[h,coneTop,[0,1,0],false]]) {
    const center=pushVertex(g,transformVertex([0,y,0],pos,rot),transformNormal(normal,rot),[.5,.5]);
    for(let s=0;s<sections;s++){
      const a=s/sections*Math.PI*2,b=(s+1)/sections*Math.PI*2;
      const va=pushVertex(g,transformVertex([Math.cos(a)*r,y,Math.sin(a)*r],pos,rot),transformNormal(normal,rot),[(Math.cos(a)+1)/2,(Math.sin(a)+1)/2]);
      const vb=pushVertex(g,transformVertex([Math.cos(b)*r,y,Math.sin(b)*r],pos,rot),transformNormal(normal,rot),[(Math.cos(b)+1)/2,(Math.sin(b)+1)/2]);
      if(flip) g.i.push(center,vb,va); else g.i.push(center,va,vb);
    }
  }
}
function addTorus(g, R, r, pos, major=18, minor=6, rot=[0,0,0]) {
  const start=g.p.length/3;
  for(let a=0;a<major;a++){
    const u=a/major*Math.PI*2;
    for(let b=0;b<minor;b++){
      const v=b/minor*Math.PI*2;
      const x=(R+r*Math.cos(v))*Math.cos(u), y=r*Math.sin(v), z=(R+r*Math.cos(v))*Math.sin(u);
      const nx=Math.cos(v)*Math.cos(u), ny=Math.sin(v), nz=Math.cos(v)*Math.sin(u);
      pushVertex(g,transformVertex([x,y,z],pos,rot),transformNormal([nx,ny,nz],rot),[a/major,b/minor]);
    }
  }
  for(let a=0;a<major;a++) for(let b=0;b<minor;b++){
    const an=(a+1)%major,bn=(b+1)%minor;
    const p0=start+a*minor+b,p1=start+an*minor+b,p2=start+an*minor+bn,p3=start+a*minor+bn;
    g.i.push(p0,p1,p2,p0,p2,p3);
  }
}
function addEgg(g, pos, scale=.065) {
  const ys=[-.58,-.50,-.30,0,.25,.45,.58].map(v=>v*scale);
  const rs=[.02,.21,.34,.40,.34,.20,.015].map(v=>v*scale);
  const seg=16, start=g.p.length/3;
  for(let y=0;y<ys.length;y++) for(let s=0;s<seg;s++){
    const a=s/seg*Math.PI*2, rr=rs[y];
    const nx=Math.cos(a), nz=Math.sin(a);
    pushVertex(g,[pos[0]+nx*rr,pos[1]+ys[y],pos[2]+nz*rr],[nx,.18,nz],[s/seg,y/(ys.length-1)]);
  }
  for(let y=0;y<ys.length-1;y++) for(let s=0;s<seg;s++){
    const sn=(s+1)%seg,a=start+y*seg+s,b=start+y*seg+sn,c=start+(y+1)*seg+sn,d=start+(y+1)*seg+s;
    g.i.push(a,b,c,a,c,d);
  }
}

function grader(high=true) {
  const G={}; const use=n=>G[n]??=(part());
  const rows=high?6:4, cols=high?20:11, lanes=high?6:4;
  for(const z of [-.84,.84]) for(const y of [.56,1.43]) addBox(use("stainless"),[8.8,.085,.085],[-.15,y,z]);
  const legN=high?7:5;
  for(let q=0;q<legN;q++){const x=-4+q*(8/(legN-1));for(const z of [-.77,.77]){addBox(use("stainless"),[.095,1.08,.095],[x,.55,z]);addBox(use("stainless"),[.24,.04,.24],[x,.04,z]);}}
  for(let r=0;r<rows;r++){const z=(r-(rows-1)/2)*.22;addBox(use("dark"),[8.3,.07,.11],[-.1,1.16,z]);addBox(use("stainless"),[8.2,.035,.025],[-.1,1.34,z+.075]);}
  for(let c=0;c<cols;c++){const x=-4.05+c*(7.8/(cols-1));for(let r=0;r<rows;r++){const z=(r-(rows-1)/2)*.22;addCylinder(use("stainless"),.058,.17,[x,1.21,z],10,[Math.PI/2,0,0]);if(high&&c%3===0)addTorus(use("dark"),.078,.014,[x,1.30,z],12,6,[Math.PI/2,0,0]);}}
  const eggs=high?20:10;
  for(let e=0;e<eggs;e++){const z=((e%rows)-(rows-1)/2)*.22;addEgg(use("egg"),[-3.78+e*(7.05/(eggs-1)),1.35,z]);}
  addBox(use("stainless"),[.78,.44,1.70],[-3.95,1.64,0]); addBox(use("stainless"),[1.24,.23,1.80],[-.56,1.94,0]);
  addBox(use("glass"),[.82,.18,.035],[-.56,1.92,.92]); addBox(use("white"),[.62,1.02,.38],[2.62,1.26,-1.04]); addBox(use("glass"),[.36,.22,.035],[2.62,1.48,-1.235]);
  addCylinder(use("dark"),.24,.58,[4.14,.90,.96],18,[0,Math.PI/2,0]);
  for(const z of [-.78,.78]) addBox(use("stainless"),[.10,1.47,.10],[-.56,1.20,z]);
  for(let l=0;l<lanes;l++){const z=-1.32+l*(2.64/(lanes-1));addBox(use("stainless"),[2.35,.09,.26],[3.05,.96,z]);addBox(use("dark"),[2.2,.045,.045],[3.05,1.20,z+.12]);addBox(use("white"),[.38,.42,.34],[4.03,1.17,z]);if(high&&l%2===0)addBox(use("carton"),[.42,.13,.32],[3.47,1.11,z]);}
  addBox(use("galvanized"),[8.2,.055,.16],[-.1,.28,-.98]);
  return G;
}
function processSkid(high=true) {
  const G={}; const use=n=>G[n]??=(part());
  for(const x of [-2.75,0,2.75]) for(const z of [-1.55,1.55]) addBox(use("galvanized"),[.15,7.4,.15],[x,3.7,z]);
  for(const y of [1.4,3.8,6.2,7.35]) for(const z of [-1.55,1.55]) addBox(use("galvanized"),[5.7,.13,.15],[0,y,z]);
  if(high) for(const z of [-1.6,1.6]) for(const x of [-1.38,1.38]) for(const s of [-1,1]) addBox(use("dark"),[3.2,.07,.07],[x,s<0?2.58:5,z],[0,0,s*.72]);
  for(const x of [-1.55,0,1.55]){
    addCylinder(use("stainless"),.56,2.45,[x,5.15,-.6],high?28:18); addCylinder(use("stainless"),.56,1.05,[x,3.38,-.6],high?28:18,[Math.PI,0,0],0);
    addCylinder(use("dark"),.10,.12,[x,5.4,-1.17],10,[Math.PI/2,0,0]);
    if(high) for(const y of [3.87,4.02,6.38]) addTorus(use("dark"),.58,.032,[x,y,-.6],18,6,[Math.PI/2,0,0]);
  }
  addBox(use("blue"),[1.52,2.25,1.16],[3.42,5.10,.5]); addCylinder(use("blue"),.76,1.25,[3.42,3.28,.5],4,[Math.PI,0,Math.PI/4],0);
  addBox(use("dark"),[1.7,.12,1.3],[3.42,6.27,.5]); for(const x of [2.82,4.02]) addBox(use("dark"),[.09,2,.09],[x,3.7,.5]);
  addCylinder(use("galvanized"),.17,5.4,[.05,7.45,.68],16,[0,Math.PI/2,0]); addCylinder(use("galvanized"),.19,3.0,[2.25,6.18,.5],16,[0,Math.PI/2,0]);
  for(const y of [3.9,6.48]){addBox(use("dark"),[5.4,.1,.92],[0,y,1.7]);if(high){for(let q=0;q<7;q++)addBox(use("galvanized"),[.045,.82,.045],[-2.5+q*(5/6),y+.47,2.12]);addBox(use("galvanized"),[5.35,.045,.045],[0,y+.86,2.12]);}}
  for(const x of [2.68,3.30]) addBox(use("yellow"),[.045,7,.045],[x,3.58,-1.72]);
  for(let y=.55;y<6.9;y+=high?.48:.72) addBox(use("yellow"),[.62,.04,.04],[2.99,y,-1.72]);
  addCylinder(use("stainless"),.70,1.20,[2.10,2.10,.4],high?24:16); addCylinder(use("stainless"),.70,1.12,[2.10,.92,.4],high?24:16,[Math.PI,0,0],0); addCylinder(use("dark"),.17,.62,[2.10,.20,.4],10);
  return G;
}

function minmax(values, width) {
  const min=Array(width).fill(Infinity), max=Array(width).fill(-Infinity);
  for(let i=0;i<values.length;i+=width) for(let j=0;j<width;j++){const v=values[i+j];if(v<min[j])min[j]=v;if(v>max[j])max[j]=v;}
  return {min,max};
}
function buildGlb(filename, groups) {
  const gltf={asset:{version:"2.0",generator:"AGROMONT deterministic hero-asset pipeline"},scene:0,scenes:[{nodes:[]}],nodes:[],meshes:[],materials:[],textures:[],images:[],samplers:[{magFilter:9729,minFilter:9987,wrapS:10497,wrapT:10497}],buffers:[{}],bufferViews:[],accessors:[]};
  const chunks=[]; let byteOffset=0;
  function append(buffer, target) {
    const pad=(4-(byteOffset%4))%4; if(pad){chunks.push(Buffer.alloc(pad));byteOffset+=pad;}
    const view={buffer:0,byteOffset,byteLength:buffer.length}; if(target)view.target=target;
    const index=gltf.bufferViews.length; gltf.bufferViews.push(view); chunks.push(buffer); byteOffset+=buffer.length; return index;
  }
  const matIndex={};
  for(const name of Object.keys(groups)) {
    if(matIndex[name]!==undefined) continue;
    const spec=materialSpecs[name] ?? {rgb:[240,230,207],rough:.46,metal:0};
    const maps=textureSet(spec.rgb,spec.rough,spec.metal,spec);
    const texIds=[];
    for(const img of [maps.base,maps.mr,maps.normal]) {
      const bv=append(img); const image=gltf.images.length; gltf.images.push({bufferView:bv,mimeType:"image/png"});
      const tex=gltf.textures.length; gltf.textures.push({sampler:0,source:image}); texIds.push(tex);
    }
    const factor=spec.alpha ? [1,1,1,spec.alpha] : [1,1,1,1];
    const material={name,pbrMetallicRoughness:{baseColorFactor:factor,baseColorTexture:{index:texIds[0]},metallicFactor:spec.metal,roughnessFactor:spec.rough,metallicRoughnessTexture:{index:texIds[1]}},normalTexture:{index:texIds[2]},doubleSided:!!spec.doubleSided};
    if(spec.alpha) material.alphaMode="BLEND";
    matIndex[name]=gltf.materials.length; gltf.materials.push(material);
  }
  for(const [name,g] of Object.entries(groups)) {
    if(!g.p.length) continue;
    const positions=new Float32Array(g.p), normals=new Float32Array(g.n), uvs=new Float32Array(g.uv);
    const use32=(g.p.length/3)>65535; const indices=use32?new Uint32Array(g.i):new Uint16Array(g.i);
    const posView=append(Buffer.from(positions.buffer),34962), nView=append(Buffer.from(normals.buffer),34962), uvView=append(Buffer.from(uvs.buffer),34962), idxView=append(Buffer.from(indices.buffer),34963);
    const mm=minmax(g.p,3);
    const posAcc=gltf.accessors.length; gltf.accessors.push({bufferView:posView,componentType:5126,count:positions.length/3,type:"VEC3",min:mm.min,max:mm.max});
    const nAcc=gltf.accessors.length; gltf.accessors.push({bufferView:nView,componentType:5126,count:normals.length/3,type:"VEC3"});
    const uvAcc=gltf.accessors.length; gltf.accessors.push({bufferView:uvView,componentType:5126,count:uvs.length/2,type:"VEC2",min:[0,0],max:[1,1]});
    const idxAcc=gltf.accessors.length; gltf.accessors.push({bufferView:idxView,componentType:use32?5125:5123,count:indices.length,type:"SCALAR",min:[0],max:[positions.length/3-1]});
    const mesh=gltf.meshes.length; gltf.meshes.push({name,primitives:[{attributes:{POSITION:posAcc,NORMAL:nAcc,TEXCOORD_0:uvAcc},indices:idxAcc,material:matIndex[name],mode:4}]});
    const node=gltf.nodes.length; gltf.nodes.push({name,mesh}); gltf.scenes[0].nodes.push(node);
  }
  const bin=Buffer.concat(chunks); gltf.buffers[0].byteLength=bin.length;
  let json=Buffer.from(JSON.stringify(gltf)); const jsonPad=(4-json.length%4)%4; if(jsonPad) json=Buffer.concat([json,Buffer.alloc(jsonPad,0x20)]);
  const binPad=(4-bin.length%4)%4; const paddedBin=binPad?Buffer.concat([bin,Buffer.alloc(binPad)]):bin;
  const total=12+8+json.length+8+paddedBin.length; const header=Buffer.alloc(12); header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(total,8);
  const jh=Buffer.alloc(8);jh.writeUInt32LE(json.length,0);jh.writeUInt32LE(0x4e4f534a,4);
  const bh=Buffer.alloc(8);bh.writeUInt32LE(paddedBin.length,0);bh.writeUInt32LE(0x004e4942,4);
  fs.writeFileSync(path.join(OUT,filename),Buffer.concat([header,jh,json,bh,paddedBin]));
}

buildGlb("egg-grader-high.glb", grader(true));
buildGlb("egg-grader-medium.glb", grader(false));
buildGlb("process-skid-high.glb", processSkid(true));
buildGlb("process-skid-medium.glb", processSkid(false));

for(const name of fs.readdirSync(OUT).filter(n=>n.endsWith(".glb"))) {
  const bytes=fs.statSync(path.join(OUT,name)).size;
  console.log(`[hero-assets] ${name}: ${(bytes/1024).toFixed(1)} KB`);
}
