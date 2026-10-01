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

  // Medium-duty European 4x2 rigid proportions: forward-control day cab,
  // two axles, long box body, clean cab/body gap and low chassis.
  box(p,'dark',[7.15,.20,1.82],[.10,.66,0]);
  box(p,'white',[4.95,2.42,2.28],[1.20,1.88,0]);

  extrudedProfile(
    p,'white',
    [[-3.62,.70],[-3.57,1.13],[-3.40,1.48],[-3.23,2.38],[-2.92,2.72],[-1.48,2.72],[-1.25,2.50],[-1.18,.70]],
    2.16,
  );
  extrudedProfile(
    p,'white',
    [[-1.48,2.64],[-1.08,3.12],[-.42,3.12],[-.12,2.96],[-.12,2.64]],
    2.04,
  );

  // Cab glazing and black surround visually separate the greenhouse from bodywork.
  box(p,'dark',[.045,.98,1.92],[-3.22,2.02,0],[0,0,-.235]);
  box(p,'glass',[.055,.84,1.78],[-3.245,2.03,0],[0,0,-.235]);
  box(p,'dark',[.05,.86,.04],[-3.28,2.03,0],[0,0,-.235]);
  for(const z of [-1.085,1.085]){
    box(p,'dark',[1.10,.82,.055],[-2.24,2.05,z]);
    box(p,'glass',[.96,.69,.036],[-2.24,2.06,z*1.006]);
    box(p,'dark',[.22,.045,.035],[-1.72,1.70,z*1.012]);
    box(p,'dark',[.10,.54,.05],[-2.78,2.10,z*1.34]);
    box(p,'glass',[.085,.34,.24],[-2.78,2.20,z*1.45]);
    box(p,'galv',[.78,.10,.23],[-1.56,.71,z*1.09]);
  }

  // Front fascia: black bumper, grille, inset light clusters and subtle slats.
  box(p,'dark',[.22,.24,2.12],[-3.66,.73,0]);
  box(p,'dark',[.065,.56,1.30],[-3.57,1.08,0]);
  for(let y=.88;y<=1.30;y+=.07) box(p,'galv',[.035,.022,1.12],[-3.61,y,0]);
  for(const z of [-.73,.73]){
    box(p,'amber',[.07,.17,.31],[-3.64,1.37,z]);
    box(p,'white',[.08,.11,.33],[-3.65,1.18,z]);
  }

  // Two-axle 4x2 running gear, closer to DAF LF / Iveco Eurocargo proportions.
  const axles=[-2.42,2.05];
  for(const x of axles) for(const z of [-1.11,1.11]){
    cyl(p,'rubber',.50,.31,[x,.50,z],[Math.PI/2,0,0],56);
    cyl(p,'galv',.19,.33,[x,.50,z*1.012],[Math.PI/2,0,0],32);
    for(let i=0;i<18;i++){
      const a=i/18*Math.PI*2;
      box(p,'rubber',[.12,.034,.35],[x+Math.cos(a)*.485,.50+Math.sin(a)*.485,z],[0,0,a+Math.PI/2]);
    }
  }

  // Proper wheel arches/fenders and chassis equipment.
  for(const x of axles) for(const z of [-1.09,1.09]){
    add(p,'dark',new THREE.TorusGeometry(.585,.055,8,30,Math.PI),[x,.54,z],[0,0,0]);
  }
  for(const z of [-.91,.91]) cyl(p,'galv',.27,1.22,[-.63,.86,z],[0,Math.PI/2,0],28);
  box(p,'dark',[1.25,.22,.72],[-.45,.67,0]);
  for(const z of [-.97,.97]) box(p,'galv',[3.95,.09,.075],[1.16,.59,z]);

  // Box-body construction: aluminium rails, vertical posts, marker lights and tail lift.
  for(let x=-.92;x<=3.48;x+=.55) box(p,'galv',[.026,2.24,2.30],[x,1.88,0]);
  for(const y of [.70,3.08]) for(const z of [-1.155,1.155]) box(p,'galv',[5.06,.065,.05],[1.20,y,z]);
  for(const x of [-.45,.65,1.75,2.85]) for(const z of [-1.18,1.18]) box(p,'amber',[.09,.08,.045],[x,.82,z]);
  box(p,'dark',[.16,2.32,2.18],[3.72,1.84,0]);
  box(p,'galv',[.11,1.95,2.02],[3.80,1.55,0]);
  for(const z of [-.76,.76]) box(p,'red',[.08,.16,.24],[3.88,.76,z]);

  // Commercial finishing details.
  cyl(p,'dark',.07,1.55,[-1.30,1.98,.92],[0,0,0],16);
  for(const z of [-.43,.43]) box(p,'dark',[.48,.018,.022],[-3.30,1.88,z],[0,0,-.08]);
  box(p,'green',[.035,.58,2.20],[1.25,2.00,1.155]);

  return sceneFrom(p,'AGROMONT Ultra Logistics Truck');
}
function eggGeometry(){
  return new THREE.LatheGeometry([
    new THREE.Vector2(0,-.58),new THREE.Vector2(.22,-.53),new THREE.Vector2(.36,-.29),new THREE.Vector2(.405,.02),new THREE.Vector2(.33,.31),new THREE.Vector2(.18,.50),new THREE.Vector2(0,.62)
  ],40);
}
function buildGrader(){
  const p=collection();
  const L=8.9, tracks=6, z0=3.05;

  // Open hygienic stainless base structure.
  for(const z of [-.88,.88]) for(const y of [.55,1.38]) box(p,'stainless',[L,.075,.075],[0,y,z0+z]);
  for(let x=-4.18;x<=4.2;x+=1.18) for(const z of [-.84,.84]){
    box(p,'stainless',[.085,1.12,.085],[x,.57,z0+z]);
    box(p,'stainless',[.26,.055,.22],[x,.06,z0+z]);
  }

  // Six independent carrier tracks with dark chain rails and compact cup pairs.
  for(let r=0;r<tracks;r++){
    const z=z0+(r-(tracks-1)/2)*.245;
    box(p,'dark',[8.34,.05,.07],[-.04,1.13,z-.035]);
    box(p,'dark',[8.34,.05,.07],[-.04,1.13,z+.035]);
    for(let x=-4.02;x<=3.94;x+=.34){
      cyl(p,'stainless',.045,.13,[x,1.18,z-.055],[Math.PI/2,0,0],14);
      cyl(p,'stainless',.045,.13,[x,1.18,z+.055],[Math.PI/2,0,0],14);
    }
  }

  const egg=eggGeometry();
  for(let i=0;i<26;i++){
    const x=-3.88+i*(7.15/25);
    const z=z0+((i%tracks)-(tracks-1)/2)*.245;
    add(p,'egg',egg,[x,1.43,z],[0,0,(i%3-1)*.025],[.25,.25,.25]);
  }

  // Foam-cleanable open infeed: dense roller bank but no bulky enclosure.
  for(let x=-4.20;x<=-3.18;x+=.13) cyl(p,'stainless',.052,1.72,[x,1.18,z0],[Math.PI/2,0,0],16);
  box(p,'stainless',[1.18,.10,1.90],[-3.68,.66,z0]);

  // Long modular grader spine like real Omnia-family machinery, kept shallow
  // so the camera can still read individual egg handling below it.
  box(p,'white',[6.35,.30,.48],[-.10,1.82,z0-.79]);
  box(p,'green',[6.20,.075,.50],[-.10,1.72,z0-.80]);
  for(let x=-2.95;x<=2.75;x+=.95) box(p,'dark',[.045,.26,.51],[x,1.83,z0-.80]);

  // Inspection module with glass face, sensor heads, and a side control console.
  box(p,'stainless',[1.20,.20,1.82],[-.62,1.90,z0]);
  box(p,'glass',[.95,.32,.035],[-.62,1.75,z0+.925]);
  for(const z of [-.62,-.31,0,.31,.62]) box(p,'amber',[.10,.04,.075],[-.62,1.72,z0+z]);
  box(p,'dark',[.62,1.05,.46],[.45,1.28,z0+1.18]);
  box(p,'glass',[.48,.38,.025],[.45,1.48,z0+1.42],[0.10,0,0]);

  // Six packing branches with removable-looking terminal modules and cartons.
  for(let lane=0;lane<6;lane++){
    const z=z0-1.47+lane*.59;
    box(p,'stainless',[2.60,.085,.24],[3.02,.92,z]);
    box(p,'dark',[2.42,.035,.035],[3.02,1.17,z+.11]);
    box(p,'white',[.44,.44,.34],[4.10,1.16,z]);
    if(lane%2===0) box(p,'carton',[.46,.13,.34],[3.52,1.09,z]);
  }

  cyl(p,'dark',.25,.60,[4.28,.84,z0+.98],[0,Math.PI/2,0],28);
  box(p,'dark',[.58,.50,.46],[3.94,.84,z0+.98]);

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
