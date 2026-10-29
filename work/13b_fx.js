// ===================== EFFEKTLAR: ko'tarish (revive), davolash, jamoa chati =====================
function makePlusTex(col){
  const c=document.createElement('canvas'); c.width=c.height=64; const x=c.getContext('2d');
  const g=x.createRadialGradient(32,32,2,32,32,30); g.addColorStop(0,col); g.addColorStop(1,'rgba(0,0,0,0)');
  x.fillStyle=g; x.fillRect(0,0,64,64); x.fillStyle='#ffffff'; x.fillRect(27,14,10,36); x.fillRect(14,27,36,10);
  return new THREE.CanvasTexture(c);
}
const fxPlusMat=new THREE.SpriteMaterial({map:makePlusTex('rgba(80,255,140,0.9)'),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
const fxGlowMat=new THREE.SpriteMaterial({map:makePlusTex('rgba(120,220,255,0.8)'),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
const fxParts=[];
for(let i=0;i<120;i++){ const s=new THREE.Sprite(i%3?fxPlusMat.clone():fxGlowMat.clone()); s.visible=false; scene.add(s); fxParts.push({s,life:0,max:1,vy:0,vx:0,vz:0}); }
let fxIdx=0;
function fxSpawn(x,y,z,spread,up){
  const p=fxParts[fxIdx++%fxParts.length]; const a=Math.random()*6.283, r=Math.random()*spread;
  p.s.position.set(x+Math.cos(a)*r,y,z+Math.sin(a)*r); p.vx=Math.cos(a)*0.25; p.vz=Math.sin(a)*0.25; p.vy=up*(0.6+Math.random()*0.8);
  p.life=p.max=0.9+Math.random()*0.7; p.s.visible=true; p.s.scale.setScalar(0.18+Math.random()*0.18);
}
// ko'tarish halqasi (yerda aylanadigan yashil halqa)
const ringPool=[];
function makeRing(){
  const g=new THREE.Group();
  const base=new THREE.Mesh(new THREE.RingGeometry(0.85,1.0,48),new THREE.MeshBasicMaterial({color:0x6dffb0,transparent:true,opacity:0.35,side:THREE.DoubleSide,depthWrite:false}));
  const prog=new THREE.Mesh(new THREE.RingGeometry(1.02,1.22,48,1,0,Math.PI*2),new THREE.MeshBasicMaterial({color:0x7dffc0,transparent:true,opacity:0.85,side:THREE.DoubleSide,depthWrite:false}));
  base.rotation.x=prog.rotation.x=-Math.PI/2; g.add(base,prog);
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(0.9,0.9,2.2,24,1,true),new THREE.MeshBasicMaterial({color:0x6dffb0,transparent:true,opacity:0.12,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
  beam.position.y=1.1; g.add(beam);
  g.visible=false; scene.add(g); return {g,prog,beam,used:false,key:null,lastFrac:-1};
}
for(let i=0;i<6;i++) ringPool.push(makeRing());
let fxAcc=0;
function reviveMark(key,x,y,z,frac){
  let r=ringPool.find(q=>q.key===key)||ringPool.find(q=>!q.used&&!q.key)||ringPool.find(q=>!q.used);
  if(!r) return; r.key=key; r.used=true; r.g.visible=true; r.g.position.set(x,y+0.06,z);
  const f=Math.max(0.01,Math.min(1,frac)); if(Math.abs(f-r.lastFrac)>0.02){ r.prog.geometry.dispose(); r.prog.geometry=new THREE.RingGeometry(1.02,1.22,48,1,Math.PI/2,-f*Math.PI*2); r.lastFrac=f; }
  r.g.rotation.y+=0.03; r.beam.material.opacity=0.08+0.08*Math.sin(performance.now()*0.008);
  if(Math.random()<0.5) fxSpawn(x,y+0.3,z,0.9,1.2);
}
function healFx(x,y,z){ if(Math.random()<0.25) fxSpawn(x,y+0.8,z,0.4,0.9); }
const revHud=document.createElement('div');
revHud.style.cssText='position:fixed;left:50%;top:58%;transform:translate(-50%,-50%);width:86px;height:86px;border-radius:50%;display:none;z-index:7;pointer-events:none;';
const revTxt=document.createElement('div');
revTxt.style.cssText='position:fixed;left:50%;top:calc(58% + 56px);transform:translateX(-50%);color:#fff;font:700 14px system-ui,sans-serif;text-shadow:0 1px 3px #000;display:none;z-index:7;pointer-events:none;white-space:nowrap;';
document.body.appendChild(revHud); document.body.appendChild(revTxt);
let revHudSet=false;
function setRevHud(frac,text){
  revHudSet=true; const d=Math.round(Math.min(1,frac)*360);
  revHud.style.background='radial-gradient(circle,rgba(0,0,0,.45) 52%,transparent 54%),conic-gradient(#6dffb0 '+d+'deg,rgba(255,255,255,.18) '+d+'deg)';
  revHud.innerHTML='<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#6dffb0;font:800 26px system-ui">✚</div>';
  revHud.style.display='block'; revTxt.style.display='block'; revTxt.textContent=text;
}
function fxUpdate(dt){
  for(const p of fxParts){ if(!p.s.visible) continue; p.life-=dt; if(p.life<=0){ p.s.visible=false; continue; }
    p.s.position.x+=p.vx*dt; p.s.position.y+=p.vy*dt; p.s.position.z+=p.vz*dt; p.s.material.opacity=Math.min(1,p.life/p.max*1.5); }
  for(const r of ringPool){ if(!r.used){ r.g.visible=false; r.key=null; } r.used=false; }
  if(!revHudSet){ revHud.style.display='none'; revTxt.style.display='none'; }
  revHudSet=false;
}
// jamoa chati (sheriklar ovozli xabarlari)
const teamChat=document.createElement('div');
teamChat.style.cssText='position:fixed;left:14px;bottom:170px;max-width:340px;z-index:6;pointer-events:none;font:600 13px system-ui,sans-serif;';
document.body.appendChild(teamChat);
function teamSay(name,text){
  const row=document.createElement('div');
  row.style.cssText='background:rgba(10,30,60,.55);color:#cfe6ff;padding:4px 8px;margin-top:4px;border-left:3px solid #4aa8ff;border-radius:3px;';
  row.innerHTML='<b style="color:#7cc4ff">'+name+':</b> '+text; teamChat.appendChild(row);
  while(teamChat.children.length>5) teamChat.removeChild(teamChat.firstChild);
  setTimeout(()=>{ if(row.parentNode) row.parentNode.removeChild(row); },6000);
}
function dirName(dx,dz){ const a=Math.atan2(dx,-dz)*180/Math.PI; const n=['shimolda','shimoli-sharqda','sharqda','janubi-sharqda','janubda','janubi-g\'arbda','g\'arbda','shimoli-g\'arbda']; return n[((Math.round(a/45)%8)+8)%8]; }
