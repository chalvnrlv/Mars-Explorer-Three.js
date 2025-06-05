import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

let scene, camera, renderer, clock;
let mixer, actions = {}, activeAction;
let player, marsTerrain;

let isJumping = false; 
let velocity = new THREE.Vector3(); 
let rotationVelocity = 0;
let isMobile = false;

// Camera follow variables
let cameraTargetPosition = new THREE.Vector3();
const cameraOffset = new THREE.Vector3(0, 3, -9);
const cameraSmoothness = 0.01;

// Mobile control state
const controlsState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    rotateLeft: false,
    rotateRight: false
};

// Initialize the application
init();
animate();

function init() {
    // Detect mobile device
    isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // Set up scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdfa66f);
    scene.fog = new THREE.Fog(0xdfa66f, 10, 100);

    // Set up camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);

    // Set up renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.body.appendChild(renderer.domElement);

    clock = new THREE.Clock();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false; 
    controls.maxPolarAngle = Math.PI / 2;
    controls.update();

    // Load terrain
    const terrainLoader = new FBXLoader();
    terrainLoader.load('/assets/Mars.fbx', (fbx) => {
        marsTerrain = fbx;
        marsTerrain.scale.set(0.01, 0.01, 0.01);
        marsTerrain.position.set(0, 0, 0);
        scene.add(marsTerrain);
    }, undefined, (error) => {
        console.error('Error loading terrain:', error);
    });

    // Load player character
    const loader = new FBXLoader();
    loader.load('/assets/AstroIdle.fbx', (fbx) => {
        player = fbx;
        mixer = new THREE.AnimationMixer(player);

        loadAnimation('/assets/AstroWalking.fbx', 'walk');
        loadAnimation('/assets/AstroJump.fbx', 'jump');
        loadAnimation('/assets/AstroBackwards.fbx', 'backwards');
        loadAnimation('/assets/AstroIdle.fbx', 'idle', true);

        player.scale.set(0.002, 0.002, 0.002);
        player.position.set(0, 5, 0);
        scene.add(player);
        
        // Hide loading screen once player is loaded
        document.getElementById('loading').style.display = 'none';
    }, undefined, (error) => {
        console.error('Error loading player:', error);
    });

    // Event listeners
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    
    // Setup mobile controls if on mobile
    if (isMobile) {
        setupMobileControls();
    }

    // Show loading screen immediately
    document.getElementById('loading').style.display = 'block';
    
    // Check orientation for warning
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
}

function setupMobileControls() {
    // Movement buttons
    document.querySelector('.dpad-up').addEventListener('touchstart', (e) => {
        controlsState.forward = true;
        switchAction('walk');
        e.preventDefault();
    });
    
    document.querySelector('.dpad-up').addEventListener('touchend', (e) => {
        controlsState.forward = false;
        if (!controlsState.backward) switchAction('idle');
        e.preventDefault();
    });
    
    document.querySelector('.dpad-down').addEventListener('touchstart', (e) => {
        controlsState.backward = true;
        switchAction('backwards');
        e.preventDefault();
    });
    
    document.querySelector('.dpad-down').addEventListener('touchend', (e) => {
        controlsState.backward = false;
        if (!controlsState.forward) switchAction('idle');
        e.preventDefault();
    });
    
    document.querySelector('.dpad-left').addEventListener('touchstart', (e) => {
        controlsState.left = true;
        e.preventDefault();
    });
    
    document.querySelector('.dpad-left').addEventListener('touchend', (e) => {
        controlsState.left = false;
        e.preventDefault();
    });
    
    document.querySelector('.dpad-right').addEventListener('touchstart', (e) => {
        controlsState.right = true;
        e.preventDefault();
    });
    
    document.querySelector('.dpad-right').addEventListener('touchend', (e) => {
        controlsState.right = false;
        e.preventDefault();
    });
    
    // Rotation buttons
    document.querySelector('.rotate-btn').addEventListener('touchstart', (e) => {
        controlsState.rotateRight = true;
        e.preventDefault();
    });
    
    document.querySelector('.rotate-btn').addEventListener('touchend', (e) => {
        controlsState.rotateRight = false;
        e.preventDefault();
    });
    
    // Jump button
    document.querySelector('.jump-btn').addEventListener('touchstart', (e) => {
        if (!isJumping) {
            isJumping = true;
            velocity.y = 0.3;
            switchAction('jump');
        }
        e.preventDefault();
    });
    
    // Touch joystick for camera control
    const joystick = document.getElementById('touch-joystick');
    const joystickHandle = document.getElementById('joystick-handle');
    let joystickActive = false;
    const joystickRadius = 60;
    
    joystick.style.display = 'block';
    
    joystick.addEventListener('touchstart', (e) => {
        joystickActive = true;
        e.preventDefault();
    });
    
    window.addEventListener('touchmove', (e) => {
        if (!joystickActive) return;
        
        const touch = e.touches[0];
        const rect = joystick.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const deltaX = touch.clientX - centerX;
        const deltaY = touch.clientY - centerY;
        
        // Calculate distance from center
        const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY), joystickRadius);
        const angle = Math.atan2(deltaY, deltaX);
        
        // Position handle
        const handleX = Math.cos(angle) * distance;
        const handleY = Math.sin(angle) * distance;
        joystickHandle.style.transform = `translate(calc(-50% + ${handleX}px), calc(-50% + ${handleY}px)`;
        
        // Control camera with joystick
        camera.position.x += deltaX * 0.01;
        camera.position.z += deltaY * 0.01;
    });
    
    window.addEventListener('touchend', (e) => {
        if (joystickActive) {
            joystickActive = false;
            joystickHandle.style.transform = 'translate(-50%, -50%)';
        }
    });
}

