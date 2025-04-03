import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';

class FloorPlanEditor {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.controls = null;
        this.orbitControls = null;
        this.firstPersonControls = null;
        this.isFirstPersonMode = false;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.selectedObject = null;
        this.floorPlan = null;
        this.walls = [];
        this.furniture = [];
        this.isDragging = false;
        this.dragOffset = new THREE.Vector3();
        this.setupClearFurnitureButton();
        
        // Movement controls
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = false;
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.prevTime = performance.now();
        this.personHeight = 1.0;
        
        // 3D Models
        this.models = {
            bed: null,
            bed1: null,
            sofa: null,
            sofa1: null,
            bench1: null,
            dining1: null,
            dining2: null,
            dining3: null,
            table1: null,
            table2: null,
            wardrobe1: null,
            furniture1: null,
            furniture2: null,
            furniture3: null,
            furniture4: null,
            furniture5: null
        };

        // Scale settings
        this.scaleSpeed = 0.1;
        this.minScale = 0.1;
        this.maxScale = 5.0;

        // Default scales for each furniture type
        this.defaultScales = {
            bed: 1.0,
            bed1: 1.0,
            sofa: 1.0,
            sofa1: 1.0,
            bench1: 1.0,
            dining1: 1.0,
            dining2: 1.0,
            dining3: 1.0,
            table1: 1.0,
            table2: 1.0,
            wardrobe1: 1.0,
            furniture1: 1.0,
            furniture2: 1.0,
            furniture3: 1.0,
            furniture4: 1.0,
            furniture5: 1.0
        };
        
