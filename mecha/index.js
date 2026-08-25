import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"; // loader for 3D models  

/* =========================================================
   IRON WALKER — S.P.A. ThreeJS mech MVP (Armored Core style)
   ========================================================= */

// ---------- Renderer / Scene / Camera ----------
const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1016);
scene.fog = new THREE.Fog(0x0b1016, 60, 260);

const camera = new THREE.PerspectiveCamera(
  62,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- Lighting ----------
scene.add(new THREE.HemisphereLight(0x8fb8ff, 0x1a1410, 0.9));
const sun = new THREE.DirectionalLight(0xfff1d8, 1.2);
sun.position.set(60, 90, 30);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -120;
sun.shadow.camera.right = 120;
sun.shadow.camera.top = 120;
sun.shadow.camera.bottom = -120;
scene.add(sun);

// --------- Loading models --------
const loader = new GLTFLoader();
loader.load("assets/PlayerMech.obj.glb", (gltf) => {
  const model = gltf.scene;

  // make sure it casts/receives shadows and uses lit materials
  model.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
      // need to find out which layer of model to remove, it came with a 'base-plate'
      const box = new THREE.Box3().setFromObject(obj);
      const size = box.getSize(new THREE.Vector3());
      console.log(obj.name, size); // find the flat, wide one — that's your "pizza box"
    }
  });
  // strip out the baked-in ground/shadow plane that came with the export
  const junk = model.getObjectByName("pCube16"); // swap in the real name from the log
  if (junk) junk.visible = false;

  // model was facing 90° right of where it should — rotate left to correct
  /* since "left" vs "right" can be confusing with Y rotation:
  Math.PI / 2 (positive) rotates counter-clockwise when viewed from above → turns the model's facing to the left
  -Math.PI / 2 (negative) rotates clockwise from above → turns the model's facing to the right */
  model.rotation.y = -Math.PI / 2;

  // scaling down the model size
  model.scale.setScalar(0.25);

  mech.add(model); // drop it into the existing mech group
});

// ---------- Ground ----------
const groundGeo = new THREE.PlaneGeometry(600, 600, 60, 60);
const groundMat = new THREE.MeshStandardMaterial({
  color: 0x1e2630,
  roughness: 0.95,
  metalness: 0.05,
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const grid = new THREE.GridHelper(600, 60, 0x2f7c8f, 0x1a2530);
grid.position.y = 0.02;
scene.add(grid);

// ---------- Arena props (buildings / obstacles) ----------
const propMat = new THREE.MeshStandardMaterial({ color: 0x2a3440, roughness: 0.8 });
const props = [];
function addBuilding(x, z, w, h, d) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geo, propMat);
  mesh.position.set(x, h / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  props.push(mesh);
}
for (let i = 0; i < 14; i++) {
  const ang = (i / 14) * Math.PI * 2;
  const r = 40 + (i % 3) * 20;
  addBuilding(
    Math.cos(ang) * r,
    Math.sin(ang) * r,
    4 + Math.random() * 6,
    8 + Math.random() * 20,
    4 + Math.random() * 6
  );
}

// ---------- Target dummies (proves the weapon works) ----------
const targets = [];
function spawnTarget(x, z) {
  const g = new THREE.Group();
  const bodyGeo = new THREE.BoxGeometry(2, 3, 2);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xff5d3a,
    emissive: 0x220800,
    roughness: 0.5,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 1.5;
  body.castShadow = true;
  g.add(body);
  g.position.set(x, 0, z);
  g.userData = { hp: 3, maxHp: 3, mat: bodyMat, alive: true };
  scene.add(g);
  targets.push(g);
}
spawnTarget(10, -14);
spawnTarget(-16, -8);
spawnTarget(4, -26);
spawnTarget(-8, -30);
spawnTarget(20, -22);

function respawnTarget(t) {
  t.userData.hp = t.userData.maxHp;
  t.userData.alive = true;
  t.visible = true;
  t.userData.mat.emissive.setHex(0x220800);
  t.userData.mat.color.setHex(0xff5d3a);
}

// =========================================================
// MECH — player rig
// =========================================================
const mech = new THREE.Group();
mech.position.set(0, 0, 20);
scene.add(mech);

const mechMat = new THREE.MeshStandardMaterial({ color: 0x8fa3ad, metalness: 0.6, roughness: 0.35 });
const accentMat = new THREE.MeshStandardMaterial({ color: 0x2ad1ff, emissive: 0x0b3a44, metalness: 0.2, roughness: 0.4 });

// legs
// const legGeo = new THREE.BoxGeometry(0.6, 1.6, 0.6);
// [-0.6, 0.6].forEach((x) => {
//   const leg = new THREE.Mesh(legGeo, mechMat);
//   leg.position.set(x, 0.8, 0);
//   leg.castShadow = true;
//   mech.add(leg);
// });

// torso
// const torso = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 1.2), mechMat);
// torso.position.y = 2.2;
// torso.castShadow = true;
// mech.add(torso);

// head visor
// const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.5), accentMat);
// head.position.set(0, 3, 0.2);
// mech.add(head);

// shoulder boosters (visual thruster glow)
const boosterGeo = new THREE.CylinderGeometry(0.25, 0.35, 0.8, 12);
const boosterMat = new THREE.MeshStandardMaterial({ color: 0x11181c, metalness: 0.7, roughness: 0.3 });
const thrusterGlowMat = new THREE.MeshBasicMaterial({ color: 0x2ad1ff, transparent: true, opacity: 0.85 });
const thrusters = [];
[-0.9, 0.9].forEach((x) => {
  const b = new THREE.Mesh(boosterGeo, boosterMat);
  b.rotation.x = Math.PI / 2;
  b.position.set(x, 2.1, -0.9);
  mech.add(b);
  const glow = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.6, 10), thrusterGlowMat);
  glow.rotation.x = -Math.PI / 2;
  glow.position.set(x, 2.1, -1.35);
  glow.scale.set(2, 0.011, 2); /* default was 1, 0.001, 1*/
  mech.add(glow);
  thrusters.push(glow);
});

