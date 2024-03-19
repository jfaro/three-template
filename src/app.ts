import * as THREE from "three"

export default class App {
    // Scene properties.
    scene: THREE.Scene;
    clock: THREE.Clock;
    camera: THREE.Camera;
    renderer: THREE.WebGLRenderer;

    constructor() {
        this.scene = new THREE.Scene();
        this.clock = new THREE.Clock();
        this.camera = new THREE.Camera();
        this.camera.position.z = 1;
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0xeeeeee, 1);

        // Add renderer to DOM.
        const container = document.getElementById("app");
        if (container) {
            container.appendChild(this.renderer.domElement);
        } else {
            throw new Error("DOM contains no 'app' element")
        }

        // Handle window resize.
        this.handleResize();
        window.addEventListener("resize", () => this.handleResize(), false);

        // Begin render loop.
        this.update()
    }

    handleResize() {
        const parent = this.renderer?.domElement.parentElement;
        if (parent) {
            const { clientWidth, clientHeight } = parent
            this.renderer.setSize(clientWidth, clientHeight)
        }
    }

    update() {
        this.renderer.render(this.scene, this.camera)
        requestAnimationFrame(() => this.update());
    }
}
