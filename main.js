import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

let scene, camera, renderer, clock;
let mixer, actions = {}, activeAction;
let player, marsTerrain;

let isJumping = false; 
let velocity = new THREE.Vector3(); 

init();
animate();

function init() {

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xdfa66f);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 5, 10);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  clock = new THREE.Clock();


  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(10, 10, 10);
  scene.add(directionalLight);


  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.25;
  controls.screenSpacePanning = false; 
  controls.maxPolarAngle = Math.PI / 2;
  controls.update();

  const terrainLoader = new FBXLoader();
  terrainLoader.load('assets/Mars.fbx', (fbx) => {
    marsTerrain = fbx;
    marsTerrain.scale.set(0.01, 0.01, 0.01);
    marsTerrain.position.set(0, 0, 0);
    scene.add(marsTerrain);
  });

  const loader = new FBXLoader();
  loader.load('assets/AstroIdle.fbx', (fbx) => {
    player = fbx;
    mixer = new THREE.AnimationMixer(player);

    loadAnimation('assets/AstroWalking.fbx', 'walk');
    loadAnimation('assets/AstroJump.fbx', 'jump');
    loadAnimation('assets/AstroBackwards.fbx', 'backwards');
    loadAnimation('assets/AstroIdle.fbx', 'idle', true);

    player.scale.set(0.002, 0.002, 0.002);
    player.position.set(0, 5, 0);
    scene.add(player);
  });

  window.addEventListener('resize', onWindowResize);

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
}

function loadAnimation(path, name, setActive = false) {
  const loader = new FBXLoader();
  loader.load(path, (fbx) => {
    const clip = fbx.animations[0];
    const action = mixer.clipAction(clip);
    actions[name] = action;

    console.log(`Animation ${name} loaded successfully`);

    if (setActive) {
      activeAction = action;
      activeAction.play();
    }
  });
}

function onKeyDown(event) {
    if (!player || !actions) return;
  
    const speed = 0.005;
    const rotationSpeed = 0.07;
  
    switch (event.key) {
      case 'w': 
        velocity.z = -speed;
        switchAction('walk');
        break;
      case 's': 
        velocity.z = speed; 
        switchAction('backwards');
        break;
      case 'a': 
        player.rotation.y += rotationSpeed; 
        break;
      case 'd':
        player.rotation.y -= rotationSpeed;
        break;
      case ' ':
        if (!isJumping) {
          isJumping = true;
          velocity.y = 0.3;
          switchAction('jump');
        }
        break;
    }
  }
  
  function onKeyUp(event) {
    if (!player || !actions) return;
  
    switch (event.key) {
      case 'w':
      case 's':
        velocity.z = 0; 
        break;
      case 'a':
      case 'd':
        break;
      case ' ':
        isJumping = false;
        velocity.y = 0;
        break;
    }
  
    if (velocity.x === 0 && velocity.z === 0) {
      switchAction('idle');
    }
  }
  

function switchAction(name) {
  if (!actions[name]) return;

  if (name === 'jump') {
    if (activeAction) activeAction.fadeOut(0.3);
    activeAction = actions[name];
    activeAction.reset().fadeIn(0.3).play();

    activeAction.clampWhenFinished = true; 
    activeAction.loop = THREE.LoopOnce;

    activeAction.addEventListener('finished', () => {
      if (!isJumping) {
        switchAction('idle');
      }
    });
  } else {
    if (activeAction !== actions[name]) {
      if (activeAction) activeAction.fadeOut(0.3);
      activeAction = actions[name];
      activeAction.reset().fadeIn(0.3).play();
    }
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
  
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
  
    if (player) {
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quaternion);
      forward.y = 0; 
      forward.normalize();
  
      player.position.add(forward.multiplyScalar(velocity.z));
  
      if (marsTerrain) {
        const raycaster = new THREE.Raycaster(
          new THREE.Vector3(player.position.x, player.position.y + 5, player.position.z),
          new THREE.Vector3(0, -1, 0)
        );
        const intersects = raycaster.intersectObject(marsTerrain, true);
        if (intersects.length > 0) {
          player.position.y = intersects[0].point.y;
        } else {
          player.position.y -= delta * 2;
        }
      }
    }
  
    renderer.render(scene, camera);
  }