// gun (mounted right side, aims with pitch)
const gunPivot = new THREE.Group();
gunPivot.position.set(0.95, 2.3, 0.3);
mech.add(gunPivot);
const gunMesh = new THREE.Mesh(
  new THREE.BoxGeometry(0.25, 0.25, 1.4),
  new THREE.MeshStandardMaterial({ color: 0x2a2f33, metalness: 0.7, roughness: 0.3 })
);
gunMesh.position.z = 0.7;
gunPivot.add(gunMesh);
const muzzle = new THREE.Object3D();
muzzle.position.set(0, 0, 1.4);
gunPivot.add(muzzle);

// ---------- Camera rig (third person, smooth follow) ----------
const camPivot = new THREE.Object3D(); // orbits with yaw+pitch around mech
camPivot.position.copy(mech.position);
scene.add(camPivot);

let yaw = 0; // mech facing (rotates mech body)
let pitch = -0.12; // camera pitch, clamped
const PITCH_MIN = -1.1;
const PITCH_MAX = 0.6;

const camOffset = new THREE.Vector3(0, 3.2, -9.5); // behind & above, local space, default z was -7.5
const camLookOffset = new THREE.Vector3(0, 2.4, 4); // look ahead point
const desiredCamPos = new THREE.Vector3();
const desiredLookAt = new THREE.Vector3();

// =========================================================
// INPUT
// =========================================================
const keys = new Set();
let pointerLocked = false;
let mouseDX = 0,
  mouseDY = 0;

const startScreen = document.getElementById("start-screen");
const startBtn = document.getElementById("start-btn");

startBtn.addEventListener("click", () => {
  canvas.requestPointerLock();
});

document.addEventListener("pointerlockchange", () => {
  pointerLocked = document.pointerLockElement === canvas;
  startScreen.classList.toggle("hidden", pointerLocked);
});

document.addEventListener("mousemove", (e) => {
  if (!pointerLocked) return;
  mouseDX += e.movementX;
  mouseDY -= e.movementY;
});

window.addEventListener("keydown", (e) => {
  keys.add(e.code);
  if (e.code === "Escape") document.exitPointerLock();
});
window.addEventListener("keyup", (e) => keys.delete(e.code));

let firing = false;
document.addEventListener("mousedown", (e) => {
  if (!pointerLocked) return;
  if (e.button === 0) firing = true;
});
document.addEventListener("mouseup", (e) => {
  if (e.button === 0) firing = false;
});

// =========================================================
// GAME STATE
// =========================================================
const state = {
  velocity: new THREE.Vector3(),
  vy: 0,
  boost: 100, // 0-100
  boosting: false,
  boostLocked: false,
  heat: 0, // weapon heat 0-100
  overheated: false,
  fireCooldown: 0,
  ap: 100,
};

