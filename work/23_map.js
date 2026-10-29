// ===================== XARITA (minixarita va katta xarita) =====================
const MAP_R=700, MAPPX=1024;
let mapStatic=null, bigOpen=false;
const mm=document.getElementById('minimap'), mctx=mm.getContext('2d');
const bigc=document.getElementById('bigcanvas'), bctx=bigc.getContext('2d');
function buildMapStatic(){
  mapStatic=document.createElement('canvas'); mapStatic.width=mapStatic.height=MAPPX;
  const c=mapStatic.getContext('2d'), img=c.createImageData(MAPPX,MAPPX), d=img.data, k=2*MAP_R/MAPPX;
  const win=SEASON==='qish';
  for(let py=0;py<MAPPX;py++){
    for(let px=0;px<MAPPX;px++){
      const x=(px*k)-MAP_R, z=(py*k)-MAP_R, h=terrainBase(x,z);
      let r,g,b;
      if(h<-0.2){ const t=Math.min(1,(-h)/6); r=30-18*t; g=100-45*t; b=150-50*t; if(win){ r+=70; g+=60; b+=40; } }
      else if(h<1.7){ r=216; g=202; b=152; if(win){ r=232; g=234; b=238; } }
      else {
        const t=Math.min(1,Math.max(0,(h-PLAIN_H)/18)), sh=1+(terrainBase(x+9,z+9)-terrainBase(x-9,z-9))*0.045;
        if(win){ r=236-30*t; g=240-30*t; b=244-20*t; }
        else if(SEASON==='kuz'){ r=150-40*t; g=132-40*t; b=66-20*t; }
        else { r=96-40*t; g=146-60*t; b=84-40*t; }
        if(h>PLAIN_H+13){ const q=Math.min(1,(h-PLAIN_H-13)/8); r+= (140-r)*q*0.6; g+=(135-g)*q*0.6; b+=(125-b)*q*0.6; }
        r*=sh; g*=sh; b*=sh;
      }
      const o=(py*MAPPX+px)*4; d[o]=Math.max(0,Math.min(255,r)); d[o+1]=Math.max(0,Math.min(255,g)); d[o+2]=Math.max(0,Math.min(255,b)); d[o+3]=255;
    }
  }
  c.putImageData(img,0,0);
  const X=x=>(x+MAP_R)/k, Z=z=>(z+MAP_R)/k;
  c.strokeStyle='#e8d9a8'; c.lineWidth=3; c.lineJoin='round';
  roads.forEach(pts=>{ c.beginPath(); pts.forEach((p,i)=>{ if(i) c.lineTo(X(p.x),Z(p.z)); else c.moveTo(X(p.x),Z(p.z)); }); c.stroke(); });
  c.fillStyle='#8a8a8f'; bridges.forEach(b=>{ c.fillRect(X(b.cx)-4,Z(b.cz)-4,8,8); });
  c.fillStyle='#4a4a4f'; buildingSpots.forEach(b=>{ c.fillRect(X(b.x)-2,Z(b.z)-2,4,4); });
  c.font='bold 22px sans-serif'; c.textAlign='center'; c.lineWidth=4; c.strokeStyle='rgba(0,0,0,0.75)'; c.fillStyle='#ffffff';
  towns.forEach(t=>{ c.strokeText(t.name,X(t.x),Z(t.z)-14); c.fillText(t.name,X(t.x),Z(t.z)-14); c.beginPath(); c.arc(X(t.x),Z(t.z),5,0,6.283); c.fillStyle='#ffd34d'; c.fill(); c.fillStyle='#ffffff'; });
}
function mapOverlay(c,size,cx,cz,range){
  const k=size/(2*range), X=x=>(x-cx)*k+size/2, Z=z=>(z-cz)*k+size/2;
  c.lineWidth=2; c.strokeStyle='#3fa9f5'; c.beginPath(); c.arc(X(zone.cx),Z(zone.cz),zone.radius*k,0,Math.PI*2); c.stroke();
  c.lineWidth=1.5; c.strokeStyle='#ffffff'; c.beginPath(); c.arc(X(zone.tcx),Z(zone.tcz),zone.tr*k,0,Math.PI*2); c.stroke();
  if(planeActive||phase==='plane'){
    c.save(); c.setLineDash([8,5]); c.strokeStyle='rgba(255,255,255,0.95)'; c.lineWidth=2;
    c.beginPath(); c.moveTo(X(planeStart.x),Z(planeStart.z)); c.lineTo(X(planeStart.x+planeDir.x*PLANE_LEN),Z(planeStart.z+planeDir.z*PLANE_LEN)); c.stroke(); c.restore();
    c.save(); c.translate(X(planePos.x),Z(planePos.z)); c.rotate(Math.atan2(planeDir.x,-planeDir.z)); c.fillStyle='#ffffff';
    c.beginPath(); c.moveTo(0,-9); c.lineTo(7,8); c.lineTo(0,4); c.lineTo(-7,8); c.closePath(); c.fill(); c.restore();
  }
  {
    const nowT=performance.now();
    for(let i=0;i<gunshots.length;i++){
      const g=gunshots[i], age=nowT-g.t; if(age>6000) continue;
      const dd=Math.hypot(g.x-player.position.x,g.z-player.position.z); if(dd>420) continue;
      const clarity=Math.max(0.1,1-dd/380), fade=1-age/6000, gx=X(g.x), gz=Z(g.z), r=3+(1-clarity)*5, col=g.mate?'#7fc4ff':'#ffd34d';
      c.save(); c.globalAlpha=Math.min(1,clarity*fade*1.1); c.shadowColor=col; c.shadowBlur=(1-clarity)*14;
      c.strokeStyle=col; c.fillStyle=col; c.lineWidth=1.6;
      c.beginPath(); c.arc(gx,gz,r+age/6000*6,0,6.283); c.stroke();
      c.beginPath(); c.arc(gx,gz,1.8,0,6.283); c.fill();
      for(let k=0;k<4;k++){ const an=k*Math.PI/2+Math.PI/4; c.beginPath(); c.moveTo(gx+Math.cos(an)*(r*0.5),gz+Math.sin(an)*(r*0.5)); c.lineTo(gx+Math.cos(an)*(r+3),gz+Math.sin(an)*(r+3)); c.stroke(); }
      c.restore();
    }
  }
  c.fillStyle='#ffb300'; vehicles.forEach(v=>{ c.fillRect(X(v.mesh.position.x)-2.5,Z(v.mesh.position.z)-2.5,5,5); });
  squads[0].members.forEach(m=>{ if(!m.alive) return; c.fillStyle=m.down?'#e53935':'#4aa8ff'; c.beginPath(); c.arc(X(m.mesh.position.x),Z(m.mesh.position.z),4,0,6.283); c.fill(); c.strokeStyle='#000'; c.lineWidth=1; c.stroke(); });
  c.save(); c.translate(X(player.position.x),Z(player.position.z)); c.rotate(-yaw);
  c.fillStyle='#ffd34d'; c.strokeStyle='#000'; c.lineWidth=1; c.beginPath(); c.moveTo(0,-8); c.lineTo(6,7); c.lineTo(-6,7); c.closePath(); c.fill(); c.stroke(); c.restore();
}
function drawMinimap(){
  if(!mapStatic) return;
  const size=mm.width, range=260, px=player.position.x, pz=player.position.z;
  mctx.clearRect(0,0,size,size);
  const k=MAPPX/(2*MAP_R), sw=2*range*k;
  mctx.drawImage(mapStatic,(px+MAP_R-range)*k,(pz+MAP_R-range)*k,sw,sw,0,0,size,size);
  mapOverlay(mctx,size,px,pz,range);
}
function drawBigMap(){
  if(!mapStatic||!bigOpen) return;
  const size=bigc.width;
  bctx.clearRect(0,0,size,size); bctx.drawImage(mapStatic,0,0,size,size);
  mapOverlay(bctx,size,0,0,MAP_R);
}
function toggleBigMap(){
  bigOpen=!bigOpen; document.getElementById('bigmap').style.display=bigOpen?'flex':'none';
  if(bigOpen) drawBigMap();
}

