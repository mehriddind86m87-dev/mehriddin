function buildCharacter(shirtColor, pantsColor){
  const g = new THREE.Group();
  const skin = 0xe8b98a;
  const shirtM=new THREE.MeshStandardMaterial({color:shirtColor, roughness:.75}), pantsM=new THREE.MeshStandardMaterial({color:pantsColor, roughness:.85});
  const skinM=new THREE.MeshStandardMaterial({color:skin, roughness:.6}), bootM=new THREE.MeshStandardMaterial({color:0x1a1a1a, roughness:.8});
  const M=(geo,mat,x,y,z)=>{ const m=new THREE.Mesh(geo,mat); m.position.set(x||0,y||0,z||0); m.castShadow=true; return m; };
  // Gavda: son bo'g'imidan yuqori qism alohida guruh (egilish, cho'kkalash uchun)
  const hips=new THREE.Group(); hips.position.y=0.86; g.add(hips);
  const upper=new THREE.Group(); hips.add(upper);
  const pelvis=M(new THREE.CylinderGeometry(0.34,0.28,0.32,12),pantsM,0,-0.05,0); hips.add(pelvis);
  const torso=M(new THREE.CylinderGeometry(0.4,0.32,0.8,14),shirtM,0,0.48,0); upper.add(torso);
  const vest=M(new THREE.CylinderGeometry(0.44,0.37,0.5,14),new THREE.MeshStandardMaterial({color:0x33402c, roughness:.9}),0,0.62,0); upper.add(vest);
  const neck=new THREE.Group(); neck.position.y=0.92; upper.add(neck);
  const headM=M(new THREE.SphereGeometry(0.27,16,16),skinM,0,0.22,0); neck.add(headM); headM.userData.isHead=true;
  const helmet=M(new THREE.SphereGeometry(0.31,14,10,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({color:0x3d4a30, roughness:.7, metalness:.2}),0,0.24,0); helmet.userData.isHead=true; neck.add(helmet);
  const visor=M(new THREE.BoxGeometry(0.34,0.08,0.08),new THREE.MeshStandardMaterial({color:0x111111,roughness:.3}),0,0.22,0.25); neck.add(visor);
  const pack=M(new THREE.BoxGeometry(0.44,0.55,0.22),new THREE.MeshStandardMaterial({color:0x4a4a36, roughness:.9}),0,0.5,-0.32); upper.add(pack);
  // oyoqlar: son + tizza
  function leg(x){
    const hip=new THREE.Group(); hip.position.set(x,-0.04,0); g.add(hip); hip.position.y+=0.86;
    hip.add(M(new THREE.CylinderGeometry(0.15,0.12,0.44,10),pantsM,0,-0.22,0));
    const knee=new THREE.Group(); knee.position.y=-0.44; hip.add(knee);
    knee.add(M(new THREE.CylinderGeometry(0.12,0.1,0.4,10),pantsM,0,-0.2,0));
    knee.add(M(new THREE.BoxGeometry(0.2,0.12,0.32),bootM,0,-0.4,0.06));
    return {hip,knee};
  }
  function arm(x,tz){
    const sh=new THREE.Group(); sh.position.set(x,0.84,0); upper.add(sh);
    const um=M(new THREE.CylinderGeometry(0.1,0.09,0.36,10),shirtM,0,-0.18,0); sh.add(um); sh.rotation.z=tz;
    const el=new THREE.Group(); el.position.y=-0.36; sh.add(el);
    el.add(M(new THREE.CylinderGeometry(0.09,0.08,0.34,10),shirtM,0,-0.17,0));
    el.add(M(new THREE.SphereGeometry(0.085,8,8),skinM,0,-0.37,0));
    return {sh,el};
  }
  const L=leg(-0.17), R=leg(0.17), AL=arm(-0.52,0.12), AR=arm(0.52,-0.12);
  return {group:g, head:headM, torso, hips, upper, neck, legL:L.hip, legR:R.hip, kneeL:L.knee, kneeR:R.knee, armL:AL.sh, armR:AR.sh, elbowL:AL.el, elbowR:AR.el};
}
// Poza: barcha bo'g'imlarni silliq maqsad qiymatga olib boradi
const POSE_KEYS=['legL','legR','kneeL','kneeR','armL','armR','elbowL','elbowR','upper','neck'];
function applyPose(c,P,k){
  for(const key of POSE_KEYS){ const t=P[key]||0; c[key].rotation.x+=(t-c[key].rotation.x)*k; }
  const hy=0.86+(P.drop||0); c.hips.position.y+=(hy-c.hips.position.y)*k;
  c.legL.position.y=c.hips.position.y-0.04; c.legR.position.y=c.hips.position.y-0.04;
  const zr=P.armZ||0; c.armL.rotation.z+=((0.12+zr)-c.armL.rotation.z)*k; c.armR.rotation.z+=((-0.12-zr*0.6)-c.armR.rotation.z)*k;
}
function poseWalk(ph,amt,aim){
  const s=Math.sin(ph)*amt, kn=Math.max(0,Math.sin(ph+1.2))*amt*1.3, kn2=Math.max(0,-Math.sin(ph+1.2))*amt*1.3;
  const P={legL:-s,legR:s,kneeL:0.08+kn,kneeR:0.08+kn2,upper:0.05+amt*0.15,drop:-Math.abs(Math.sin(ph))*amt*0.06};
  if(aim){ P.armR=-1.35; P.elbowR=-0.25; P.armL=-1.2; P.elbowL=-0.55; P.armZ=-0.35; }
  else { P.armL=s*0.7; P.armR=-s*0.7; P.elbowL=-0.25; P.elbowR=-0.25; }
  return P;
}
const POSE_KNOCK={legL:-0.15,legR:-0.05,kneeL:1.65,kneeR:1.75,drop:-0.36,upper:0.75,neck:-0.25,armL:-0.85,elbowL:-0.25,armR:-0.35,elbowR:-1.9,armZ:0.15};
const POSE_REVIVER={legL:-1.45,legR:0.15,kneeL:1.5,kneeR:1.85,drop:-0.38,upper:0.45,neck:0.25,armL:-1.15,elbowL:-0.35,armR:-1.35,elbowR:-0.15,armZ:-0.2};
const POSE_HEAL={legL:-0.6,legR:0.2,kneeL:0.9,kneeR:1.0,drop:-0.2,upper:0.25,neck:0.35,armL:-0.9,elbowL:-1.5,armR:-0.7,elbowR:-1.7,armZ:-0.25};
const POSE_CROUCH_AIM={legL:-0.9,legR:0.25,kneeL:1.5,kneeR:1.4,drop:-0.32,upper:0.2,armR:-1.4,elbowR:-0.25,armL:-1.25,elbowL:-0.55,armZ:-0.35};
const POSE_DEAD={legL:0,legR:0,kneeL:0.1,kneeR:0.3,upper:0,neck:0.3,armL:-2.6,armR:-0.4,elbowL:-0.3,elbowR:-0.2};
function lerpPose(A,B,t){ const r={}; for(const k of POSE_KEYS.concat(['drop','armZ'])) r[k]=(A[k]||0)+((B[k]||0)-(A[k]||0))*t; return r; }

// Sizning o'yinchingiz
const pc=buildCharacter(0x2255aa,0x243044);
const player=pc.group;
const body=pc.torso, head=pc.head;
player.position.set(0,0,10); scene.add(player);