        this.init();
        this.loadModels().then(() => {
            console.log("All models loaded successfully");
        }).catch(error => {
            console.error("Error loading models:", error);
        });
        this.setupEventListeners();
    }

    setupClearFurnitureButton() {
        const clearButton = document.getElementById('clear-furniture');
        clearButton.addEventListener('click', () => {
            this.clearFurniture();
        });
    }

    clearFurniture() {
        // Remove all furniture from the scene
        this.furniture.forEach(item => {
            this.scene.remove(item);
        });

        // Clear the furniture array
        this.furniture = [];

        console.log("All furniture has been cleared from the scene.");
    }

    async loadModels() {
        const loader = new GLTFLoader();
        try {
            // Load all models
            const [
                bedGLTF,
                bed1GLTF,
                sofaGLTF,
                sofa1GLTF,
                bench1GLTF,
                dining1GLTF,
                dining2GLTF,
                dining3GLTF,
                table1GLTF,
                table2GLTF,
                wardrobe1GLTF,
                furniture1GLTF,
                furniture2GLTF,
                furniture3GLTF,
                furniture4GLTF,
                furniture5GLTF
            ] = await Promise.all([
                loader.loadAsync('./3d_models/faydra_full_bed.glb'),
                loader.loadAsync('./3d_models/bed1.glb'),
                loader.loadAsync('./3d_models/sofa_glb.glb'),
                loader.loadAsync('./3d_models/sofa1.glb'),
                loader.loadAsync('./3d_models/bench1.glb'),
                loader.loadAsync('./3d_models/dining1.glb'),
                loader.loadAsync('./3d_models/dining2.glb'),
                loader.loadAsync('./3d_models/dining3.glb'),
                loader.loadAsync('./3d_models/table1.glb'),
                loader.loadAsync('./3d_models/table2.glb'),
                loader.loadAsync('./3d_models/wardrobe1.glb'),
                loader.loadAsync('./3d_models/furniture1.glb'),
                loader.loadAsync('./3d_models/furniture2.glb'),
                loader.loadAsync('./3d_models/furniture3.glb'),
                loader.loadAsync('./3d_models/furniture4.glb'),
                loader.loadAsync('./3d_models/furniture5.glb')
            ]);

            // Store and setup each model
            this.models.bed = bedGLTF.scene;
            this.models.bed.scale.set(1, 1, 1);
            this.models.bed.userData.type = 'bed';

            this.models.bed1 = bed1GLTF.scene;
            this.models.bed1.scale.set(1, 1, 1);
            this.models.bed1.userData.type = 'bed1';

            this.models.sofa = sofaGLTF.scene;
            this.models.sofa.scale.set(1, 1, 1);
            this.models.sofa.userData.type = 'sofa';

            this.models.sofa1 = sofa1GLTF.scene;
            this.models.sofa1.scale.set(1, 1, 1);
            this.models.sofa1.userData.type = 'sofa1';

            this.models.bench1 = bench1GLTF.scene;
            this.models.bench1.scale.set(1, 1, 1);
            this.models.bench1.userData.type = 'bench1';

            this.models.dining1 = dining1GLTF.scene;
            this.models.dining1.scale.set(1, 1, 1);
            this.models.dining1.userData.type = 'dining1';

            this.models.dining2 = dining2GLTF.scene;
            this.models.dining2.scale.set(1, 1, 1);
            this.models.dining2.userData.type = 'dining2';

            this.models.dining3 = dining3GLTF.scene;
            this.models.dining3.scale.set(1, 1, 1);
            this.models.dining3.userData.type = 'dining3';

            this.models.table1 = table1GLTF.scene;
            this.models.table1.scale.set(1, 1, 1);
            this.models.table1.userData.type = 'table1';

            this.models.table2 = table2GLTF.scene;
            this.models.table2.scale.set(1, 1, 1);
            this.models.table2.userData.type = 'table2';

            this.models.wardrobe1 = wardrobe1GLTF.scene;
            this.models.wardrobe1.scale.set(1, 1, 1);
            this.models.wardrobe1.userData.type = 'wardrobe1';

            this.models.furniture1 = furniture1GLTF.scene;
            this.models.furniture1.scale.set(1, 1, 1);
            this.models.furniture1.userData.type = 'furniture1';

            this.models.furniture2 = furniture2GLTF.scene;
            this.models.furniture2.scale.set(1, 1, 1);
            this.models.furniture2.userData.type = 'furniture2';

            this.models.furniture3 = furniture3GLTF.scene;
            this.models.furniture3.scale.set(1, 1, 1);
            this.models.furniture3.userData.type = 'furniture3';

            this.models.furniture4 = furniture4GLTF.scene;
            this.models.furniture4.scale.set(1, 1, 1);
            this.models.furniture4.userData.type = 'furniture4';

            this.models.furniture5 = furniture5GLTF.scene;
            this.models.furniture5.scale.set(1, 1, 1);
            this.models.furniture5.userData.type = 'furniture5';

            // Setup shadows for all models
            Object.values(this.models).forEach(model => {
                if (model) {
                    model.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                }
            });

            console.log("Models loaded successfully:", this.models);
        } catch (error) {
            console.error('Error loading models:', error);
            throw error;
        }
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);

        this.camera.position.set(0, 10, 10);
        this.camera.lookAt(0, 0, 0);

        // Setup orbit controls (default view)
        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
        this.orbitControls.enableDamping = true;
        this.orbitControls.dampingFactor = 0.05;
        this.controls = this.orbitControls;

        // Setup first person controls (initially disabled)
        this.firstPersonControls = new PointerLockControls(this.camera, this.renderer.domElement);
        this.scene.add(this.firstPersonControls.getObject());
        this.firstPersonControls.getObject().position.y = this.personHeight;

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        const groundGeometry = new THREE.PlaneGeometry(50, 50);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            roughness: 0.7,
            metalness: 0.1
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        ground.name = 'ground';
        this.scene.add(ground);

        this.createUI();

        this.animate();
    }

    createUI() {
        const viewButton = document.createElement('button');
        viewButton.textContent = 'Enter First Person View';
        viewButton.style.position = 'absolute';
        viewButton.style.top = '60px';
        viewButton.style.right = '20px';
        viewButton.style.zIndex = '1000';
        viewButton.style.padding = '8px 16px';
        viewButton.style.backgroundColor = '#4CAF50';
        viewButton.style.color = 'white';
        viewButton.style.border = 'none';
        viewButton.style.borderRadius = '4px';
        viewButton.style.cursor = 'pointer';
        
        viewButton.addEventListener('click', () => {
            this.toggleFirstPersonMode(viewButton);
        });
        
        document.body.appendChild(viewButton);
        
        const instructions = document.createElement('div');
        instructions.style.position = 'absolute';
        instructions.style.top = '50%';
        instructions.style.left = '50%';
        instructions.style.transform = 'translate(-50%, -50%)';
        instructions.style.textAlign = 'center';
        instructions.style.backgroundColor = 'rgba(0,0,0,0.7)';
        instructions.style.color = 'white';
        instructions.style.padding = '20px';
        instructions.style.borderRadius = '5px';
        instructions.style.display = 'none';
        instructions.style.zIndex = '1001';
        instructions.innerHTML = `
            <h2>First Person Controls</h2>
            <p>Move: W, A, S, D keys or Arrow keys</p>
            <p>Look: Mouse movement</p>
            <p>Exit: ESC key</p>
            <p>Click to continue</p>
        `;
        instructions.id = 'fp-instructions';
        document.body.appendChild(instructions);
    }

    toggleFirstPersonMode(button) {
        if (this.isFirstPersonMode) {
            this.exitFirstPersonMode();
            button.textContent = 'Enter First Person View';
        } else {
            this.enterFirstPersonMode();
            button.textContent = 'Exit First Person View';
        }
    }

    enterFirstPersonMode() {
        const instructions = document.getElementById('fp-instructions');
        instructions.style.display = 'block';
        
        this.savedCameraPosition = this.camera.position.clone();
        this.savedCameraRotation = this.camera.rotation.clone();
        
        this.firstPersonControls.getObject().position.set(0, this.personHeight, 0);
        this.camera.lookAt(0, this.personHeight, -1);
        
        const startFirstPerson = () => {
            this.firstPersonControls.lock();
            instructions.style.display = 'none';
            window.removeEventListener('click', startFirstPerson);
        };
        
        window.addEventListener('click', startFirstPerson);
        
        this.orbitControls.enabled = false;
        this.controls = null;
        
        this.isFirstPersonMode = true;
    }

    exitFirstPersonMode() {
        this.firstPersonControls.unlock();
        
        this.camera.position.copy(this.savedCameraPosition);
        this.camera.rotation.copy(this.savedCameraRotation);
        
        this.orbitControls.enabled = true;
        this.controls = this.orbitControls;
        
        this.isFirstPersonMode = false;
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        this.renderer.domElement.addEventListener('mousemove', (event) => {
            if (this.isFirstPersonMode) return;
            
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            if (this.isDragging && this.selectedObject) {
                this.raycaster.setFromCamera(this.mouse, this.camera);
                const intersects = this.raycaster.intersectObject(this.scene.getObjectByName('ground'));
                
                if (intersects.length > 0) {
                    const intersectPoint = intersects[0].point;
                    const newPosition = intersectPoint.clone().add(this.dragOffset);
                    newPosition.y = this.selectedObject.position.y;
                    this.selectedObject.position.copy(newPosition);
                }
            }
        });

        this.renderer.domElement.addEventListener('mousedown', (event) => {
            if (this.isFirstPersonMode) return;
            
            this.raycaster.setFromCamera(this.mouse, this.camera);
            
            const allFurniture = this.furniture.reduce((acc, obj) => {
                obj.traverse(child => {
                    if (child.isMesh) acc.push(child);
                });
                return acc;
            }, []);
            
            const intersects = this.raycaster.intersectObjects(allFurniture, false);
            
            if (intersects.length > 0) {
                this.orbitControls.enabled = false;
                this.isDragging = true;
                
                this.selectedObject = intersects[0].object;
                while (this.selectedObject.parent && this.selectedObject.parent !== this.scene) {
                    this.selectedObject = this.selectedObject.parent;
                }
                
                const groundIntersects = this.raycaster.intersectObject(this.scene.getObjectByName('ground'));
                if (groundIntersects.length > 0) {
                    this.dragOffset.copy(this.selectedObject.position).sub(groundIntersects[0].point);
                    this.dragOffset.y = 0;
                }
                
                console.log("Selected object for dragging:", this.selectedObject);
                
            } else {
                this.selectedObject = null;
            }
        });

        this.renderer.domElement.addEventListener('mouseup', () => {
            if (this.isFirstPersonMode) return;
            
            this.orbitControls.enabled = true;
            this.isDragging = false;
            this.selectedObject = null;
        });

        document.getElementById('floorplan-input').addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        this.convertFloorPlan(img);
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

        document.querySelectorAll('.furniture-item').forEach(item => {
            item.addEventListener('dragstart', (event) => {
                event.dataTransfer.setData('text/plain', event.target.dataset.type);
                console.log("Drag started with furniture type:", event.target.dataset.type);
            });
        });

        this.renderer.domElement.addEventListener('dragover', (event) => {
            event.preventDefault();
        });

        this.renderer.domElement.addEventListener('drop', (event) => {
            if (this.isFirstPersonMode) return;
            
            event.preventDefault();
            const furnitureType = event.dataTransfer.getData('text/plain');
            console.log("Drop event with furniture type:", furnitureType);
            this.addFurniture(furnitureType, event.clientX, event.clientY);
        });

        this.firstPersonControls.addEventListener('lock', () => {
            this.setupFirstPersonControlListeners();
        });
        
        this.firstPersonControls.addEventListener('unlock', () => {
            this.removeFirstPersonControlListeners();
        });

        // Keyboard controls for rotation and scaling
        window.addEventListener('keydown', (event) => {
            if (this.isFirstPersonMode) return;
            
            if (this.selectedObject) {
                switch(event.key) {
                    case 'r':
                        this.selectedObject.rotation.y += Math.PI / 2;
                        break;
                    case 'R':
                        this.selectedObject.rotation.y -= Math.PI / 2;
                        break;
                    case '+':
                    case '=':
                        this.scaleObject(this.selectedObject, 1 + this.scaleSpeed);
                        break;
                    case '-':
                    case '_':
                        this.scaleObject(this.selectedObject, 1 - this.scaleSpeed);
                        break;
                    case '0':
                        this.resetScale(this.selectedObject);
                        break;
                }
            }
        });

        // Mouse wheel scaling with Shift key
        this.renderer.domElement.addEventListener('wheel', (event) => {
            if (this.isFirstPersonMode) return;
            
            if (this.selectedObject && event.shiftKey) {
                event.preventDefault();
                const scaleFactor = event.deltaY > 0 ? 
                    (1 - this.scaleSpeed) : 
                    (1 + this.scaleSpeed);
                this.scaleObject(this.selectedObject, scaleFactor);
            }
        });
    }

    setupFirstPersonControlListeners() {
        this.onKeyDown = (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = true;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft = true;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.moveBackward = true;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight = true;
                    break;
                case 'Space':
                    if (this.canJump) {
                        this.velocity.y += 10;
                        this.canJump = false;
                    }
                    break;
            }
        };

        this.onKeyUp = (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = false;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft = false;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.moveBackward = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight = false;
                    break;
            }
        };

        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('keyup', this.onKeyUp);
    }

    removeFirstPersonControlListeners() {
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);
        
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
    }

    scaleObject(object, scaleFactor) {
        const newScale = object.scale.x * scaleFactor;
        if (newScale >= this.minScale && newScale <= this.maxScale) {
            object.scale.set(newScale, newScale, newScale);
        }
    }

    resetScale(object) {
        let objectType = 'bed';
        if (object.userData.type) {
            objectType = object.userData.type;
        }
        const defaultScale = this.defaultScales[objectType];
        object.scale.set(defaultScale, defaultScale, defaultScale);
    }

    convertFloorPlan(image) {
        this.walls.forEach(wall => this.scene.remove(wall));
        this.walls = [];

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const maxSize = Math.max(image.width, image.height);
        const scaleFactor = 20 / maxSize;

        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
                const idx = (y * canvas.width + x) * 4;
                const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                
                if (brightness < 170) {
                    const wallGeometry = new THREE.BoxGeometry(scaleFactor, 2, scaleFactor);
                    const wallMaterial = new THREE.MeshStandardMaterial({ 
                        color: 0xFFFDD0,
                        roughness: 0.9,
                        metalness: 0.1
                    });
                    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                    
                    const scaledX = (x - image.width / 2) * scaleFactor;
                    const scaledZ = (y - image.height / 2) * scaleFactor;
                    wall.position.set(scaledX, 1, scaledZ);
                    
                    wall.castShadow = true;
                    wall.receiveShadow = true;
                    
                    this.walls.push(wall);
                    this.scene.add(wall);
                }
            }
        }
    }

    addFurniture(type, x, y) {
        if (!this.models[type]) {
            console.error(`Model type "${type}" not found or not loaded`);
            return;
        }
        
        const model = this.models[type].clone();
        model.userData.type = type;
        
        const initialScale = this.defaultScales[type];
        model.scale.set(initialScale, initialScale, initialScale);
        
        this.raycaster.setFromCamera(
            new THREE.Vector2(
                (x / window.innerWidth) * 2 - 1,
                -(y / window.innerHeight) * 2 + 1
            ),
            this.camera
        );

        const intersects = this.raycaster.intersectObject(this.scene.getObjectByName('ground'));
        
        if (intersects.length > 0) {
            model.position.copy(intersects[0].point);
            model.position.y = 0;
            
            this.furniture.push(model);
            this.scene.add(model);
            console.log(`Added ${type} furniture at:`, model.position);
        } else {
            console.warn("Could not find ground intersection for furniture placement");
        }
    }

    updateFirstPersonMovement() {
        const time = performance.now();
        const delta = (time - this.prevTime) / 1000;

        this.velocity.x -= this.velocity.x * 10.0 * delta;
        this.velocity.z -= this.velocity.z * 10.0 * delta;
        this.velocity.y -= 9.8 * 100.0 * delta;

        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize();

        const moveSpeed = 10.0;
        if (this.moveForward || this.moveBackward) this.velocity.z -= this.direction.z * moveSpeed * delta;
        if (this.moveLeft || this.moveRight) this.velocity.x -= this.direction.x * moveSpeed * delta;

        this.firstPersonControls.moveRight(-this.velocity.x * delta);
        this.firstPersonControls.moveForward(-this.velocity.z * delta);

        const objectPosition = this.firstPersonControls.getObject().position;
        if (objectPosition.y < this.personHeight) {
            this.velocity.y = 0;
            objectPosition.y = this.personHeight;
            this.canJump = true;
        }

        this.prevTime = time;
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.isFirstPersonMode) {
            this.updateFirstPersonMovement();
        } else if (this.controls) {
            this.controls.update();
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

new FloorPlanEditor();