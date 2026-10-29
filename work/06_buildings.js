// ===================== binolar: PUBG uslubidagi turli xil uylar (birlashtirilgan geometriya) =====================
function scaleBoxUV(geo,w,h,d,s){
  const uv=geo.attributes.uv;
  for(let f=0;f<6;f++){
    let su,sv; if(f<2){su=d;sv=h;} else if(f<4){su=w;sv=d;} else {su=w;sv=h;}
    for(let k=0;k<4;k++){ const i=f*4+k; uv.setXY(i, uv.getX(i)*su/s, uv.getY(i)*sv/s); }
  }
}
const _po=new THREE.Object3D();
function place(geo,x,y,z,ry,sx,sy,sz){ _po.position.set(x,y,z); _po.rotation.set(0,ry||0,0); _po.scale.set(sx||1,sy||1,sz||1); _po.updateMatrix(); geo.applyMatrix4(_po.matrix); return geo; }
function makeBrickTex(base,mortar){
  const c=document.createElement('canvas'); c.width=c.height=256; const x=c.getContext('2d');
  x.fillStyle=mortar; x.fillRect(0,0,256,256);
  for(let r=0;r<16;r++) for(let k=-1;k<9;k++){
    const v=0.82+Math.random()*0.3; const cc=new THREE.Color(base); cc.multiplyScalar(v);
    x.fillStyle='#'+cc.getHexString(); x.fillRect(k*32+(r%2)*16+1,r*16+1,30,14);
  }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=8; return t;
}
function makeMetalTex(base){
  const c=document.createElement('canvas'); c.width=c.height=128; const x=c.getContext('2d');
  x.fillStyle=base; x.fillRect(0,0,128,128);
  for(let i=0;i<128;i+=8){ x.fillStyle='rgba(255,255,255,0.10)'; x.fillRect(i,0,3,128); x.fillStyle='rgba(0,0,0,0.18)'; x.fillRect(i+4,0,3,128); }
  for(let i=0;i<300;i++){ x.fillStyle='rgba(90,50,20,'+Math.random()*0.15+')'; x.fillRect(Math.random()*128,Math.random()*128,2,2+Math.random()*6); }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; return t;
}
const wallTex=['#b8ab94','#a3adb5','#c9b88a','#9a9f9c','#b39c82','#9fae9f'].map(makePlasterTex)
  .concat([makeBrickTex('#8e4a33','#b9b0a2'),makeBrickTex('#a5683f','#c4bcb0'),makeMetalTex('#7d8a8e'),makeMetalTex('#8b6a4f')]);
