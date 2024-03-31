import * as THREE from "three"
import { DRACOLoader, OrbitControls } from "three/examples/jsm/Addons.js";
import { GLTFLoader } from "three/examples/jsm/Addons.js";

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

    // Model
    dracoLoader: DRACOLoader;
    gltf: GLTFLoader;

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

        // Setup model.
        this.dracoLoader = new DRACOLoader();
        this.dracoLoader.setDecoderPath("/draco/");
        this.gltf = new GLTFLoader();
        this.gltf.setDRACOLoader(this.dracoLoader);

        // Handle window resize.
        this.handleResize();
        window.addEventListener("resize", () => this.handleResize(), false);

        // Begin render loop.
        this.animate();
        this.addObjects();
    }

    handleResize() {
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;
        this.renderer.setSize(this.width, this.height)
        this.camera.aspect = this.width / this.height
        this.camera.updateProjectionMatrix();
    }

    animate() {
        this.renderer.render(this.scene, this.camera)
        requestAnimationFrame(() => this.animate());
    }

    addObjects() {
        this.gltf.load(
            // Resource URL
            "human.glb",
            (gltf) => {
                console.log("loaded", gltf)
                this.scene.add(gltf.scene);
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded')
            },
            (error) => {
                console.log("Error:", error)
            }
        )
    }
}
