import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class NodeFileReader {
    constructor() { this.result = null; this.onloadend = null; this.onerror = null; this.listeners = new Map(); }
    addEventListener(name, callback) { const list=this.listeners.get(name) ?? []; list.push(callback); this.listeners.set(name,list); }
    removeEventListener(name, callback) { const list=this.listeners.get(name) ?? []; this.listeners.set(name,list.filter((x)=>x!==callback)); }
    dispatch(name) { const event={ target:this }; this[`on${name}`]?.(event); for (const cb of this.listeners.get(name) ?? []) cb(event); }
    async readAsArrayBuffer(blob) { try { this.result=await blob.arrayBuffer(); this.dispatch('loadend'); } catch (error) { this.onerror?.(error); this.dispatch('error'); } }
    async readAsDataURL(blob) { try { const buffer=Buffer.from(await blob.arrayBuffer()); this.result=`data:${blob.type || 'application/octet-stream'};base64,${buffer.toString('base64')}`; this.dispatch('loadend'); } catch (error) { this.onerror?.(error); this.dispatch('error'); } }
  };
}

const outputDir=path.resolve(process.cwd(),'public/models');
fs.mkdirSync(outputDir,{recursive:true});

const materials={
  white:new THREE.MeshPhysicalMaterial({name:'Commercial white paint',color:0xe0ddd2,roughness:.42,metalness:.02,clearcoat:.12,clearcoatRoughness:.64}),
  dark:new THREE.MeshStandardMaterial({name:'Dark coated steel',color:0x101512,roughness:.52,metalness:.48}),
  galv:new THREE.MeshStandardMaterial({name:'Galvanized steel',color:0xa2aaa4,roughness:.40,metalness:.74}),
  stainless:new THREE.MeshPhysicalMaterial({name:'Stainless steel',color:0xc7ccca,roughness:.27,metalness:.84,clearcoat:.04,clearcoatRoughness:.40}),
  glass:new THREE.MeshPhysicalMaterial({name:'Smoked glazing',color:0x74908c,roughness:.12,metalness:0,transparent:true,opacity:.72,transmission:.22,thickness:.10,ior:1.45}),
  rubber:new THREE.MeshStandardMaterial({name:'Rubber',color:0x090b0a,roughness:.91,metalness:0}),
  amber:new THREE.MeshStandardMaterial({name:'Amber lens',color:0xff8a24,emissive:0x6f2100,emissiveIntensity:.65,roughness:.25}),
  red:new THREE.MeshStandardMaterial({name:'Red lens',color:0xb71914,emissive:0x410000,emissiveIntensity:.45,roughness:.26}),
  green:new THREE.MeshPhysicalMaterial({name:'AGROMONT green',color:0x164d2e,roughness:.45,metalness:.04,clearcoat:.10,clearcoatRoughness:.58}),
  egg:new THREE.MeshPhysicalMaterial({name:'Egg shell',color:0xf1e5ce,roughness:.38,clearcoat:.04,clearcoatRoughness:.78}),
  blue:new THREE.MeshPhysicalMaterial({name:'Industrial blue',color:0x1a6595,roughness:.44,metalness:.24,clearcoat:.06}),
  yellow:new THREE.MeshStandardMaterial({name:'Safety yellow',color:0xe0aa22,roughness:.50,metalness:.12}),
  carton:new THREE.MeshStandardMaterial({name:'Carton',color:0x92704a,roughness:.90,metalness:0}),
};

function collection(){ return new Map(); }
function transformed(geometry,position=[0,0,0],rotation=[0,0,0],scale=[1,1,1]){
  const g=geometry.clone();
  const matrix=new THREE.Matrix4();
  const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation));
  matrix.compose(new THREE.Vector3(...position),q,new THREE.Vector3(...scale));
  g.applyMatrix4(matrix);
  return g;
}
function add(parts,material,geometry,position,rotation,scale){
  const list=parts.get(material) ?? [];
  list.push(transformed(geometry,position,rotation,scale));
  parts.set(material,list);
}
function box(parts,mat,size,pos=[0,0,0],rot=[0,0,0]){ add(parts,mat,new THREE.BoxGeometry(...size),pos,rot); }
function cyl(parts,mat,radius,height,pos=[0,0,0],rot=[0,0,0],segments=24){ add(parts,mat,new THREE.CylinderGeometry(radius,radius,height,segments),pos,rot); }
function extrudedProfile(parts,mat,points,depth){
  const shape=new THREE.Shape();
  shape.moveTo(points[0][0],points[0][1]);
  for (let i=1;i<points.length;i++) shape.lineTo(points[i][0],points[i][1]);
  shape.closePath();
  const g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:2,bevelSize:.035,bevelThickness:.03,curveSegments:1,steps:1});
  g.translate(0,0,-depth/2);
  add(parts,mat,g,[0,0,0]);
}
function sceneFrom(parts,name){
  const scene=new THREE.Scene(); scene.name=name;
  for (const [matName,geometries] of parts){
    const merged=mergeGeometries(geometries,false);
    if(!merged) continue;
    merged.computeVertexNormals();
    const mesh=new THREE.Mesh(merged,materials[matName]);
    mesh.name=matName; mesh.castShadow=true; mesh.receiveShadow=true;
    scene.add(mesh);
  }
  return scene;
}
async function write(scene,file){
  const exporter=new GLTFExporter();
  const result=await exporter.parseAsync(scene,{binary:true,onlyVisible:true,includeCustomExtensions:true});
  const buffer=Buffer.from(result);
  fs.writeFileSync(path.join(outputDir,file),buffer);
  console.log(`[hero-assets] ${file} ${(buffer.byteLength/1024).toFixed(1)} KiB`);
}