const MOVE_SPEED = 12;
const BOOST_MULT = 4.8;
const BOOST_ASCEND = 19;
const GRAVITY = 25;
const BOOST_DRAIN = 36; // per second while boosting
const BOOST_REGEN = 30; // per second while not boosting
const FIRE_RATE = 0.12; // seconds between shots
const HEAT_PER_SHOT = 6;
const HEAT_COOL = 26; // per second

// tracers & impacts pool
const tracers = [];
const impacts = [];
const raycaster = new THREE.Raycaster();

function fireWeapon() {
  if (state.overheated || state.fireCooldown > 0) return;
  state.fireCooldown = FIRE_RATE;
  state.heat = Math.min(100, state.heat + HEAT_PER_SHOT);
  if (state.heat >= 100) state.overheated = true;

  const origin = new THREE.Vector3();
  muzzle.getWorldPosition(origin);

  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);

  raycaster.set(origin, dir);
  raycaster.far = 200;
  const hits = raycaster.intersectObjects(
    targets.filter((t) => t.userData.alive).map((t) => t.children[0]),
    false
  );

  let endPoint = origin.clone().add(dir.clone().multiplyScalar(120));
  if (hits.length > 0) {
    endPoint = hits[0].point;
    const targetGroup = hits[0].object.parent;
    damageTarget(targetGroup);
    showHitmarker();
    spawnImpact(endPoint);
  }

  spawnTracer(origin, endPoint);
}

function damageTarget(t) {
  if (!t.userData.alive) return;
  t.userData.hp -= 1;
  const ratio = t.userData.hp / t.userData.maxHp;
  t.userData.mat.emissive.setHex(0x220800);
  t.userData.mat.color.setRGB(1, 0.36 * ratio + 0.1, 0.23 * ratio);
  if (t.userData.hp <= 0) {
    t.userData.alive = false;
    t.visible = false;
    setTimeout(() => respawnTarget(t), 2500);
  }
}

function spawnTracer(from, to) {
  const geo = new THREE.BufferGeometry().setFromPoints([from, to]);
  const mat = new THREE.LineBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.9 });
  const line = new THREE.Line(geo, mat);
  scene.add(line);
  tracers.push({ line, life: 0.08 });
}

const hitmarkerEl = document.getElementById("hitmarker");
let hitmarkerTimeout;
function showHitmarker() {
  hitmarkerEl.classList.remove("show");
  void hitmarkerEl.offsetWidth;
  hitmarkerEl.classList.add("show");
}

function spawnImpact(point) {
  const geo = new THREE.SphereGeometry(0.15, 8, 8);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffcf6b, transparent: true, opacity: 1 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(point);
  scene.add(mesh);
  impacts.push({ mesh, life: 0.3, maxLife: 0.3 });
}

// =========================================================
// UPDATE LOOP
// =========================================================
const clock = new THREE.Clock();
const forward = new THREE.Vector3();
const right = new THREE.Vector3();

