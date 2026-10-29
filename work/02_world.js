// ===================== DUNYO: relyef, daryo, okean, yo'l, ko'prik, shahar =====================
const WORLD=2000, GN=400, CELL=WORLD/GN, HALF=WORLD/2, ISLAND_R=540, PLAIN_H=3.0, W1=GN+1;
const HM=new Float32Array(W1*W1), RW=new Float32Array(W1*W1), RT=new Float32Array(W1*W1), RD=new Float32Array(W1*W1);
RD.fill(1e9);
const bridges=[], rivers=[], towns=[], roads=[], roadSamples=[];
function hmAt(i,j){ i=i<0?0:(i>GN?GN:i); j=j<0?0:(j>GN?GN:j); return HM[j*W1+i]; }
function terrainBase(x,z){
  const fx=(x+HALF)/CELL, fz=(z+HALF)/CELL; const i=Math.floor(fx), j=Math.floor(fz); const tx=fx-i, tz=fz-j;
  return (hmAt(i,j)*(1-tx)+hmAt(i+1,j)*tx)*(1-tz)+(hmAt(i,j+1)*(1-tx)+hmAt(i+1,j+1)*tx)*tz;
}
function terrainY(x,z){
  let h=terrainBase(x,z);
  for(let k=0;k<bridges.length;k++){
    const b=bridges[k]; const dx=x-b.cx, dz=z-b.cz;
    const al=Math.abs(dx*Math.sin(b.ang)+dz*Math.cos(b.ang)), ac=dx*Math.cos(b.ang)-dz*Math.sin(b.ang);
    if(Math.abs(ac)>4.3) continue;
    if(al<b.half){ if(h<b.deckY) h=b.deckY; }
    else if(al<b.half+10){ const r=b.deckY-(al-b.half)*0.18; if(h<r) h=r; }
  }
  return h;
}
// ko'prik ustidami: {b, al, ac} yoki null
function bridgeAt(x,z){
  for(let k=0;k<bridges.length;k++){
    const b=bridges[k]; const dx=x-b.cx, dz=z-b.cz;
    const al=dx*Math.sin(b.ang)+dz*Math.cos(b.ang), ac=dx*Math.cos(b.ang)-dz*Math.sin(b.ang);
    if(Math.abs(al)<b.half+2 && Math.abs(ac)<6) return {b,al,ac};
  }
  return null;
}
function roadWeight(x,z){ const i=Math.round((x+HALF)/CELL), j=Math.round((z+HALF)/CELL); if(i<0||j<0||i>GN||j>GN) return 0; return RW[j*W1+i]; }
function riverDistAt(x,z){ const i=Math.round((x+HALF)/CELL), j=Math.round((z+HALF)/CELL); if(i<0||j<0||i>GN||j>GN) return 1e9; return RD[j*W1+i]; }
function maskFn(x,z){ return 0.5+0.5*(0.6*Math.sin(x*0.0046+1.1)*Math.cos(z*0.0053+0.3)+0.4*Math.sin((x*0.7+z*1.1)*0.0033+2.0)); }
function hillAt(x,z){ const t=sstep(0.52,0.88,maskFn(x,z)); return t*t*(9+13*(0.5+0.5*Math.sin(x*0.011+z*0.008))); }
function baseH(x,z){
  const r=Math.hypot(x,z);
  const h=PLAIN_H+hillAt(x,z)*sstep(25,100,riverDistAt(x,z));
  return lerp(h,-12,sstep(ISLAND_R-70,ISLAND_R+95,r));
}

// --- daryolar
function makeRiver(){
  const a0=Math.random()*6.283, r0=60+Math.random()*180;
  const sx=Math.cos(a0)*r0, sz=Math.sin(a0)*r0;
  const a1=a0+(Math.random()<0.5?-1:1)*(0.9+Math.random()*1.4);
  const ex=Math.cos(a1)*700, ez=Math.sin(a1)*700;
  const px=-(ez-sz), pz=(ex-sx), pl=Math.hypot(px,pz)||1;
  const ph=Math.random()*6.283, amp=50+Math.random()*50, N=130, pts=[];
  for(let i=0;i<=N;i++){ const t=i/N; const w=Math.sin(t*Math.PI*3+ph)*amp*Math.sin(Math.min(1,t*1.4)*Math.PI*0.5); pts.push({x:sx+(ex-sx)*t+px/pl*w, z:sz+(ez-sz)*t+pz/pl*w}); }
  rivers.push(pts);
}
makeRiver(); makeRiver();
rivers.forEach(pts=>{ pts.forEach(p=>{
  const ci=Math.round((p.x+HALF)/CELL), cj=Math.round((p.z+HALF)/CELL), R=Math.ceil(100/CELL);
  for(let j=cj-R;j<=cj+R;j++){ if(j<0||j>GN) continue; for(let i=ci-R;i<=ci+R;i++){ if(i<0||i>GN) continue;
    const d=Math.hypot(i*CELL-HALF-p.x, j*CELL-HALF-p.z); const idx=j*W1+i; if(d<RD[idx]) RD[idx]=d; } }
}); });

