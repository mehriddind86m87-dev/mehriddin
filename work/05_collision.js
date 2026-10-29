// ===================== to'qnashuv (balandlikni hisobga oluvchi tezkor setka) =====================
// Har bir to'siq: AABB (x0..x1, y0..y1, z0..z1). Yuriladigan sirtlar: pol, zinapoya, tom.
const obstacles=[], obGrid=new Map(), OBC=8;
const surfaces=[], sfGrid=new Map();
const covers=[], cvGrid=new Map();
function gk(i,j){ return (i+600)*2000+(j+600); }
function gridAdd(grid,o,x0,x1,z0,z1){
  const i0=Math.floor(x0/OBC), i1=Math.floor(x1/OBC), j0=Math.floor(z0/OBC), j1=Math.floor(z1/OBC);
  for(let i=i0;i<=i1;i++) for(let j=j0;j<=j1;j++){ const k=gk(i,j); let a=grid.get(k); if(!a){ a=[]; grid.set(k,a); } a.push(o); }
}
let _qid=0;
function gridQuery(grid,x0,x1,z0,z1,fn){
  _qid++;
  const i0=Math.floor(x0/OBC), i1=Math.floor(x1/OBC), j0=Math.floor(z0/OBC), j1=Math.floor(z1/OBC);
  for(let i=i0;i<=i1;i++) for(let j=j0;j<=j1;j++){
    const a=grid.get(gk(i,j)); if(!a) continue;
    for(let k=0;k<a.length;k++){ const o=a[k]; if(o._q===_qid) continue; o._q=_qid; if(fn(o)) return true; }
  }
  return false;
}
function registerObstacle(o){ obstacles.push(o); gridAdd(obGrid,o,o.x0,o.x1,o.z0,o.z1); }
// y berilsa — faqat shu balandlikdagi (oyoqdan boshgacha) to'siqlar hisoblanadi
function collides(x,z,radius,y){
  const r=radius||0;
  return gridQuery(obGrid,x-r,x+r,z-r,z+r,o=>{
    if(x<o.x0-r||x>o.x1+r||z<o.z0-r||z>o.z1+r) return false;
    if(y!==undefined && (y+STEP_UP>=o.y1 || y+1.75<=o.y0)) return false;
    return true;
  });
}
const STEP_UP=0.55;
function addCollider(x,y,z,w,h,d){
  const o={x0:x-w/2,x1:x+w/2,y0:y-h/2,y1:y+h/2,z0:z-d/2,z1:z+d/2};
  registerObstacle(o); return o;
}
// yuriladigan sirt: tekis (y) yoki qiya (axis bo'ylab y0→y1)
function addSurface(x0,x1,z0,z1,y0,y1,axis){
  const s={x0,x1,z0,z1,y0,y1:(y1===undefined?y0:y1),axis:axis||null};
  surfaces.push(s); gridAdd(sfGrid,s,x0,x1,z0,z1); return s;
}
function surfY(s,x,z){
  if(!s.axis) return s.y0;
  if(s.axis==='x') return s.y0+(s.y1-s.y0)*((x-s.x0)/(s.x1-s.x0));
  if(s.axis==='-x') return s.y0+(s.y1-s.y0)*((s.x1-x)/(s.x1-s.x0));
  if(s.axis==='z') return s.y0+(s.y1-s.y0)*((z-s.z0)/(s.z1-s.z0));
  return s.y0+(s.y1-s.y0)*((s.z1-z)/(s.z1-s.z0));
}
// (x,z) nuqtadagi, y dan biroz yuqorigacha bo'lgan eng baland yuriladigan sirt
function groundAt(x,z,y){
  let g=terrainY(x,z);
  const lim=(y===undefined?-1e9:y)+STEP_UP+0.05;
  gridQuery(sfGrid,x,x,z,z,s=>{
    if(x<s.x0||x>s.x1||z<s.z0||z>s.z1) return false;
    const h=surfY(s,x,z);
    if(y===undefined){ if(h<terrainY(x,z)+0.8 && h>g) g=h; }
    else if(h<=lim && h>g) g=h;
    return false;
  });
  return g;
}
// tom/ship ostidami (yomg'ir, qor tushmaydi)
function addCover(x0,x1,z0,z1,y){ const c={x0,x1,z0,z1,y}; covers.push(c); gridAdd(cvGrid,c,x0,x1,z0,z1); }
function covered(x,y,z){
  return gridQuery(cvGrid,x,x,z,z,c=>(x>c.x0&&x<c.x1&&z>c.z0&&z<c.z1&&y<c.y));
}
// segment AABB bilan kesishadimi (slab usuli) — qaytaradi: t (0..1) yoki -1
function segBox(ax,ay,az,dx,dy,dz,o){
  let t0=0,t1=1;
  const A=[ax,ay,az], D=[dx,dy,dz], MN=[o.x0,o.y0,o.z0], MX=[o.x1,o.y1,o.z1];
  for(let k=0;k<3;k++){
    if(Math.abs(D[k])<1e-9){ if(A[k]<MN[k]||A[k]>MX[k]) return -1; continue; }
    let u=(MN[k]-A[k])/D[k], v=(MX[k]-A[k])/D[k]; if(u>v){ const t=u; u=v; v=t; }
    if(u>t0) t0=u; if(v<t1) t1=v; if(t0>t1) return -1;
  }
  return t0;
}
// a→b segmentidagi birinchi to'siq (devor, daraxt, quti, relyef). Qaytaradi: masofa ulushi 0..1 yoki 1 (bo'sh)
function segObstacle(a,b){
  const dx=b.x-a.x, dy=b.y-a.y, dz=b.z-a.z;
  let best=1;
  gridQuery(obGrid,Math.min(a.x,b.x),Math.max(a.x,b.x),Math.min(a.z,b.z),Math.max(a.z,b.z),o=>{
    const t=segBox(a.x,a.y,a.z,dx,dy,dz,o); if(t>=0 && t<best) best=t; return false;
  });
  const L=Math.hypot(dx,dz), n=Math.min(60,Math.ceil(L/4));
  for(let i=1;i<n;i++){ const t=i/n; if(t>=best) break; const x=a.x+dx*t, z=a.z+dz*t; if(a.y+dy*t<terrainBase(x,z)-0.1){ best=t; break; } }
  return best;
}
function losClear(a,b){ return segObstacle(a,b)>=0.999; }
