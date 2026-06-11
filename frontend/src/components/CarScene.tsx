import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RenderPass } from "three/examples/jsm/Addons.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export default function CarScene({
  className = "h-[260px] w-full md:h-[390px]",
}: {
  className?: string;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return;
    }

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth || 500, mount.clientHeight || 500);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0xffffff, 0);
    renderer.domElement.style.background = "transparent";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      38,
      (mount.clientWidth || 420) / (mount.clientHeight || 360),
      0.1,
      100,
    );
    camera.position.set(0, 1.35, 5.4);

    const renderPass = new RenderPass(scene, camera);
    renderPass.clearAlpha = 0;
    renderPass.clear = true;
    scene.add(new THREE.AmbientLight(0xfff5e7, 0.95));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.45);
    keyLight.position.set(5, 7, 4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xcfe7b5, 0.6);
    fillLight.position.set(-4, 2, -5);
    scene.add(fillLight);

    const group = new THREE.Group();
    scene.add(group);

    const loader = new GLTFLoader();

    loader.load(
      "/car1.glb",
      (gltf: { scene: THREE.Group }) => {
        const model = gltf.scene;
        model.traverse((child: THREE.Object3D) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
          }
        });
        model.scale.set(200, 200, 200);
        model.position.set(-1, 0, 0);
        model.rotation.y = Math.PI / 12;
        group.add(model);
      },
      undefined,
      (error: unknown) => {
        console.error("Unable to load car.glb", error);
      },
    );

    let frame = 0;
    const animate = () => {
      frame += 1;
      if (group.children.length > 0) {
        group.rotation.y = Math.sin(frame * 0.025) * 0.15 + Math.PI / 7;
      }
      renderer.render(scene, camera);
    };

    renderer.setAnimationLoop(animate);

    const onResize = () => {
      const width = mount.clientWidth || 420;
      const height = mount.clientHeight || 360;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      renderer.setAnimationLoop(null);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      scene.clear();
    };
  }, []);

  return <div ref={mountRef} className={className} />;
}
