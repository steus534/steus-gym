// "use client";
// import { useEffect, useRef, useState } from "react";
// import { useRouter } from "next/navigation";
// import * as THREE from "three";
// import { OrbitControls } from "three/addons/controls/OrbitControls.js";
// import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
// import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
// import gsap from "gsap";
// import { FaArrowLeft, FaSync } from "react-icons/fa";

// export default function AnatomyPage() {
//   const router = useRouter();
//   const containerRef = useRef<HTMLDivElement>(null);
//   const [selectedInfo, setSelectedInfo] = useState<any>(null);
//   const [loadingProgress, setLoadingProgress] = useState(0);

//   useEffect(() => {
//     if (!containerRef.current) return;

//     const scene = new THREE.Scene();
//     scene.background = new THREE.Color(0x050505);

//     const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
//     camera.position.set(0, 1.5, 4);

//     const renderer = new THREE.WebGLRenderer({ antialias: true });
//     renderer.setSize(window.innerWidth, window.innerHeight);
//     renderer.setPixelRatio(window.devicePixelRatio);
//     containerRef.current.appendChild(renderer.domElement);

//     scene.add(new THREE.AmbientLight(0xffffff, 0.6));
//     const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
//     mainLight.position.set(2, 5, 5);
//     scene.add(mainLight);

//     const controls = new OrbitControls(camera, renderer.domElement);
//     controls.enableDamping = true;

//     const loader = new GLTFLoader();
//     const dracoLoader = new DRACOLoader();
//     // Draco 디코더 경로는 외부 CDN 사용 (안정적임)
//     dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/'); 
//     loader.setDRACOLoader(dracoLoader);

//     // [확인] public/Startup.glb를 불러오는 정확한 경로
//     loader.load(
//       "/Startup.glb", 
//       (gltf) => {
//         const model = gltf.scene;
//         model.traverse((child: any) => {
//           if (child.isMesh) {
//             const name = child.name.toLowerCase();
//             // 근육: 붉은색
//             if (name.includes("muscle") || name.includes(".o") || name.includes(".e") || name.includes(".i")) {
//               child.material = new THREE.MeshStandardMaterial({ color: 0xbc2c2c, roughness: 0.6 });
//             } 
//             // 뼈: 흰색
//             else if (name.includes(".t") || name.includes("bone") || name.includes("skeletal")) {
//               child.material = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.4 });
//             }
//             // 기타: 반투명
//             else {
//               child.material = new THREE.MeshStandardMaterial({ color: 0x333333, transparent: true, opacity: 0.2 });
//             }
//           }
//         });
//         model.position.y = -1.2;
//         scene.add(model);
//         setLoadingProgress(100);
//       }, 
//       (xhr) => {
//         if (xhr.lengthComputable) {
//           setLoadingProgress(Math.round((xhr.loaded / xhr.total) * 100));
//         }
//       },
//       (error) => {
//         console.error("모델 로드 중 에러 발생:", error);
//       }
//     );

//     const raycaster = new THREE.Raycaster();
//     const mouse = new THREE.Vector2();

//     const onClick = (e: MouseEvent) => {
//       mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
//       mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
//       raycaster.setFromCamera(mouse, camera);

//       const intersects = raycaster.intersectObjects(scene.children, true);
//       if (intersects.length > 0) {
//         let obj = intersects[0].object;
//         const name = obj.name.replace(/\..*/, "");
//         setSelectedInfo({ name: name, eng: name });
//         gsap.to(camera.position, { x: intersects[0].point.x, y: intersects[0].point.y + 0.3, z: intersects[0].point.z + 1.2, duration: 0.8 });
//         gsap.to(controls.target, { x: intersects[0].point.x, y: intersects[0].point.y, z: intersects[0].point.z, duration: 0.8 });
//       }
//     };

//     window.addEventListener("click", onClick);
//     const animate = () => {
//       requestAnimationFrame(animate);
//       controls.update();
//       renderer.render(scene, camera);
//     };
//     animate();

//     return () => {
//       window.removeEventListener("click", onClick);
//       renderer.dispose();
//     };
//   }, []);

//   return (
//     <div className="relative w-full h-screen bg-black">
//       <button onClick={() => router.back()} className="absolute top-8 left-8 z-50 flex items-center gap-2 bg-zinc-900/80 hover:bg-lime-500 hover:text-black text-white px-5 py-3 rounded-2xl border border-zinc-800 transition-all font-black text-xs uppercase shadow-2xl">
//         <FaArrowLeft /> Exit
//       </button>

//       {loadingProgress < 100 && (
//         <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/95">
//           <FaSync className="text-lime-500 animate-spin text-3xl mb-4" />
//           <p className="text-lime-500 font-black italic">LOADING ANATOMY... {loadingProgress}%</p>
//         </div>
//       )}

//       <div ref={containerRef} className="w-full h-full cursor-crosshair" />

//       {selectedInfo && (
//         <div className="absolute top-8 right-8 w-80 bg-zinc-900/90 p-8 rounded-[2.5rem] border border-zinc-800 backdrop-blur-xl shadow-2xl">
//           <h2 className="text-lime-500 font-black italic text-xl mb-6 uppercase border-b border-zinc-800 pb-4">{selectedInfo.name}</h2>
//           <div className="space-y-4 text-[10px] font-bold">
//             <p><span className="text-zinc-500 uppercase block mb-1">Standard Name</span> {selectedInfo.eng}</p>
//             <p className="text-zinc-400 leading-relaxed pt-2 italic">"Click the Exit button to go back to the dashboard."</p>
//           </div>
//           <button onClick={() => setSelectedInfo(null)} className="w-full mt-8 py-3 bg-zinc-800 rounded-xl text-[9px] font-black uppercase hover:bg-white hover:text-black transition-all">Close</button>
//         </div>
//       )}
//     </div>
//   );
// }