function update(dt) {
  // ---- mouse look ----
  if (pointerLocked) {
    const sens = 0.0022;
    yaw -= mouseDX * sens;
    pitch -= mouseDY * sens;
    pitch = Math.max(PITCH_MIN, Math.min(PITCH_MAX, pitch));
  }
  mouseDX = 0;
  mouseDY = 0;

  mech.rotation.y = yaw;
  gunPivot.rotation.x = pitch * 0.9;

  // ---- movement input ----
  forward.set(Math.sin(yaw), 0, Math.cos(yaw));
  right.set(Math.cos(yaw), 0, -Math.sin(yaw));

  let moveX = 0,
    moveZ = 0;
  if (keys.has("KeyW")) moveZ += 1;
  if (keys.has("KeyS")) moveZ -= 1;
  if (keys.has("KeyD")) moveX -= 1;
  if (keys.has("KeyA")) moveX += 1;

  const wantsBoost = keys.has("ShiftLeft") || keys.has("ShiftRight");
  const wantsAscend = keys.has("Space");
  const wantsDescend = keys.has("KeyC");

  // hysteresis: lock out boosting once empty, don't re-allow until partially recharged
  if (state.boost <= 0) state.boostLocked = true;
  if (state.boost >= 30) state.boostLocked = false;

  state.boosting = (wantsBoost || wantsAscend) && state.boost > 0 && !state.boostLocked; /* had to introduce Hysteresis to create a 'Boost-Lock'*/
  const speedMult = state.boosting ? BOOST_MULT : 1;

  const moveVec = new THREE.Vector3();
  moveVec.addScaledVector(forward, moveZ);
  moveVec.addScaledVector(right, moveX);
  if (moveVec.lengthSq() > 0) moveVec.normalize();

  const targetVel = moveVec.multiplyScalar(MOVE_SPEED * speedMult);
  state.velocity.lerp(targetVel, 1 - Math.pow(0.0001, dt)); // smooth accel

  mech.position.x += state.velocity.x * dt;
  mech.position.z += state.velocity.z * dt;

  // ---- vertical / flight ----
  if (state.boosting && wantsAscend) {
    state.vy = THREE.MathUtils.lerp(state.vy, BOOST_ASCEND, 1 - Math.pow(0.0005, dt));
  } else if (wantsDescend) {
    state.vy = THREE.MathUtils.lerp(state.vy, -BOOST_ASCEND * 0.7, 1 - Math.pow(0.0005, dt));
  } else {
    state.vy -= GRAVITY * dt;
  }
  mech.position.y += state.vy * dt;
  if (mech.position.y <= 0) {
    mech.position.y = 0;
    state.vy = 0;
  }

  // ---- boost energy ----
  if (state.boosting) {
    state.boost = Math.max(0, state.boost - BOOST_DRAIN * dt);
  } else {
    state.boost = Math.min(100, state.boost + BOOST_REGEN * dt);
  }

  // thruster glow visual
  const glowScale = state.boosting ? 1 : 0.15;
  thrusters.forEach((g) => {
    g.scale.y = THREE.MathUtils.lerp(g.scale.y, glowScale, 0.3);
    g.material.opacity = THREE.MathUtils.lerp(g.material.opacity, state.boosting ? 0.9 : 0.25, 0.3);
  });

  // ---- weapon ----
  state.fireCooldown = Math.max(0, state.fireCooldown - dt);
  if (state.overheated) {
    state.heat = Math.max(0, state.heat - HEAT_COOL * dt * 1.4);
    if (state.heat <= 0) state.overheated = false;
  } else {
    state.heat = Math.max(0, state.heat - HEAT_COOL * dt * 0.3);
  }
  if (firing && pointerLocked) fireWeapon();

  // ---- camera follow (smooth) ----
  const camYawQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
  const pitchOffset = new THREE.Vector3(0, Math.sin(-pitch) * 4, 0);

  const rotatedOffset = camOffset.clone().applyQuaternion(camYawQuat);
  desiredCamPos.copy(mech.position).add(rotatedOffset).add(pitchOffset);
  desiredCamPos.y = Math.max(desiredCamPos.y, mech.position.y + 1.2);

  const rotatedLook = camLookOffset.clone().applyQuaternion(camYawQuat);
  desiredLookAt.copy(mech.position).add(rotatedLook);
  desiredLookAt.y += Math.sin(-pitch) * 6;

  const followLerp = 1 - Math.pow(0.0001, dt);
  camera.position.lerp(desiredCamPos, followLerp);

  const lookTarget = new THREE.Vector3();
  camPivot.position.lerp(desiredLookAt, followLerp);
  lookTarget.copy(camPivot.position);
  camera.lookAt(lookTarget);

  // ---- tracers / impacts ----
  for (let i = tracers.length - 1; i >= 0; i--) {
    const t = tracers[i];
    t.life -= dt;
    t.line.material.opacity = Math.max(0, t.life / 0.08);
    if (t.life <= 0) {
      scene.remove(t.line);
      t.line.geometry.dispose();
      t.line.material.dispose();
      tracers.splice(i, 1);
    }
  }
  for (let i = impacts.length - 1; i >= 0; i--) {
    const im = impacts[i];
    im.life -= dt;
    const k = 1 - im.life / im.maxLife;
    im.mesh.scale.setScalar(1 + k * 6);
    im.mesh.material.opacity = 1 - k;
    if (im.life <= 0) {
      scene.remove(im.mesh);
      im.mesh.geometry.dispose();
      im.mesh.material.dispose();
      impacts.splice(i, 1);
    }
  }

  // ---- HUD ----
  document.getElementById("boost-fill").style.width = state.boost + "%";
  document.getElementById("ap-fill").style.width = state.ap + "%";
  document.getElementById("heat-fill").style.width = state.heat + "%";
  document.getElementById("heat-fill").style.background = state.overheated
    ? "linear-gradient(90deg,#ff2a2a,#ff2a2a)"
    : "";
  document.getElementById("speed-val").textContent = Math.round(
    new THREE.Vector2(state.velocity.x, state.velocity.z).length() * 10
  );
  document.getElementById("alt-val").textContent = mech.position.y.toFixed(1);
}

function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);
  update(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