function buildTruck(){
  const p=collection();
  box(p,'dark',[6.7,.22,1.86],[.35,.67,0]);
  box(p,'white',[5.28,2.30,2.22],[1.28,1.88,0]);
  extrudedProfile(p,'white',[[-3.72,.68],[-3.65,1.18],[-3.36,1.55],[-3.12,2.48],[-2.78,2.78],[-1.36,2.78],[-1.18,2.50],[-1.13,.68]],2.10);
  extrudedProfile(p,'white',[[-1.48,2.70],[-1.02,3.18],[-.12,3.18],[-.12,2.70]],2.0);
  box(p,'dark',[.20,.22,2.08],[-3.76,.72,0]); box(p,'dark',[.06,.48,1.22],[-3.64,1.08,0]);
  box(p,'glass',[.05,.84,1.76],[-3.18,2.06,0],[0,0,-.27]);
  box(p,'dark',[.05,.05,1.84],[-3.14,2.47,0],[0,0,-.27]); box(p,'dark',[.05,.05,1.84],[-3.34,1.70,0],[0,0,-.27]);
  for(const z of [-1.065,1.065]){
    box(p,'glass',[.92,.66,.035],[-2.18,2.06,z]); box(p,'dark',[.22,.04,.035],[-1.73,1.72,z*1.01]);
    box(p,'dark',[.10,.52,.05],[-2.76,2.12,z*1.35]); box(p,'glass',[.08,.34,.24],[-2.76,2.21,z*1.46]);
    box(p,'galv',[.78,.10,.24],[-1.58,.72,z*1.08]); box(p,'galv',[4.55,.10,.08],[1.22,.60,z*.92]);
  }
  for(let y=.92;y<=1.29;y+=.075) box(p,'galv',[.035,.025,1.02],[-3.675,y,0]);
  for(let x=-.9;x<=3.4;x+=.61) box(p,'galv',[.028,2.16,2.27],[x,1.89,0]);
  for(const y of [.76,3.04]) for(const z of [-1.14,1.14]) box(p,'galv',[5.36,.07,.05],[1.28,y,z]);
  box(p,'dark',[.16,.20,2.18],[3.98,.64,0]);
  for(const x of [-2.36,.25,2.55]) for(const z of [-1.10,1.10]){
    cyl(p,'rubber',.47,.30,[x,.47,z],[Math.PI/2,0,0],48); cyl(p,'galv',.19,.32,[x,.47,z*1.015],[Math.PI/2,0,0],28);
    for(let i=0;i<16;i++){const a=i/16*Math.PI*2; box(p,'rubber',[.115,.035,.34],[x+Math.cos(a)*.455,.47+Math.sin(a)*.455,z],[0,0,a+Math.PI/2]);}
  }
  for(const x of [.25,2.55]) for(const z of [-1.02,1.02]) box(p,'rubber',[.08,.62,.32],[x+.42,.40,z]);
  for(const z of [-.90,.90]) cyl(p,'galv',.26,1.16,[-.76,.88,z],[0,Math.PI/2,0],24);
  cyl(p,'dark',.07,1.55,[-1.33,2.0,.92],[0,0,0],14);
  for(const z of [-.72,.72]){box(p,'amber',[.06,.17,.28],[-3.72,1.34,z]); box(p,'red',[.07,.15,.22],[4.02,.83,z]);}
  box(p,'green',[.035,.58,2.20],[1.65,2.00,1.135]);
  return sceneFrom(p,'AGROMONT Ultra Logistics Truck');
}

