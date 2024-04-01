import * as THREE from "three"
import {
    DRACOLoader,
    GLTFLoader,
    OrbitControls,
    RenderPass,
    UnrealBloomPass,
    EffectComposer,
    OutputPass
} from "three/examples/jsm/Addons.js";

const MODEL_SCALE = 0.1;

const isMeshType = (object?: THREE.Object3D): object is THREE.Mesh => {
    return object?.type === "Mesh"
}

export default class App {
    // DOM
    container: HTMLElement;
    width: number;
    height: number;

    // Scene properties.
    renderer: THREE.WebGLRenderer;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    scene: THREE.Scene;
    time: number;

    // Environment.
    envMap?: THREE.Texture;
    composer: EffectComposer;

    // 3D Model.
    dracoLoader: DRACOLoader;
    gltfLoader: GLTFLoader;
    textureLoader: THREE.TextureLoader;
    pmremGenerator: THREE.PMREMGenerator;
    model?: THREE.Mesh; // Null in the case resource loading fails.

    constructor() {
        // Create renderer.
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x000000, 1);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

        // Add renderer to DOM.
        const container = document.getElementById("app");
        if (container) {
            container.appendChild(this.renderer.domElement);
            this.container = container;
            this.width = container.offsetWidth;
            this.height = container.offsetHeight;
        } else {
            throw new Error("DOM contains no 'app' element")
        }

        // Scene and camera.
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(70, this.width / this.height, 0.001, 1000);
        this.camera.position.set(0, 0, 2);

        // Camera controls.
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.maxPolarAngle = Math.PI * 0.9;
        this.controls.minPolarAngle = Math.PI * 0.1;
        this.controls.minDistance = 1;
        this.controls.maxDistance = 5;

        // Postprocessing.
        const renderScene = new RenderPass(this.scene, this.camera);
        const resolution = new THREE.Vector2(this.width, this.height);
        const bloomPass = new UnrealBloomPass(resolution, 1.5, 0.8, 0.3);
        const outputPass = new OutputPass();
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(renderScene);
        this.composer.addPass(bloomPass);
        this.composer.addPass(outputPass);
        this.time = 0;

        // Setup model.
        this.dracoLoader = new DRACOLoader();
        this.dracoLoader.setDecoderPath("/draco/");
        this.gltfLoader = new GLTFLoader();
        this.gltfLoader.setDRACOLoader(this.dracoLoader);
        this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        this.pmremGenerator.compileEquirectangularShader();
        this.textureLoader = new THREE.TextureLoader();

        // Handle window resize.
        this.handleResize();
        window.addEventListener("resize", () => this.handleResize());

        this.addObjects();
        // this.addLights();

        // Begin render loop.
        this.animate();
    }

    handleResize() {
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;
        this.renderer.setSize(this.width, this.height)
        this.composer.setSize(this.width, this.height)
        this.camera.aspect = this.width / this.height
        this.camera.updateProjectionMatrix();
    }

    animate() {
        this.time += 0.05;
        requestAnimationFrame(() => this.animate());
        this.composer.render()
    }

    addLights() {
        const ambient = new THREE.AmbientLight(0xcccccc);
        this.scene.add(ambient);
        const pointLight = new THREE.PointLight(0xffffff, 0.2);
        this.scene.add(pointLight)
    }

    addObjects() {
        // Load environment map.
        this.textureLoader.load(
            "environment-map.jpg",
            texture => {
                console.log("Done loading env map");
                this.envMap = this.pmremGenerator?.fromEquirectangular(texture).texture;
            },
            ({ loaded, total }) => {
                console.log(`Model ${loaded / total * 100}% loaded`)
            },
            error => {
                console.log("Error loading environment map:", error);
            }
        )

        // Load model.
        this.gltfLoader.load(
            // Resource URL.
            "human.glb",
            // On load complete.
            gltf => {
                console.log("Done loading model");

                const model = gltf.scene.children[0];
                if (!isMeshType(model) || !model.isMesh) {
                    return
                }

                // Add model to scene.
                this.scene.add(gltf.scene);
                this.model = model;
                this.model.scale.set(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);
                this.model.rotation.set(0, 0, 0);
                this.model.geometry.center();

                // Define model material.
                const material = new THREE.MeshStandardMaterial({
                    metalness: 1,
                    roughness: 0.28
                });
                // material.onBeforeCompile(shader => {

                // })
                if (this.envMap) {
                    material.envMap = this.envMap;
                }
                this.model.material = material;
            },
            ({ loaded, total }) => {
                console.log(`Model ${loaded / total * 100}% loaded`)
            },
            error => {
                console.log("Error:", error)
            }
        )
    }
}
