<!DOCTYPE html>
<html lang="uz">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Arena3D — Battle Royale</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/CopyShader.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/LuminosityHighPassShader.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/EffectComposer.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/RenderPass.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/ShaderPass.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/MaskPass.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/UnrealBloomPass.js"></script>
<style>
  :root{
    --hud:#e8f5e9; --accent:#ffcc00; --danger:#ff4444; --bg:#0b0f0a;
  }
  *{box-sizing:border-box; margin:0; padding:0;}
  html,body{height:100%; overflow:hidden; background:var(--bg); font-family:'Segoe UI',Arial,sans-serif; touch-action:none;}
  #c{display:block; width:100%; height:100%;}
  #hud{position:fixed; inset:0; pointer-events:none; color:var(--hud); text-shadow:0 1px 3px rgba(0,0,0,.8);
       padding-top:env(safe-area-inset-top,0px); padding-bottom:env(safe-area-inset-bottom,0px);}
  #cross{position:absolute; top:50%; left:50%; width:22px; height:22px; margin:-11px 0 0 -11px;}
  #cross:before,#cross:after{content:'';position:absolute;background:var(--accent);}
  #cross:before{left:50%;top:0;width:2px;height:100%;margin-left:-1px;}
  #cross:after{top:50%;left:0;height:2px;width:100%;margin-top:-1px;}
  #hitmarker{position:absolute; top:50%; left:50%; display:none; font-size:26px; font-weight:900;
    transform:translate(-50%,-50%) scale(1); text-shadow:0 0 6px rgba(0,0,0,.8);}
  #scope{display:none; position:absolute; inset:0;
    background:radial-gradient(circle at center, transparent 0, transparent 17%, #000 17.6%, #000 100%);}
  #scope:before{content:''; position:absolute; top:50%; left:50%; width:2px; height:22%; background:#111; margin-left:-1px; margin-top:-11%;}
  #scope:after{content:''; position:absolute; top:50%; left:50%; height:2px; width:22%; background:#111; margin-top:-1px; margin-left:-11%;}
  #topbar{position:absolute; top:16px; left:16px; right:16px; display:flex; justify-content:space-between; font-weight:700; font-size:18px;}
  #stats{position:absolute; bottom:20px; left:16px; font-size:15px; line-height:1.6; background:rgba(0,0,0,.35); padding:10px 14px; border-radius:8px;}
  #hpbar{width:160px; height:12px; background:#333; border-radius:6px; overflow:hidden; margin-top:4px;}
  #hpfill{height:100%; width:100%; background:linear-gradient(90deg,#4caf50,#8bc34a); transition:width .2s;}
  #armorbar{width:160px; height:8px; background:#2a2a3a; border-radius:5px; overflow:hidden; margin-top:4px;}
  #armorfill{height:100%; width:0%; background:linear-gradient(90deg,#4a90d9,#7ec2f2); transition:width .2s;}
  #zoneinfo{background:rgba(0,0,0,.4); padding:6px 12px; border-radius:8px; font-size:13px; height:fit-content;}
  #prompt{position:absolute; bottom:110px; left:50%; transform:translateX(-50%); font-size:16px; font-weight:700;
    background:rgba(0,0,0,.55); padding:6px 14px; border-radius:8px; display:none; white-space:nowrap;}
  #killfeed{position:absolute; top:80px; right:16px; display:flex; flex-direction:column; gap:4px; align-items:flex-end; max-width:280px;}
  .kfrow{background:rgba(0,0,0,.5); padding:4px 10px; border-radius:6px; font-size:13px; white-space:nowrap;
    animation:kffade 5s forwards;}
  @keyframes kffade{ 0%{opacity:1;} 80%{opacity:1;} 100%{opacity:0;} }
  #ammo{position:absolute; bottom:20px; right:16px; font-size:22px; font-weight:800; text-align:right;}
  #inventory{position:absolute; bottom:58px; right:16px; display:flex; gap:6px;}
  .slot{width:44px; height:44px; background:rgba(0,0,0,.4); border:2px solid rgba(255,255,255,.15); border-radius:8px;
    font-size:10px; text-align:center; line-height:1.1; padding-top:2px; opacity:.35; color:#fff;}
  .slot.owned{opacity:1;}
  .slot.active{border-color:var(--accent); box-shadow:0 0 8px var(--accent);}
  #msg{position:absolute; top:45%; left:50%; transform:translate(-50%,-50%); font-size:22px; font-weight:800; color:var(--danger); display:none;}
  #start{position:fixed; inset:0; background:rgba(5,10,5,.92); color:#fff; display:flex; flex-direction:column;
        align-items:center; justify-content:center; text-align:center; gap:14px; padding:20px; z-index:10;}
  #start h1{color:var(--accent); font-size:32px;}
  #start p{max-width:420px; line-height:1.6; font-size:14px; color:#cde; }
  #start button{background:var(--accent); border:none; padding:14px 34px; font-size:18px; font-weight:800; border-radius:8px; cursor:pointer;}
  #kills{position:absolute; top:50px; left:16px; font-size:14px; opacity:.85;}
  @media (max-width:700px){ #hud{font-size:14px;} }
  #minimap{position:absolute; left:16px; top:92px; width:170px; height:170px; border-radius:10px; border:2px solid rgba(255,255,255,.35); background:rgba(0,0,0,.35);}
  #phasehud{position:absolute; top:16%; left:50%; transform:translateX(-50%); font-size:18px; font-weight:800; background:rgba(0,0,0,.55); padding:8px 18px; border-radius:10px; display:none; text-align:center; line-height:1.5;}
  #zonefx{position:absolute; inset:0; pointer-events:none; opacity:0; transition:opacity .3s; box-shadow:inset 0 0 170px 70px rgba(40,110,255,.65);}
  #squad{position:absolute; left:16px; bottom:20px; display:flex; flex-direction:column; gap:4px; width:210px;}
  .sqrow{display:flex; align-items:center; gap:6px; background:rgba(0,0,0,.42); padding:3px 8px; border-radius:6px; font-size:12px;}
  .sqn{width:72px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:700;}
  .sqbar{flex:1; height:6px; background:#333; border-radius:3px; overflow:hidden;}
  .sqfill{height:100%; width:100%; background:#4aa8ff;}
  .sqs{width:20px; text-align:center;}
  #labels{position:absolute; inset:0; overflow:hidden;}
  .nameplate{position:absolute; transform:translate(-50%,-100%); font-size:12px; font-weight:800; color:#7fc4ff; text-shadow:0 1px 3px #000; display:none; white-space:nowrap;}
  #envtag{position:absolute; top:14px; left:50%; transform:translateX(-50%); background:rgba(0,0,0,.42); padding:4px 12px; border-radius:8px; font-size:13px; font-weight:700; white-space:nowrap;}
  #downfx{position:absolute; inset:0; pointer-events:none; opacity:0; transition:opacity .3s; box-shadow:inset 0 0 200px 80px rgba(200,0,0,.55); background:rgba(40,0,0,.18);}
  #bigmap{position:fixed; inset:0; background:rgba(0,0,0,.72); display:none; align-items:center; justify-content:center; z-index:8; pointer-events:none;}
  #bigcanvas{width:min(90vh,90vw); height:min(90vh,90vw); border:3px solid rgba(255,255,255,.5); border-radius:10px;}
  #endscreen{position:fixed; inset:0; background:rgba(5,10,5,.9); color:#fff; display:none; flex-direction:column; align-items:center; justify-content:center; gap:16px; z-index:20; text-align:center; padding:20px;}
  #endscreen h1{color:#ffcc00; font-size:30px;}
  #endscreen button{background:#ffcc00; border:none; padding:14px 34px; font-size:18px; font-weight:800; border-radius:8px; cursor:pointer;}
</style>
</head>
<body>
<canvas id="c"></canvas>
<div id="hud">
  <div id="topbar">
    <div id="statswrap">
      <div>❤️ Jon</div>
      <div id="hpbar"><div id="hpfill"></div></div>
      <div id="armorbar"><div id="armorfill"></div></div>
    </div>
    <div id="zoneinfo">🔵 Zona: <span id="zonestate">samolyotda</span></div>
  </div>
  <div id="envtag"></div>
  <div id="kills">🎯 O'ldirilgan: <span id="killcount">0</span> · 👥 Tirik: <span id="alivecount">100</span></div>
  <div id="killfeed"></div>
  <div id="labels"></div>
  <div id="prompt"></div>
  <div id="phasehud"></div>
  <canvas id="minimap" width="200" height="200"></canvas>
  <div id="zonefx"></div>
  <div id="downfx"></div>
  <div id="cross"></div>
  <div id="hitmarker">✕</div>
  <div id="scope"></div>
  <div id="squad"></div>
  <div id="ammo">🔫 <span id="weaponName">Pistol</span>: <span id="ammoCount">12</span>/<span id="ammoReserve">24</span></div>
  <div id="inventory">
    <div id="slot_pistol" class="slot owned active">1<br>🔫</div>
    <div id="slot_rifle" class="slot">2<br>🎯</div>
    <div id="slot_shotgun" class="slot">3<br>💥</div>
    <div id="slot_sniper" class="slot">4<br>🔭</div>
  </div>
  <div id="msg"></div>
</div>
<div id="bigmap"><canvas id="bigcanvas" width="720" height="720"></canvas></div>
<div id="endscreen"><h1 id="endTitle"></h1><p id="endStats"></p><button id="againBtn">QAYTA O'YNASH</button></div>
<div id="start">
  <h1>ARENA3D — BATTLE ROYALE</h1>
  <p>100 o'yinchi · 4 kishilik guruh (squad). Samolyotdan <b>SPACE</b> bilan xohlagan joyda sakrang, havoda <b>W</b> — oldinga, <b>F</b> — parashyut. Yerda: <b>WASD</b>, sichqoncha, chap tugma — otish (rifle ushlab turilsa uzluksiz), o'ng tugma — scope, <b>1-4</b> — qurol, <b>R</b> — zaryadlash, <b>E</b> — mashinaga o'tirish/tushish (4 o'rin), <b>G</b> — yiqilgan o'rtoqni ko'tarish (ushlab turing), <b>F</b> — o'lja qutisini ochish, <b>C</b> — cho'kkalash, <b>V</b> — mashinada kamera (kabina/orqa), <b>M</b> — katta xarita, <b>N</b> — chiroq.<br>Kun/tun, fasl va ob-havo har o'yinda tasodifiy. Ko'k zonadan chiqib ketmang!</p>
  <button id="playBtn">O'YINNI BOSHLASH</button>
</div>
<script>
(function(){