const plasterTex=wallTex;
const woodTex=makeWoodTex(), concTex=makePlasterTex('#8d8d8a');
const bkWalls=wallTex.map(()=>[]), bkRoofs=[[],[],[],[],[]], bkFloors=[], bkConc=[], bkTrim=[], bkRail=[], bkGlass=[], buildingSpots=[], buildings=[];
const Y0=PLAIN_H, FH=3.2, WT=0.3;
const roofHex=SEASON==='qish'?[0xe4eaee,0xdde4e8,0xd6dde2,0xe9eef1,0xcfd6da]:[0x8a4a32,0x6e4a3a,0x5a5f66,0x7a3f2e,0x6d7478];
const BTYPES={
  house:    {w:[10,13],d:[9,11],floors:1},
  house2:   {w:[11,14],d:[10,12],floors:2},
  apartment:{w:[17,21],d:[12,14],floors:3},
  warehouse:{w:[22,30],d:[15,19],floors:1,h:7.5},
  shed:     {w:[5,6.5],d:[6,7.5],floors:1,h:3},
  shop:     {w:[11,14],d:[9,11],floors:1},
};
function makeBuilding(type,w,d,cx,cz,rot){
  const T=BTYPES[type], ry=rot*Math.PI/2, cs=Math.round(Math.cos(ry)), sn=Math.round(Math.sin(ry));
  const wallI=type==='warehouse'||type==='shed'?(Math.random()<0.5?8:9):(Math.random()<0.35?6+Math.floor(Math.random()*2):Math.floor(Math.random()*6));
  const roofI=Math.floor(Math.random()*4);
  // lokal (lx,lz) → dunyo
  const TX=(lx,lz)=>cx+lx*cs+lz*sn, TZ=(lx,lz)=>cz-lx*sn+lz*cs;
  function aabb(lx0,lx1,lz0,lz1){ const a=TX(lx0,lz0), b=TX(lx1,lz1), c=TZ(lx0,lz0), e=TZ(lx1,lz1); return [Math.min(a,b),Math.max(a,b),Math.min(c,e),Math.max(c,e)]; }
  function geoBox(bucket,lx0,lx1,y0,y1,lz0,lz1,uvs){
    const w_=lx1-lx0, h_=y1-y0, d_=lz1-lz0; if(w_<=0.01||h_<=0.01||d_<=0.01) return;
    const g=new THREE.BoxGeometry(w_,h_,d_); scaleBoxUV(g,w_,h_,d_,uvs||4);
    g.translate((lx0+lx1)/2,(y0+y1)/2,(lz0+lz1)/2); place(g,cx,0,cz,ry); bucket.push(g);
  }
  function solid(bucket,lx0,lx1,y0,y1,lz0,lz1,uvs){
    geoBox(bucket,lx0,lx1,y0,y1,lz0,lz1,uvs);
    const A=aabb(lx0,lx1,lz0,lz1); registerObstacle({x0:A[0],x1:A[1],y0,y1,z0:A[2],z1:A[3]});
  }
  function surf(lx0,lx1,lz0,lz1,y0,y1,laxis){
    const A=aabb(lx0,lx1,lz0,lz1); let axis=null;
    if(laxis){ const v=laxis==='x'?[1,0]:laxis==='-x'?[-1,0]:laxis==='z'?[0,1]:[0,-1];
      const wx=v[0]*cs+v[1]*sn, wz=-v[0]*sn+v[1]*cs; axis=wx>0.5?'x':wx<-0.5?'-x':wz>0.5?'z':'-z'; }
    addSurface(A[0],A[1],A[2],A[3],y0,y1,axis);
  }
  const OPEN={door:[0,2.3],window:[1.0,2.25],shop:[0.45,2.6],big:[0,4.8],high:[4.6,5.9]};
  // devor: o (true=x bo'ylab, z=const) ; teshiklar [{c,w,k}]
  function wall(alongX,fixed,a0,a1,yb,h,ops){
    ops=(ops||[]).slice().sort((p,q)=>p.c-q.c);
    const piece=(s0,s1,y0,y1)=>{ if(s1-s0<0.02||y1-y0<0.02) return;
      if(alongX) solid(bkWalls[wallI],s0,s1,yb+y0,yb+y1,fixed-WT/2,fixed+WT/2); else solid(bkWalls[wallI],fixed-WT/2,fixed+WT/2,yb+y0,yb+y1,s0,s1); };
    const trim=(s0,s1,y0,y1)=>{ if(alongX) geoBox(bkTrim,s0,s1,yb+y0,yb+y1,fixed-WT/2-0.06,fixed+WT/2+0.06); else geoBox(bkTrim,fixed-WT/2-0.06,fixed+WT/2+0.06,yb+y0,yb+y1,s0,s1); };
    const glass=(s0,s1,y0,y1)=>{ if(alongX) geoBox(bkGlass,s0,s1,yb+y0,yb+y1,fixed-0.02,fixed+0.02); else geoBox(bkGlass,fixed-0.02,fixed+0.02,yb+y0,yb+y1,s0,s1); };
    let cur=a0;
    for(const o of ops){
      const s0=o.c-o.w/2, s1=o.c+o.w/2, R=OPEN[o.k]; if(s0<cur+0.2||s1>a1-0.2) continue;
      piece(cur,s0,0,h);
      if(R[0]>0){ piece(s0,s1,0,R[0]); trim(s0-0.08,s1+0.08,R[0]-0.08,R[0]); }
      if(R[1]<h) piece(s0,s1,R[1],h);
      trim(s0-0.1,s0,R[0],Math.min(h,R[1]+0.1)); trim(s1,s1+0.1,R[0],Math.min(h,R[1]+0.1)); if(R[1]<h) trim(s0-0.1,s1+0.1,R[1],R[1]+0.1);
      if(o.k==='window'&&Math.random()<0.25) glass(s0,s1,R[0],R[1]); // butun oyna
      cur=s1;
    }
    piece(cur,a1,0,h);
  }
  function winOps(a0,a1,k,gap,skip){ const r=[]; const L=a1-a0, n=Math.max(1,Math.floor(L/(gap||3.6))); for(let i=0;i<n;i++){ const c=a0+(i+0.5)*L/n; if(skip&&skip.some(s=>Math.abs(s-c)<1.7)) continue; r.push({c,w:k==='shop'?2.4:1.3,k}); } return r; }
  function slab(lx0,lx1,lz0,lz1,y,hole,walkable){ // y = ustki sath
    const rects=[[lx0,lx1,lz0,lz1]];
    if(hole){ rects.length=0; const [hx0,hx1,hz0,hz1]=hole;
      rects.push([lx0,lx1,lz0,hz0]); rects.push([lx0,lx1,hz1,lz1]); rects.push([lx0,hx0,hz0,hz1]); rects.push([hx1,lx1,hz0,hz1]); }
    for(const r of rects){ if(r[1]-r[0]<0.05||r[3]-r[2]<0.05) continue;
      solid(bkConc,r[0],r[1],y-0.25,y-0.04,r[2],r[3],4); geoBox(bkFloors,r[0],r[1],y-0.04,y,r[2],r[3],3);
      if(walkable!==false) surf(r[0],r[1],r[2],r[3],y); }
  }
  function rail(lx0,lx1,lz0,lz1,yb){ solid(bkRail,lx0,lx1,yb,yb+1.0,lz0,lz1); }
  function stairs(lx0,lx1,lz0,lz1,yb,dir){ // dir: 'x' yoki '-x' bo'ylab ko'tariladi
    const L=lx1-lx0, n=16;
    for(let i=0;i<n;i++){ const s0=dir==='x'?lx0+i*L/n:lx1-(i+1)*L/n; geoBox(bkConc,s0,s0+L/n,yb,yb+(i+1)*FH/n,lz0,lz1,3); }
    surf(lx0,lx1,lz0,lz1,yb,yb+FH,dir);
    const lo=dir==='x'?lx0-0.6:lx1+0.6, hi=dir==='x'?lx1+0.8:lx0-0.8, lzc=(lz0+lz1)/2;
    return {lo:P(lo,lzc),hi:P(hi,lzc),y0:yb,y1:yb+FH};
  }
  const hw=w/2, hd=d/2, ix0=-hw+WT/2, ix1=hw-WT/2, iz0=-hd+WT/2, iz1=hd-WT/2;
  const nF=T.floors, H=T.h||FH, rec={type,x:cx,z:cz,floors:[],doors:[],stairs:[],top:0};
  const Ab=aabb(-hw,hw,-hd,hd); rec.x0=Ab[0]; rec.x1=Ab[1]; rec.z0=Ab[2]; rec.z1=Ab[3];
  const P=(lx,lz)=>({x:TX(lx,lz),z:TZ(lx,lz)});
  // poydevor va 1-qavat poli
  geoBox(bkConc,-hw-0.15,hw+0.15,Y0-0.6,Y0+0.1,-hd-0.15,hd+0.15,4); surf(-hw,hw,-hd,hd,Y0+0.12); geoBox(bkFloors,ix0,ix1,Y0+0.1,Y0+0.12,iz0,iz1,3);
  rec.floors.push(Y0+0.12);
  const doorF=[{c:(type==='shop'?0:(Math.random()-0.5)*w*0.3),w:1.4,k:'door'}];
  rec.doors.push({o:P(doorF[0].c,hd+2.2),i:P(doorF[0].c,hd-1.6)});
  if(type==='warehouse'){
    wall(true,hd,-hw,hw,Y0,H,[{c:0,w:5.5,k:'big'}].concat(winOps(-hw,hw,'high',5,[0,1,-1,2,-2])));
    wall(true,-hd,-hw,hw,Y0,H,[{c:-hw*0.4,w:5.5,k:'big'}].concat(winOps(-hw,hw,'high',5,[-hw*0.4])));
    wall(false,-hw,-hd,hd,Y0,H,winOps(-hd,hd,'high',5).concat([{c:hd*0.4,w:1.4,k:'door'}]));
    wall(false,hw,-hd,hd,Y0,H,winOps(-hd,hd,'high',5));
    rec.doors[0]={o:P(0,hd+3),i:P(0,hd-3)}; rec.doors.push({o:P(-hw*0.4,-hd-3),i:P(-hw*0.4,-hd+3)});
    // ichkarida: yashiklar, tokchalar (pana joy)
    for(let k=0;k<6;k++){ const lx=-hw+3+Math.random()*(w-6), lz=-hd+3+Math.random()*(d-6); if(Math.abs(lx)<3.5||Math.abs(lx+hw*0.4)<3.5) continue;
      const s=1.3+Math.random()*0.6, st=Math.random()<0.4?2:1; for(let q=0;q<st;q++) solid(bkTrim,lx-s/2,lx+s/2,Y0+0.12+q*s,Y0+0.12+(q+1)*s,lz-s/2,lz+s/2,s); }
    // ichki ayvon (mezzanine) va zinapoya
    const mz0=-hd+WT/2, mz1=-hd+4.2, sy=Y0+0.12+FH;
    slab(ix0,-hw*0.4-3.2,mz0,mz1,sy); rail(ix0,-hw*0.4-3.2,mz1-0.1,mz1,sy);
    rec.stairs.push(stairs(hw*0.15-5.5,hw*0.15,mz1,mz1+1.3,Y0+0.12,'-x'));
    slab(hw*0.15-6.5,hw*0.15-5.5,mz0,mz1+1.3,sy);
    slab(-hw*0.4+3.2,hw*0.15,mz0,mz1,sy);
    rec.floors.push(sy);
    const rh=2.2; roofGable(-hw-0.4,hw+0.4,-hd-0.4,hd+0.4,Y0+H,rh,4,true);
    addCover(rec.x0,rec.x1,rec.z0,rec.z1,Y0+H+rh); rec.top=Y0+H+rh;
  } else if(type==='shed'){
    wall(true,-hd,-hw,hw,Y0,H,[]); wall(false,-hw,-hd,hd,Y0,H,[]); wall(false,hw,-hd,hd,Y0,H,[{c:0,w:1.2,k:'window'}]);
    // old tomoni ochiq (garaj)
    solid(bkConc,-hw-0.3,hw+0.3,Y0+H,Y0+H+0.25,-hd-0.3,hd+0.6,4);
    rec.doors[0]={o:P(0,hd+2),i:P(0,0)};
    addCover(rec.x0,rec.x1,rec.z0,rec.z1,Y0+H); rec.top=Y0+H+0.25;
  } else {
    const isApt=type==='apartment';
    // zinapoya bo'lagi: orqa devor bo'ylab
    const sL=FH/0.62, sx0=-hw+1.4, sx1=sx0+sL, bA=[iz0+0.05,iz0+1.35], bB=[iz0+1.35,iz0+2.65];
    for(let f=0;f<nF;f++){
      const yb=Y0+0.12+f*FH, yw=Y0+f*FH, hh=FH+(f===0?0.12:0);
      const yWall=f===0?Y0:yb-0.25, hW=f===0?FH+0.12:FH+0.25;
      const fOps=f===0?doorF.concat(winOps(-hw,hw,type==='shop'?'shop':'window',type==='shop'?3.2:3.6,[doorF[0].c])):winOps(-hw,hw,'window');
      wall(true,hd,-hw,hw,yWall,hW,fOps);
      const backOps=winOps(-hw,hw,'window',3.6,f===0&&type!=='shop'?[hw*0.5]:[]).filter(o=>!(o.c>sx0-1&&o.c<sx1+1)); if(f===0&&type!=='shop') backOps.push({c:hw*0.5,w:1.3,k:'door'});
      wall(true,-hd,-hw,hw,yWall,hW,backOps);
      wall(false,-hw,-hd,hd,yWall,hW,winOps(-hd,hd,'window'));
      wall(false,hw,-hd,hd,yWall,hW,winOps(-hd,hd,'window'));
      // ichki devor (xona)
      if(w>9){ const px=hw*0.15+(isApt?2:0); wall(false,px,iz0+2.8,iz1,yWall+(f===0?0.12:0.25),FH-(f===0?0:0),[{c:(iz0+2.8+iz1)/2,w:1.1,k:'door'}]); }
      if(isApt&&w>15){ const px2=-hw*0.45; wall(false,px2,iz0+2.8,iz1,yWall+(f===0?0.12:0.25),FH,[{c:(iz0+2.8+iz1)/2+1,w:1.1,k:'door'}]); }
      if(f>0) rec.floors.push(yb);
      // zinapoya → keyingi qavat (yoki apartment tomi)
      const lastF=f===nF-1, roofAccess=isApt&&lastF;
      if(!lastF||roofAccess){
        const band=f%2===0?bA:bB, dir=f%2===0?'x':'-x';
        rec.stairs.push(stairs(sx0,sx1,band[0],band[1],yb,dir));
        const ny=yb+FH;
        const hole=[sx0-0.1,sx1+0.1,band[0]-0.05,band[1]];
        if(roofAccess){ slab(-hw,hw,-hd,hd,ny,hole); rail(sx0,sx1,band[1],band[1]+0.12,ny); }
        else { slab(ix0,ix1,iz0,iz1,ny,hole); rail(sx0,sx1,band[1],band[1]+0.12,ny); rail(dir==='x'?sx0-0.12:sx1,dir==='x'?sx0:sx1+0.12,band[0],band[1],ny); }
      }
    }
    const topY=Y0+0.12+nF*FH;
    if(isApt){
      // tekis tom + parapet + tomga chiqish joyi ustida soyabon
      const ph=1.0; solid(bkWalls[wallI],-hw,hw,topY,topY+ph,-hd,-hd+WT); solid(bkWalls[wallI],-hw,hw,topY,topY+ph,hd-WT,hd); solid(bkWalls[wallI],-hw,-hw+WT,topY,topY+ph,-hd,hd); solid(bkWalls[wallI],hw-WT,hw,topY,topY+ph,-hd,hd);
      addCover(rec.x0,rec.x1,rec.z0,rec.z1,topY-0.2); rec.floors.push(topY); rec.top=topY+ph;
      geoBox(bkConc,hw-3.5,hw-1,topY,topY+1.6,-hd+1.5,-hd+3,4); solid(bkConc,hw-3.5,hw-1,topY,topY+1.6,-hd+1.5,-hd+3); // konditsioner bloki
    } else {
      slab(-hw-0.2,hw+0.2,-hd-0.2,hd+0.2,topY,null,false);
      const rh=type==='shop'?0:2.4+Math.random()*1.4;
      if(rh>0) roofGable(-hw-0.6,hw+0.6,-hd-0.6,hd+0.6,topY,rh,roofI,false);
      else { solid(bkWalls[wallI],-hw,hw,topY,topY+0.7,hd-WT,hd); solid(bkWalls[wallI],-hw,hw,topY,topY+0.7,-hd,-hd+WT); }
      addCover(rec.x0,rec.x1,rec.z0,rec.z1,topY+rh); rec.top=topY+rh;
    }
    if(type==='shop'){ geoBox(bkRoofs[4],-hw,hw,Y0+2.85,Y0+3.0,hd,hd+2.0,3); const A=aabb(-hw,hw,hd,hd+2.0); addCover(A[0],A[1],A[2],A[3],Y0+2.9);
      [-hw+0.2,hw-0.2].forEach(px=>solid(bkRail,px-0.08,px+0.08,Y0,Y0+2.9,hd+1.85,hd+2.0)); }
    if(type==='house2'&&Math.random()<0.7){ // balkon
      const by=Y0+0.12+FH; slab(-hw*0.6,hw*0.6,hd,hd+1.8,by); rail(-hw*0.6,hw*0.6,hd+1.7,hd+1.8,by); rail(-hw*0.6,-hw*0.6+0.1,hd,hd+1.8,by); rail(hw*0.6-0.1,hw*0.6,hd,hd+1.8,by);
    }
  }
  function roofGable(x0,x1,z0,z1,yb,rh,ri,alongX){
    const ridgeX=(x1-x0)>=(z1-z0);
    const v=[], pushT=(a,b,c)=>{ v.push(...a,...b,...c); };
    if(ridgeX){ const zm=(z0+z1)/2, yt=yb+rh;
      pushT([x0,yb,z1],[x1,yb,z1],[x1,yt,zm]); pushT([x0,yb,z1],[x1,yt,zm],[x0,yt,zm]);
      pushT([x1,yb,z0],[x0,yb,z0],[x0,yt,zm]); pushT([x1,yb,z0],[x0,yt,zm],[x1,yt,zm]);
      pushT([x0,yb,z0],[x0,yb,z1],[x0,yt,zm]); pushT([x1,yb,z1],[x1,yb,z0],[x1,yt,zm]);
    } else { const xm=(x0+x1)/2, yt=yb+rh;
      pushT([x1,yb,z1],[x1,yb,z0],[xm,yt,z0]); pushT([x1,yb,z1],[xm,yt,z0],[xm,yt,z1]);
      pushT([x0,yb,z0],[x0,yb,z1],[xm,yt,z1]); pushT([x0,yb,z0],[xm,yt,z1],[xm,yt,z0]);
      pushT([x0,yb,z1],[x1,yb,z1],[xm,yt,z1]); pushT([x1,yb,z0],[x0,yb,z0],[xm,yt,z0]);
    }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));
    const uv=new Float32Array(v.length/3*2); for(let i=0;i<v.length/3;i++){ uv[i*2]=(v[i*3]+v[i*3+2])*0.25; uv[i*2+1]=v[i*3+1]*0.25; }
    g.setAttribute('uv',new THREE.BufferAttribute(uv,2)); g.computeVertexNormals(); place(g,cx,0,cz,ry); bkRoofs[ri].push(g);
    // tom ham o'q to'sadi (taxminiy)
    const A=aabb(x0,x1,z0,z1); registerObstacle({x0:A[0],x1:A[1],y0:yb,y1:yb+rh*0.6,z0:A[2],z1:A[3],roof:true});
  }
  buildings.push(rec); return rec;
}
function isFlatSpot(x,z,r){
  if(Math.hypot(x,z)>470) return false;
  const P=[[0,0],[r,0],[-r,0],[0,r],[0,-r],[r,r],[-r,-r],[r,-r],[-r,r]];
  for(const p of P){ const px=x+p[0], pz=z+p[1]; if(Math.abs(terrainBase(px,pz)-PLAIN_H)>0.25) return false; if(roadWeight(px,pz)>0.03) return false; }
  return true;
}
function pickType(t,road){
  const r=Math.random();
  if(road) return r<0.4?'house':r<0.65?'shed':r<0.85?'warehouse':'house2';
  if(t.big) return r<0.2?'apartment':r<0.33?'warehouse':r<0.58?'house2':r<0.76?'house':r<0.9?'shop':'shed';
  return r<0.08?'apartment':r<0.18?'warehouse':r<0.42?'house2':r<0.72?'house':r<0.84?'shop':'shed';
}
function planBuildings(){
  const spots=[];
  function tryAdd(x,z,type,rot){
    const T=BTYPES[type], w=T.w[0]+Math.random()*(T.w[1]-T.w[0]), d=T.d[0]+Math.random()*(T.d[1]-T.d[0]);
    const r=Math.hypot(w,d)*0.5+3.5;
    for(const s of spots) if(Math.hypot(x-s.x,z-s.z)<r+s.r) return false;
    if(!isFlatSpot(x,z,Math.max(w,d)*0.5+2)) return false;
    spots.push({x,z,w,d,r,type,rot}); return true;
  }
  towns.forEach(t=>{
    const n=t.big?30:16; let placed=0, tries=0;
    while(placed<n && tries<n*50){ tries++; const a=Math.random()*6.283, rr=10+Math.random()*(t.big?110:72), x=t.x+Math.cos(a)*rr, z=t.z+Math.sin(a)*rr;
      // eshik shahar markaziga qarasin
      const ang=Math.atan2(t.x-x,t.z-z), rot=((Math.round(ang/(Math.PI/2))%4)+4)%4;
      if(tryAdd(x,z,pickType(t,false),rot)) placed++; }
  });
  roads.forEach(rd=>{
    for(let k=5;k<rd.length-6;k+=Math.floor(9+Math.random()*10)){
      if(Math.random()<0.3){ const p=rd[k], q=rd[k+1]; let tx=q.x-p.x, tz=q.z-p.z; const tl=Math.hypot(tx,tz)||1; tx/=tl; tz/=tl; const sg=Math.random()<0.5?1:-1, off=(26+Math.random()*10)*sg;
        const x=p.x-tz*off, z=p.z+tx*off, ang=Math.atan2(p.x-x,p.z-z), rot=((Math.round(ang/(Math.PI/2))%4)+4)%4; tryAdd(x,z,pickType(null,true),rot); }
    }
  });
  return spots.slice(0,190);
}
function finalizeBuildings(){
  const add=(list,mat,shadow)=>{ if(!list.length) return; const m=new THREE.Mesh(mergeGeos(list),mat); m.castShadow=shadow!==false; m.receiveShadow=true; m.frustumCulled=false; scene.add(m); };
  bkWalls.forEach((list,i)=>add(list,new THREE.MeshStandardMaterial({map:wallTex[i],roughness:i>=8?0.6:0.95,metalness:i>=8?0.35:0})));
  bkRoofs.forEach((list,i)=>add(list,new THREE.MeshStandardMaterial({color:roofHex[i],roughness:.85,side:THREE.DoubleSide})));
  add(bkFloors,new THREE.MeshStandardMaterial({map:woodTex,roughness:.9}),false);
  add(bkConc,new THREE.MeshStandardMaterial({map:concTex,roughness:.95}));
  add(bkTrim,new THREE.MeshStandardMaterial({color:0x5a4030,roughness:.8}));
  add(bkRail,new THREE.MeshStandardMaterial({color:0x8a8f94,roughness:.4,metalness:.7}));
  add(bkGlass,new THREE.MeshStandardMaterial({color:0x2a3b45,roughness:.1,metalness:.6,transparent:true,opacity:0.35,emissive:ENV.night?0xffc870:0x000000,emissiveIntensity:ENV.night?0.6:0}),false);
}
function buildingAt(x,z,m){ m=m||0; for(let i=0;i<buildings.length;i++){ const b=buildings[i]; if(x>b.x0-m&&x<b.x1+m&&z>b.z0-m&&z<b.z1+m) return b; } return null; }
function buildCrates(){
  const geos=[], crateMat=new THREE.MeshStandardMaterial({map:makeCrateTex(),roughness:.9});
  for(let i=0;i<90;i++){
    const s=1.4+Math.random()*1.3; let x,z,tries=0;
    do{
      if(Math.random()<0.6 && buildingSpots.length){ const b=pick(buildingSpots); x=b.x+(Math.random()-0.5)*(b.w+14); z=b.z+(Math.random()-0.5)*(b.d+14); }
      else { const a=Math.random()*6.283, r=Math.random()*440; x=Math.cos(a)*r; z=Math.sin(a)*r; }
      tries++;
    }while((collides(x,z,s*0.8+0.6)||buildingAt(x,z,3)||terrainBase(x,z)<1.5||roadWeight(x,z)>0.03)&&tries<30);
    if(tries>=30) continue;
    const y=terrainBase(x,z);
    geos.push(place(new THREE.BoxGeometry(s,s,s),x,y+s/2,z));
    addCollider(x,y+s/2,z,s,s,s);
  }
  if(geos.length){ const m=new THREE.Mesh(mergeGeos(geos),crateMat); m.castShadow=true; m.receiveShadow=true; m.frustumCulled=false; scene.add(m); }
}
