// ===================== relyef, suv, yo'l, ko'prik meshlari =====================
function buildTerrain(){
  const geo=new THREE.PlaneGeometry(WORLD,WORLD,GN,GN);
  const pos=geo.attributes.position, n=pos.count;
  const col=new Float32Array(n*3);
  const winter=SEASON==='qish';
  const rockC=winter?[0.78,0.80,0.84]:[0.50,0.48,0.44], sandC=winter?[0.88,0.88,0.9]:[0.80,0.72,0.52], bedC=[0.24,0.30,0.30], dirtC=[0.46,0.40,0.32];
  for(let idx=0;idx<n;idx++){
    const i=idx%W1, j=Math.floor(idx/W1);
    const x=i*CELL-HALF, z=j*CELL-HALF, h=HM[idx];
    pos.setZ(idx,h);
    const sx=hmAt(i+1,j)-hmAt(i-1,j), sz=hmAt(i,j+1)-hmAt(i,j-1);
    const slope=Math.min(1,Math.hypot(sx,sz)/(2*CELL)*1.7);
    const hv=Math.min(1,Math.max(0,(h-PLAIN_H)/18));
    let c=mixA(SEASON_COL.g,SEASON_COL.g2,hv);
    const v=0.92+0.16*(0.5+0.5*Math.sin(x*0.071)*Math.cos(z*0.063));
    c=[c[0]*v,c[1]*v,c[2]*v];
    c=mixA(c,rockC,Math.pow(slope,1.5)*0.9);
    if(RW[idx]>0) c=mixA(c,dirtC,RW[idx]*0.55);
    const sand=1-sstep(0.3,1.9,h); if(sand>0) c=mixA(c,sandC,sand*(h>-1?1:0.8));
    if(h<0.2) c=mixA(c,bedC,sstep(0.2,-2.5,h)*0.9);
    col[idx*3]=c[0]; col[idx*3+1]=c[1]; col[idx*3+2]=c[2];
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col,3));
  geo.computeVertexNormals();
  const ground=new THREE.Mesh(geo, new THREE.MeshStandardMaterial({map:makeDetailTex(), vertexColors:true, roughness:1}));
  ground.rotation.x=-Math.PI/2; ground.receiveShadow=true;
  scene.add(ground);
}
const waterTex=makeRippleTex();
let waterMesh=null;
function buildWater(){
  const wc=SEASON==='qish'?[0.55,0.72,0.8]:[0.17,0.47,0.58];
  const m=new THREE.MeshStandardMaterial({color:new THREE.Color(wc[0],wc[1],wc[2]), map:waterTex, transparent:true, opacity:0.88, roughness:0.08, metalness:0.35});
  waterMesh=new THREE.Mesh(new THREE.PlaneGeometry(6000,6000), m);
  waterMesh.rotation.x=-Math.PI/2; waterMesh.position.y=0; waterMesh.receiveShadow=true;
  scene.add(waterMesh);
}
function buildRoadMesh(pts){
  const n=pts.length, pos=new Float32Array(n*2*3), uv=new Float32Array(n*2*2), idx=[];
  let dist=0;
  for(let k=0;k<n;k++){
    const p=pts[k], q=pts[Math.min(n-1,k+1)], r=pts[Math.max(0,k-1)];
    let tx=q.x-r.x, tz=q.z-r.z; const tl=Math.hypot(tx,tz)||1; tx/=tl; tz/=tl;
    const nx=-tz, nz=tx;
    if(k>0) dist+=Math.hypot(p.x-pts[k-1].x,p.z-pts[k-1].z);
    for(let s=0;s<2;s++){
      const sg=s?1:-1, x=p.x+nx*3.6*sg, z=p.z+nz*3.6*sg, o=k*2+s;
      pos[o*3]=x; pos[o*3+1]=terrainY(x,z)+0.1; pos[o*3+2]=z; uv[o*2]=s; uv[o*2+1]=dist/10;
    }
    if(k<n-1){ const a=k*2; idx.push(a,a+1,a+2, a+1,a+3,a+2); }
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  g.setIndex(idx); g.computeVertexNormals(); return g;
}
function buildRoads(){
  const mat=new THREE.MeshStandardMaterial({map:makeRoadTex(), roughness:0.95, polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-2});
  roads.forEach(pts=>{ const m=new THREE.Mesh(buildRoadMesh(pts),mat); m.receiveShadow=true; m.frustumCulled=false; scene.add(m); });
}
function buildBridges(){
  const deckM=new THREE.MeshStandardMaterial({color:0x6f6f72,roughness:0.92}), railM=new THREE.MeshStandardMaterial({color:0xb8b8bc,roughness:0.5,metalness:0.6}), pillarM=new THREE.MeshStandardMaterial({color:0x5d5d62,roughness:0.95}), curbM=new THREE.MeshStandardMaterial({color:0x9a9a9e,roughness:0.9});
  bridges.forEach(b=>{
    const g=new THREE.Group(); g.position.set(b.cx,b.deckY,b.cz); g.rotation.y=b.ang;
    const deck=new THREE.Mesh(new THREE.BoxGeometry(8.6,0.6,b.len),deckM); deck.position.y=-0.32; deck.castShadow=true; deck.receiveShadow=true; g.add(deck);
    const girder=new THREE.Mesh(new THREE.BoxGeometry(6.2,1.2,b.len),pillarM); girder.position.y=-1.2; girder.castShadow=true; g.add(girder);
    [-1,1].forEach(sg=>{
      const curb=new THREE.Mesh(new THREE.BoxGeometry(0.6,0.25,b.len),curbM); curb.position.set(sg*4.0,0.1,0); g.add(curb);
      const rail=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.12,b.len),railM); rail.position.set(sg*4.2,1.05,0); g.add(rail);
      const rail2=rail.clone(); rail2.position.y=0.6; g.add(rail2);
      for(let z=-b.len/2+0.5; z<=b.len/2; z+=2.5){ const post=new THREE.Mesh(new THREE.BoxGeometry(0.14,1.1,0.14),railM); post.position.set(sg*4.2,0.55,z); g.add(post); }
    });
    for(let z=-b.len/2+6; z<=b.len/2-5; z+=12){ const pl=new THREE.Mesh(new THREE.BoxGeometry(5.4,9,1.4),pillarM); pl.position.set(0,-6.2,z); pl.castShadow=true; g.add(pl); }
    scene.add(g);
  });
}