// --- shaharlar (faqat tekis joylarda)
const TOWN_NAMES=['Yangiobod','Gulzor','Qoraqum','Bahor','Sohil','Chorsu','Beshkent','Oqtepa',"Ko'kcha","Navro'z",'Sarbon','Zarafshon'];
(function(){
  let relax=0, tries=0;
  while(towns.length<9 && tries<7000){
    tries++; if(tries%1500===0) relax+=0.05;
    const a=Math.random()*6.283, r=40+Math.random()*390; const x=Math.cos(a)*r, z=Math.sin(a)*r;
    if(!(maskFn(x,z)<0.46+relax && riverDistAt(x,z)>(relax>0?45:62))) continue;
    let ok=true; for(const t of towns){ if(Math.hypot(t.x-x,t.z-z)<(relax>0?115:170)){ ok=false; break; } }
    if(!ok) continue;
    towns.push({x,z,name:TOWN_NAMES[towns.length],big:towns.length<2});
  }
})();
// --- yo'llar
function makeRoad(a,b){
  const dx=b.x-a.x, dz=b.z-a.z, L=Math.hypot(dx,dz)||1, n=Math.max(4,Math.round(L/6));
  const px=-dz/L, pz=dx/L, amp=Math.min(40,L*0.12), ph=Math.random()*6.283, pts=[];
  for(let i=0;i<=n;i++){ const t=i/n; const w=Math.sin(t*Math.PI*2+ph)*amp*Math.sin(t*Math.PI); pts.push({x:a.x+dx*t+px*w, z:a.z+dz*t+pz*w}); }
  return pts;
}
(function(){
  if(towns.length<2) return;
  const used=[0], rest=towns.map((t,i)=>i).slice(1);
  while(rest.length){
    let best=null;
    for(const u of used) for(const v of rest){ const d=Math.hypot(towns[u].x-towns[v].x,towns[u].z-towns[v].z); if(!best||d<best.d) best={u,v,d}; }
    roads.push(makeRoad(towns[best.u],towns[best.v])); used.push(best.v); rest.splice(rest.indexOf(best.v),1);
  }
  for(let k=0;k<3 && towns.length>3;k++){ const a=pick(towns), b=pick(towns); if(a!==b) roads.push(makeRoad(a,b)); }
})();

// --- balandliklar xaritasi
for(let j=0;j<=GN;j++) for(let i=0;i<=GN;i++) HM[j*W1+i]=baseH(i*CELL-HALF,j*CELL-HALF);
roads.forEach(pts=>{
  const n=pts.length, raw=pts.map(p=>baseH(p.x,p.z));
  const prof=raw.map((v,k)=>{ let s=0,c=0; for(let q=Math.max(0,k-8);q<=Math.min(n-1,k+8);q++){ s+=raw[q]; c++; } return s/c; });
  pts.forEach((p,k)=>{
    const q=pts[Math.min(n-1,k+1)], r=pts[Math.max(0,k-1)];
    roadSamples.push({x:p.x,z:p.z,ang:Math.atan2(q.x-r.x,q.z-r.z)});
    const ci=Math.round((p.x+HALF)/CELL), cj=Math.round((p.z+HALF)/CELL), R=4;
    for(let j=cj-R;j<=cj+R;j++){ if(j<0||j>GN) continue; for(let i=ci-R;i<=ci+R;i++){ if(i<0||i>GN) continue;
      const d=Math.hypot(i*CELL-HALF-p.x, j*CELL-HALF-p.z); const w=1-sstep(4.5,17,d); const idx=j*W1+i;
      if(w>RW[idx]){ RW[idx]=w; RT[idx]=prof[k]; } } }
  });
});
for(let idx=0;idx<HM.length;idx++){ if(RW[idx]>0) HM[idx]=lerp(HM[idx],RT[idx],RW[idx]); }
for(let idx=0;idx<HM.length;idx++){ const t=1-sstep(9,26,RD[idx]); if(t>0 && HM[idx]>-2.4) HM[idx]=HM[idx]*(1-t)+(-2.4)*t; }
// --- ko'priklar: yo'l suvdan o'tgan joylarda
function segX(a,b,c,d){ const d1=(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x), d2=(b.x-a.x)*(d.z-a.z)-(b.z-a.z)*(d.x-a.x), d3=(d.x-c.x)*(a.z-c.z)-(d.z-c.z)*(a.x-c.x), d4=(d.x-c.x)*(b.z-c.z)-(d.z-c.z)*(b.x-c.x); return d1*d2<0 && d3*d4<0; }
function addBridge(pts,run){
  const S=pts[Math.max(0,run.s-4)], E=pts[Math.min(pts.length-1,run.e+4)];
  const len=Math.hypot(E.x-S.x,E.z-S.z); if(len>160) return;
  const cx=(S.x+E.x)/2, cz=(S.z+E.z)/2;
  // bir-birining ustiga chiqqan / kesishgan ko'priklarni qurmaymiz
  for(const o of bridges){
    if(Math.hypot(o.cx-cx,o.cz-cz)<o.half+len/2+14) return;
    if(segX(S,E,o.S,o.E)) return;
  }
  bridges.push({cx, cz, S:{x:S.x,z:S.z}, E:{x:E.x,z:E.z}, ang:Math.atan2(E.x-S.x,E.z-S.z), half:len/2+3, len:len+6, deckY:Math.max(1.2,terrainBase(S.x,S.z),terrainBase(E.x,E.z))+0.35});
}
roads.forEach(pts=>{
  let run=null;
  for(let k=0;k<pts.length;k++){
    const wet=terrainBase(pts[k].x,pts[k].z)<-0.2;
    if(wet && !run) run={s:k,e:k}; else if(wet) run.e=k; else if(run){ addBridge(pts,run); run=null; }
  }
  if(run) addBridge(pts,run);
});