function eggGeometry(){
  return new THREE.LatheGeometry([
    new THREE.Vector2(0,-.58),new THREE.Vector2(.22,-.53),new THREE.Vector2(.36,-.29),new THREE.Vector2(.405,.02),new THREE.Vector2(.33,.31),new THREE.Vector2(.18,.50),new THREE.Vector2(0,.62)
  ],40);
}
function buildGrader(){
  const p=collection(), L=8.8, rows=6, z0=3.05;
  for(const z of [-.82,.82]) for(const y of [.58,1.46]) box(p,'stainless',[L,.08,.08],[0,y,z0+z]);
  for(let x=-4.15;x<=4.16;x+=1.38) for(const z of [-.78,.78]) box(p,'stainless',[.09,1.15,.09],[x,.58,z0+z]);
  for(let r=0;r<rows;r++){
    const z=z0+(r-(rows-1)/2)*.245; box(p,'dark',[8.3,.055,.10],[-.05,1.18,z]);
    for(let x=-4.0;x<=3.86;x+=.31) cyl(p,'stainless',.052,.17,[x,1.22,z],[Math.PI/2,0,0],12);
  }
  const egg=eggGeometry();
  for(let i=0;i<24;i++){const x=-3.8+i*(6.9/23),z=z0+((i%rows)-(rows-1)/2)*.245; add(p,'egg',egg,[x,1.48,z],[0,0,(i%3-.8)*.03],[.265,.265,.265]);}
  box(p,'stainless',[1.18,.12,1.78],[-3.75,1.10,z0]); box(p,'stainless',[.78,.44,1.78],[-3.95,1.68,z0]);
  for(let x=-4.15;x<=-3.32;x+=.16) cyl(p,'dark',.06,1.62,[x,1.30,z0],[Math.PI/2,0,0],14);
  box(p,'stainless',[1.30,.20,1.90],[-.55,1.95,z0]); box(p,'glass',[1.05,.34,.035],[-.55,1.75,z0+.965]);
  for(const z of [-.62,-.31,0,.31,.62]) box(p,'amber',[.12,.045,.08],[-.55,1.73,z0+z]);
  for(let lane=0;lane<6;lane++){
    const z=z0-1.35+lane*.54; box(p,'stainless',[2.45,.09,.26],[3.05,.96,z]); box(p,'dark',[2.30,.04,.04],[3.05,1.22,z+.12]);
    box(p,'white',[.38,.42,.34],[4.10,1.18,z]); if(lane%2===0) box(p,'carton',[.42,.13,.32],[3.45,1.12,z]);
  }
  cyl(p,'dark',.25,.62,[4.26,.88,z0+.96],[0,Math.PI/2,0],24); box(p,'dark',[.58,.52,.48],[3.92,.88,z0+.96]);
  return sceneFrom(p,'AGROMONT Ultra Egg Grader');
}

function buildFeedProcess(){
  const p=collection();
  for(const x of [-2.2,0,2.2]) for(const z of [-.95,.95]) box(p,'galv',[.13,5.8,.13],[x,2.9,z]);
  for(const y of [1.2,3.1,5.0]) for(const z of [-.95,.95]) box(p,'galv',[4.55,.12,.13],[0,y,z]);
  for(const x of [-1.1,1.1]) for(const s of [-1,1]) box(p,'dark',[2.6,.065,.065],[x,3.0,1.02],[0,0,s*.80]);
  box(p,'blue',[1.50,2.25,1.16],[1.25,4.0,0]);
  add(p,'blue',new THREE.ConeGeometry(.82,1.30,4),[1.25,2.25,0],[Math.PI,Math.PI/4,0]);
  for(let y=4.0;y<=6.1;y+=.5) cyl(p,'galv',.14,.58,[.15,y,0],[0,0,0],18);
  for(let x=-1.5;x<=.31;x+=.45) cyl(p,'galv',.14,.48,[x,6.15,0],[0,0,Math.PI/2],18);
  for(const x of [-1.45,-.35]){cyl(p,'stainless',.48,1.5,[x,4.45,-.45],[0,0,0],28); add(p,'stainless',new THREE.ConeGeometry(.48,1.10,28),[x,3.15,-.45],[Math.PI,0,0]);}
  box(p,'galv',[4.7,.10,1.15],[0,5.35,1.25]);
  for(let x=-2.2;x<=2.21;x+=.49) box(p,'galv',[.04,.75,.04],[x,5.75,1.78]); box(p,'galv',[4.5,.04,.04],[0,6.10,1.78]);
  for(let y=.5;y<=5.0;y+=.45) box(p,'yellow',[.72,.035,.035],[-2.55,y,1.0]); box(p,'yellow',[.04,5.2,.04],[-2.88,2.6,1.0]); box(p,'yellow',[.04,5.2,.04],[-2.22,2.6,1.0]);
  return sceneFrom(p,'AGROMONT Ultra Feed Process');
}

await write(buildTruck(),'truck-ultra.glb');
await write(buildGrader(),'egg-grader-ultra.glb');
await write(buildFeedProcess(),'feed-process-ultra.glb');