function loadAnimation(path, name, setActive = false) {
    const loader = new FBXLoader();
    loader.load(path, (fbx) => {
        const clip = fbx.animations[0];
        const action = mixer.clipAction(clip);
        actions[name] = action;

        if (setActive) {
            activeAction = action;
            activeAction.play();
        }
    }, undefined, (error) => {
        console.error(`Error loading animation ${name}:`, error);
    });
}

function onKeyDown(event) {
    if (!player || !actions) return;
    
    const speed = 0.005;
    const rotationSpeed = 0.07;
    
    switch (event.key.toLowerCase()) {
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
    
    switch (event.key.toLowerCase()) {
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
    
    // Handle mobile controls
    if (isMobile) {
        const speed = 0.005;
        const rotationSpeed = 0.05;
        
        // Movement
        velocity.z = 0;
        if (controlsState.forward) velocity.z = -speed;
        if (controlsState.backward) velocity.z = speed;
        
        // Strafing
        if (controlsState.left) {
            player.position.x -= speed * 2;
        }
        if (controlsState.right) {
            player.position.x += speed * 2;
        }
        
        // Rotation
        if (controlsState.rotateRight) {
            player.rotation.y -= rotationSpeed;
        }
    }
    
    if (player) {
        // Apply gravity
        velocity.y -= 0.02;
        
        // Move player
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quaternion);
        forward.y = 0; 
        forward.normalize();
        
        player.position.add(forward.multiplyScalar(velocity.z));
        player.position.y += velocity.y;
        
        // Collision detection with terrain
        if (marsTerrain) {
            const raycaster = new THREE.Raycaster(
                new THREE.Vector3(player.position.x, player.position.y + 1, player.position.z),
                new THREE.Vector3(0, -1, 0),
                0,
                2
            );
            
            const intersects = raycaster.intersectObject(marsTerrain, true);
            if (intersects.length > 0 && intersects[0].distance < 1.5) {
                player.position.y = intersects[0].point.y;
                velocity.y = 0;
                isJumping = false;
                
                // Return to idle if we landed from a jump
                if (activeAction?.getClip()?.name === "jump") {
                    switchAction('idle');
                }
            }
        }
        
        // Camera follow system
        const worldOffset = cameraOffset.clone().applyQuaternion(player.quaternion);
        const targetPosition = new THREE.Vector3().addVectors(player.position, worldOffset);
        
        // Smoothly move camera to target position
        camera.position.lerp(targetPosition, cameraSmoothness);
        
        // Calculate where camera should look (slightly above player)
        const lookAtTarget = new THREE.Vector3(
            player.position.x,
            player.position.y + 1.8,
            player.position.z
        );
        
        // Make camera look at the target point
        camera.lookAt(lookAtTarget);
    }
    
    renderer.render(scene, camera);
}

function checkOrientation() {
    const warning = document.getElementById('orientation-warning');
    warning.style.display = (window.innerHeight > window.innerWidth) ? 'flex' : 'none';
}