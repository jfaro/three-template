import * as THREE from "three"
import { DRACOLoader, OrbitControls } from "three/examples/jsm/Addons.js";
import { GLTFLoader } from "three/examples/jsm/Addons.js";

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
    clock: THREE.Clock;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    scene: THREE.Scene;
    time: number;

    // Env
    envMap?: THREE.Texture;

    // Model
    dracoLoader: DRACOLoader;
    gltfLoader: GLTFLoader;
    model?: THREE.Mesh;
    pmremGenerator?: THREE.PMREMGenerator;

    constructor() {
        // Create renderer.
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0xeeeeee, 1);

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

        // Create scene.
        this.scene = new THREE.Scene();
        this.clock = new THREE.Clock();
        this.camera = new THREE.PerspectiveCamera(70, this.width / this.height, 0.001, 1000);
        this.camera.position.set(0, 0, 2);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.time = 0;

        // Setup model.
        this.dracoLoader = new DRACOLoader();
        this.dracoLoader.setDecoderPath("/draco/");
        this.gltfLoader = new GLTFLoader();
        this.gltfLoader.setDRACOLoader(this.dracoLoader);

        // Handle window resize.
        this.handleResize();
        window.addEventListener("resize", () => this.handleResize(), false);

        this.addObjects();

        // Begin render loop.
        this.animate();
    }

    handleResize() {
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;
        this.renderer.setSize(this.width, this.height)
        this.camera.aspect = this.width / this.height
        this.camera.updateProjectionMatrix();
    }

    animate() {
        this.time += 0.05;
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera)
    }

    addLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambient);
        const directional = new THREE.DirectionalLight(0xffffff, 0.5);
        directional.position.set(0.5, 0, 0.866);
        this.scene.add(directional)
    }

    addObjects() {
        // Load environment map.
        this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        this.pmremGenerator.compileEquirectangularShader();

        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
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

                const material = new THREE.MeshStandardMaterial({
                    metalness: 1,
                    roughness: 0.28
                });
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
