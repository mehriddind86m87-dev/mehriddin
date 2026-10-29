// ===================== o'simliklar =====================
const treeList=[], rockList=[];
function nearBuilding(x,z,m){ for(let i=0;i<buildingSpots.length;i++){ const b=buildingSpots[i]; if(Math.hypot(x-b.x,z-b.z)<Math.max(b.w,b.d)*0.5+m) return true; } return false; }
function landOK(x,z,m){ return terrainBase(x,z)>1.2 && roadWeight(x,z)<0.04 && riverDistAt(x,z)>14 && !nearBuilding(x,z,m); }
function planNature(){
  let n=0, tries=0;
  while(n<900 && tries<9000){
    tries++;
    const a=Math.random()*6.283, r=Math.sqrt(Math.random())*520, x=Math.cos(a)*r, z=Math.sin(a)*r;
    const h=terrainBase(x,z); const hillBias=sstep(PLAIN_H+1,PLAIN_H+9,h);
    const f=Math.sin(x*0.02)*Math.cos(z*0.017)+Math.sin((x+z)*0.011);
    if(!landOK(x,z,5)) continue;
    if(f<-0.15 && Math.random()<0.9-0.5*hillBias) continue;
    if(Math.random()>0.35+0.65*hillBias && Math.random()<0.6) continue;
    treeList.push({x,z,type:Math.random()<0.45+0.4*hillBias?0:1,s:0.8+Math.random()*0.9,rot:Math.random()*6.283}); n++;
  }
  n=0; tries=0;
  while(n<260 && tries<3000){
    tries++;
    const a=Math.random()*6.283, r=Math.sqrt(Math.random())*520, x=Math.cos(a)*r, z=Math.sin(a)*r;
    if(!landOK(x,z,2)) continue;
    rockList.push({x,z,s:0.6+Math.random()*1.8}); n++;
  }
}
function buildTrees(){
  const trunkGeo=new THREE.CylinderGeometry(0.22,0.34,1,7); trunkGeo.translate(0,0.5,0);
  const pineGeo=mergeGeos([0,1,2,3].map(i=>{ const g=new THREE.ConeGeometry(2.2-i*0.45,2.4-i*0.15,9); g.translate(0,3.2+i*1.15,0); return g; }));
  const oakGeo=mergeGeos([[0,5.2,0,2.1],[1.3,4.6,0.4,1.5],[-1.2,4.7,-0.5,1.6],[0.2,6.1,-0.2,1.5]].map(a=>{ const g=new THREE.IcosahedronGeometry(a[3],1); g.translate(a[0],a[1],a[2]); return g; }));
  const trunkMat=new THREE.MeshStandardMaterial({color:0x5b4129,roughness:1});
  const pineMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.95,flatShading:true});
  const oakMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.95,flatShading:true});
  const nP=treeList.filter(t=>t.type===0).length, nO=treeList.length-nP;
  const iP=new THREE.InstancedMesh(pineGeo,pineMat,Math.max(1,nP)), iO=new THREE.InstancedMesh(oakGeo,oakMat,Math.max(1,nO)), iT=new THREE.InstancedMesh(trunkGeo,trunkMat,Math.max(1,treeList.length));
  const o=new THREE.Object3D(), col=new THREE.Color();
  let p=0,q=0;
  treeList.forEach((t,i)=>{
    const y=terrainBase(t.x,t.z);
    o.position.set(t.x,y,t.z); o.rotation.set(0,t.rot,0); o.scale.set(t.s,t.s,t.s); o.updateMatrix();
    if(t.type===0){
      iP.setMatrixAt(p,o.matrix);
      if(SEASON==='qish') col.setHSL(0.36,0.12,0.62+Math.random()*0.15); else col.setHSL(0.30+Math.random()*0.04,0.42,0.17+Math.random()*0.07);
      iP.setColorAt(p,col); p++;
    } else {
      iO.setMatrixAt(q,o.matrix);
      if(SEASON==='qish') col.setHSL(0.08,0.06,0.6+Math.random()*0.15);
      else if(SEASON==='kuz') col.setHSL(0.03+Math.random()*0.10,0.72,0.40+Math.random()*0.08);
      else if(SEASON==='bahor') col.setHSL(0.25+Math.random()*0.05,0.5,0.38+Math.random()*0.08);
      else col.setHSL(0.24+Math.random()*0.06,0.45,0.26+Math.random()*0.08);
      iO.setColorAt(q,col); q++;
    }
    o.scale.set(t.s,t.s*(t.type===0?3.6:4.4),t.s); o.updateMatrix(); iT.setMatrixAt(i,o.matrix);
    addCollider(t.x,y+2.5,t.z,0.9*t.s,5,0.9*t.s);
  });
  [iP,iO,iT].forEach(m=>{ m.castShadow=true; m.receiveShadow=true; m.frustumCulled=false; scene.add(m); });
}
function buildRocks(){
  const geo=new THREE.IcosahedronGeometry(1,1); const pa=geo.attributes.position;
  for(let i=0;i<pa.count;i++){ const k=0.82+Math.random()*0.36; pa.setXYZ(i,pa.getX(i)*k,pa.getY(i)*k,pa.getZ(i)*k); }
  geo.computeVertexNormals();
  const inst=new THREE.InstancedMesh(geo,new THREE.MeshStandardMaterial({color:0xffffff,roughness:.95,flatShading:true}),Math.max(1,rockList.length));
  const o=new THREE.Object3D(), col=new THREE.Color();
  rockList.forEach((r,i)=>{
    const y=terrainBase(r.x,r.z);
    o.position.set(r.x,y+0.2*r.s,r.z); o.rotation.set(Math.random()*3,Math.random()*3,Math.random()*3);
    o.scale.set(r.s*(1+Math.random()*0.6),r.s*(0.6+Math.random()*0.5),r.s*(1+Math.random()*0.6)); o.updateMatrix();
    inst.setMatrixAt(i,o.matrix); const g=0.34+Math.random()*0.18; col.setRGB(g,g*0.98,g*0.93); inst.setColorAt(i,col);
  });
  inst.castShadow=true; inst.receiveShadow=true; inst.frustumCulled=false; scene.add(inst);
}
function makeClumpGeo(){
  const pos=[], nor=[], colr=[];
  for(let k=0;k<5;k++){
    const a=k*Math.PI/5+Math.random()*0.3, cx=Math.cos(a), sz=Math.sin(a), h=0.28+Math.random()*0.22, w=0.055;
    const ox=(Math.random()-0.5)*0.12, oz=(Math.random()-0.5)*0.12, lean=(Math.random()-0.5)*0.14;
    pos.push(ox-w*cx,0,oz-w*sz, ox+w*cx,0,oz+w*sz, ox+lean,h,oz+lean*0.6);
    nor.push(0,1,0,0,1,0,0,1,0); colr.push(0.55,0.55,0.55,0.55,0.55,0.55,1,1,1);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3)); g.setAttribute('color',new THREE.Float32BufferAttribute(colr,3));
  return g;
}
function buildGrass(){
  const N=SEASON==='qish'?9000:26000;
  const inst=new THREE.InstancedMesh(makeClumpGeo(),new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,side:THREE.DoubleSide,vertexColors:true}),N);
  const o=new THREE.Object3D(), col=new THREE.Color();
  let n=0, tries=0;
  while(n<N && tries<N*3){
    tries++;
    const a=Math.random()*6.283, r=Math.sqrt(Math.random())*500, x=Math.cos(a)*r, z=Math.sin(a)*r;
    if(!landOK(x,z,0.5)) continue;
    const y=terrainBase(x,z);
    o.position.set(x,y,z); o.rotation.set(0,Math.random()*6.283,0);
    const s=0.8+Math.random()*1.0; o.scale.set(s,s*(0.8+Math.random()*0.6),s); o.updateMatrix();
    inst.setMatrixAt(n,o.matrix);
    const g=SEASON_COL.g, k=0.85+Math.random()*0.35; col.setRGB(Math.min(1,g[0]*k*1.1),Math.min(1,g[1]*k*1.1),Math.min(1,g[2]*k*1.1)); inst.setColorAt(n,col); n++;
  }
  inst.count=n; inst.receiveShadow=true; inst.frustumCulled=false; scene.add(inst);
}
// uzoq tog'lar (okean ortida)
(function(){
  const mm=new THREE.MeshStandardMaterial({color:SEASON==='qish'?0xdfe6ec:0x6f7a6a, roughness:1, flatShading:true});
  const snow=new THREE.MeshStandardMaterial({color:0xe8eef2, roughness:1, flatShading:true});
  for(let i=0;i<40;i++){
    const a=(i/40)*Math.PI*2+Math.random()*0.1, r=1150+Math.random()*500, h=90+Math.random()*170, rad=70+Math.random()*80;
    const m=new THREE.Mesh(new THREE.ConeGeometry(rad,h,7),mm); m.position.set(Math.cos(a)*r,h/2-6,Math.sin(a)*r); m.rotation.y=Math.random()*3; scene.add(m);
    if(h>140){ const sc=new THREE.Mesh(new THREE.ConeGeometry(rad*0.32,h*0.3,7),snow); sc.position.set(m.position.x,h*0.85-6,m.position.z); scene.add(sc); }
  }
})();

