// ===================== teksturalar =====================
function makeDetailTex(){
  const c=document.createElement('canvas'); c.width=c.height=512; const x=c.getContext('2d');
  x.fillStyle='#e4e4e4'; x.fillRect(0,0,512,512);
  for(let i=0;i<11000;i++){ const v=190+Math.floor(Math.random()*65); x.fillStyle='rgba('+v+','+v+','+v+','+(0.18+Math.random()*0.3)+')'; x.fillRect(Math.random()*512,Math.random()*512,1+Math.random()*3,1+Math.random()*4); }
  for(let i=0;i<240;i++){ x.fillStyle='rgba(120,110,90,0.10)'; x.beginPath(); x.arc(Math.random()*512,Math.random()*512,2+Math.random()*8,0,6.283); x.fill(); }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(180,180); t.anisotropy=8; return t;
}
function makePlasterTex(base){
  const c=document.createElement('canvas'); c.width=c.height=256; const x=c.getContext('2d');
  x.fillStyle=base; x.fillRect(0,0,256,256);
  for(let i=0;i<1800;i++){ const a=Math.random()*0.10; x.fillStyle=(Math.random()<0.5?'rgba(0,0,0,'+a+')':'rgba(255,255,255,'+a+')'); x.fillRect(Math.random()*256,Math.random()*256,2+Math.random()*5,2+Math.random()*5); }
  x.strokeStyle='rgba(0,0,0,0.13)'; x.lineWidth=1;
  for(let y=0;y<256;y+=16){ x.beginPath(); x.moveTo(0,y); x.lineTo(256,y); x.stroke(); for(let xx=((y/16)%2)*16; xx<256; xx+=32){ x.beginPath(); x.moveTo(xx,y); x.lineTo(xx,y+16); x.stroke(); } }
  const g=x.createLinearGradient(0,256,0,170); g.addColorStop(0,'rgba(40,30,20,.35)'); g.addColorStop(1,'rgba(40,30,20,0)'); x.fillStyle=g; x.fillRect(0,170,256,86);
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=8; return t;
}
function makeWoodTex(){
  const c=document.createElement('canvas'); c.width=c.height=128; const x=c.getContext('2d');
  x.fillStyle='#8a6a45'; x.fillRect(0,0,128,128);
  for(let i=0;i<8;i++){ x.fillStyle='rgba(0,0,0,'+(0.06+Math.random()*0.1)+')'; x.fillRect(0,i*16,128,2); }
  for(let i=0;i<400;i++){ x.fillStyle='rgba(60,40,20,0.12)'; x.fillRect(Math.random()*128,Math.random()*128,1+Math.random()*10,1); }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; return t;
}
function makeCrateTex(){
  const c=document.createElement('canvas'); c.width=c.height=128; const x=c.getContext('2d');
  x.fillStyle='#8a5a2b'; x.fillRect(0,0,128,128);
  for(let i=0;i<5;i++){ x.fillStyle='rgba(0,0,0,0.18)'; x.fillRect(0,i*26+24,128,2); }
  x.strokeStyle='#4a2f14'; x.lineWidth=8; x.strokeRect(4,4,120,120);
  x.strokeStyle='rgba(60,35,15,0.9)'; x.lineWidth=6; x.beginPath(); x.moveTo(8,8); x.lineTo(120,120); x.moveTo(120,8); x.lineTo(8,120); x.stroke();
  return new THREE.CanvasTexture(c);
}
function makeRoadTex(){
  const c=document.createElement('canvas'); c.width=128; c.height=256; const x=c.getContext('2d');
  x.fillStyle='#4b4b4e'; x.fillRect(0,0,128,256);
  for(let i=0;i<2600;i++){ const v=50+Math.floor(Math.random()*40); x.fillStyle='rgba('+v+','+v+','+v+',0.5)'; x.fillRect(Math.random()*128,Math.random()*256,1+Math.random()*2,1+Math.random()*2); }
  x.fillStyle='rgba(235,235,235,0.85)'; x.fillRect(8,0,4,256); x.fillRect(116,0,4,256);
  x.fillStyle='rgba(240,200,60,0.9)'; for(let y=8;y<256;y+=64) x.fillRect(62,y,4,32);
  const t=new THREE.CanvasTexture(c); t.wrapT=THREE.RepeatWrapping; t.anisotropy=8; return t;
}
function makeRippleTex(){
  const c=document.createElement('canvas'); c.width=c.height=256; const x=c.getContext('2d');
  x.fillStyle='#ffffff'; x.fillRect(0,0,256,256);
  for(let i=0;i<140;i++){ x.strokeStyle='rgba(120,170,200,'+(0.08+Math.random()*0.12)+')'; x.lineWidth=1+Math.random()*2; x.beginPath(); const px=Math.random()*256, py=Math.random()*256; x.arc(px,py,4+Math.random()*16,0,Math.PI*(0.6+Math.random()*0.9)); x.stroke(); }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(500,500); return t;
}

