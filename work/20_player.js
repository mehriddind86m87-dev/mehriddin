// ===================== O'YINCHI HARAKATI =====================
const PLAYER_SPEED=6.2, RUN_MULT=1.7, JUMP_V=6.5, GRAVITY=-16;
let bobPhase=0, promptRev='';
// birinchi shaxs: ko'tarishda cho'zilgan qo'l
const revArm=new THREE.Group();
(function(){ const sl=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.07,0.6,10),new THREE.MeshStandardMaterial({color:0x2255aa,roughness:.8})); sl.rotation.x=Math.PI/2; sl.position.z=-0.3; revArm.add(sl);
  const hand=new THREE.Mesh(new THREE.SphereGeometry(0.075,10,10),new THREE.MeshStandardMaterial({color:0xe8b98a,roughness:.6})); hand.scale.set(1,0.7,1.3); hand.position.z=-0.66; revArm.add(hand);
  const glow=new THREE.Sprite(fxPlusMat.clone()); glow.scale.setScalar(0.25); glow.position.z=-0.72; revArm.add(glow); revArm.userData.glow=glow; })();
revArm.position.set(0.18,-0.32,-0.2); revArm.visible=false; camera.add(revArm);
let crouchK=0;
function updatePlayer(dt){
  if(inVehicle){ head.visible=false; body.visible=false; player.visible=false; revArm.visible=false; gun.visible=false; promptRev=''; revProg=0; return; }
  if(parachuting){ updateAirPhase(dt); return; }
  const down=(pState==='down');
  const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw)), right=new THREE.Vector3(-Math.sin(yaw-Math.PI/2),0,-Math.cos(yaw-Math.PI/2));
  const move=new THREE.Vector3();
  const reviving=revProg>0;
  if(!reviving){ if(keys['KeyW']) move.add(forward); if(keys['KeyS']) move.sub(forward); if(keys['KeyD']) move.add(right); if(keys['KeyA']) move.sub(right); }
  const inWater=terrainBase(player.position.x,player.position.z)<-0.35 && player.position.y<0.2;
  const crouch=!!keys['KeyC'] && !down && !inWater;
  crouchK+=(((crouch||reviving)?1:0)-crouchK)*Math.min(1,dt*10);
  const running=!!keys['ShiftLeft'] && !down && !inWater && !crouch;
  let moving=false;
  const py=player.position.y;
  if(move.lengthSq()>0){
    move.normalize();
    const spd=PLAYER_SPEED*(running?RUN_MULT:1)*(down?0.22:1)*(crouch?0.5:1)*(inWater?0.5:1)*dt;
    const nx=player.position.x+move.x*spd, nz=player.position.z+move.z*spd;
    if(!collides(nx,player.position.z,0.4,py) && terrainBase(nx,player.position.z)>-5 && groundAt(nx,player.position.z,py)<py+STEP_UP) player.position.x=nx;
    if(!collides(player.position.x,nz,0.4,py) && terrainBase(player.position.x,nz)>-5 && groundAt(player.position.x,nz,py)<py+STEP_UP) player.position.z=nz;
    moving=true;
  }
  const gy=Math.max(groundAt(player.position.x,player.position.z,player.position.y),-0.95);
  if(keys['Space'] && onGround && !down && !inWater && !crouch){ velocityY=JUMP_V; onGround=false; }
  velocityY+=GRAVITY*dt; player.position.y+=velocityY*dt;
  // shift: zinapoyadan yuqoriga silliq ko'tarilish
  if(player.position.y<=gy+0.06 && velocityY<=0){ if(!onGround && velocityY<-14){ applyDamage((-velocityY-14)*4,'Yiqilish'); } player.position.y=gy; velocityY=0; onGround=true; }
  else if(onGround && player.position.y-gy<0.35 && velocityY<=0){ player.position.y=gy; velocityY=0; }
  else onGround=false;
  // shift: shiftga tegsa (bosh shiftga)
  if(velocityY>0 && collides(player.position.x,player.position.z,0.3,player.position.y+0.3)) velocityY=0;
  if(moving && onGround && !down) bobPhase+=dt*(running?14:9); else bobPhase+=dt*2;
  const bobAmt=(moving&&onGround&&!down)?(running?0.09:0.05):0.01;
  const bobY=Math.sin(bobPhase*2)*bobAmt, bobX=Math.cos(bobPhase)*bobAmt*0.5;
  recoil=Math.max(0,recoil-dt*4.5);
  gun.position.lerp(gunRestPos.clone().add(new THREE.Vector3(0,0,0.12*recoil)),0.4);
  gun.visible=!down && !reviving;
  const eye=down?0.6:(inWater?1.35:1.7-crouchK*0.62);
  player.rotation.y=yaw; camera.rotation.order='YXZ';
  camera.position.set(player.position.x+bobX,player.position.y+eye+bobY,player.position.z);
  camera.rotation.y=yaw; camera.rotation.x=pitch+recoil*0.05-(reviving?0.35:0); camera.rotation.z=0;
  head.visible=false; body.visible=false; player.visible=false;
  promptRev=''; revArm.visible=false;
  if(down){
    downHp-=dt*(playerRevFrac>0?0:1.2); if(downHp<=0){ playerDie('Qon ketish'); return; }
    promptRev=playerRevFrac>0?'':'🔻 Yiqildingiz — o\'rtoqlaringiz yordamga keladi (sudralib boring)';
    if(playerRevFrac>0){ setRevHud(playerRevFrac,(playerReviver||'O\'rtoq')+' sizni ko\'tarmoqda...'); camera.rotation.x+=Math.sin(performance.now()*0.004)*0.01; }
    if(frameN%5===0) updateHud();
  } else {
    // o'rtoqni ko'tarish (G): cho'kkalab, qo'lni cho'zib
    let near=null;
    for(const b of bots){ if(b.isMate && b.alive && b.down && Math.hypot(b.mesh.position.x-player.position.x,b.mesh.position.z-player.position.z)<2.6 && Math.abs(b.mesh.position.y-player.position.y)<1.5){ near=b; break; } }
    if(near){
      if(keys['KeyG']){
        revProg+=dt; const fr=revProg/4, np=near.mesh.position;
        near.beingRevived=fr+0.01;
        // kamerani yiqilgan o'rtoqqa qaratish
        const ty=Math.atan2(-(np.x-player.position.x),-(np.z-player.position.z)); let dy=Math.atan2(Math.sin(ty-yaw),Math.cos(ty-yaw)); yaw+=dy*Math.min(1,dt*6);
        revArm.visible=true; const pul=Math.sin(performance.now()*0.008); revArm.position.set(0.16,-0.36+pul*0.015,-0.2-fr*0.08); revArm.rotation.x=-0.25+pul*0.05; revArm.userData.glow.material.opacity=0.6+pul*0.4;
        reviveMark(near,np.x,np.y,np.z,fr); setRevHud(fr,near.name+'ni ko\'tarmoqdasiz — G ni ushlab turing');
        if(revProg>=4){ reviveBot(near); revProg=0; showMsg('✅ '+near.name+' ko\'tarildi',1400); }
      } else { revProg=0; promptRev='G — '+near.name+'ni ko\'tarish (ushlab turing)'; }
    } else revProg=0;
  }
}
