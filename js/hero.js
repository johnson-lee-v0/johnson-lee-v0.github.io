import * as THREE from '../js/builds/three.module.js';
import { FontLoader } from '../loaders/FontLoader.js';
import { TextGeometry } from '../geometries/TextGeometry.js';
import * as BufferGeometryUtils from '../js/builds/BufferGeometryUtils.js';

let scene, camera, renderer;
let textMeshFront, textMeshBack;
let font;
let isHeroVisible = true;
let lastFontSize = null;

const container = document.getElementById('threejs-container');

init();

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
  setInitialCameraZ();

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
  directionalLight.position.set(0, 1, 1).normalize();
  scene.add(directionalLight);

  const loader = new FontLoader();
  loader.load('../fonts/optimer_bold.typeface.json', loadedFont => {
    font = loadedFont;
    createText();
    animate();
  });

  window.addEventListener('resize', onWindowResize, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
}

function setInitialCameraZ() {
  camera.position.z = getCameraZ();
}

function getFontSize() {
  const width = window.innerWidth;
  if (width < 480) return 10;
  if (width < 675) return 12;
  if (width < 768) return 16;
  if (width < 1024) return 22;
  return 40;
}

function getCameraZ() {
  const width = window.innerWidth;
  if (width < 480) return 320;
  if (width < 675) return 340;
  if (width < 768) return 370;
  return 400;
}

function createText() {
  if (textMeshFront) scene.remove(textMeshFront);
  if (textMeshBack) scene.remove(textMeshBack);

  const fontSize = getFontSize();
  const options = {
    font: font,
    size: fontSize,
    height: 0.04, // subtle 3D effect
    curveSegments: 10,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.015,
    bevelOffset: 0,
    bevelSegments: 5,
  };

  const textMaterial = new THREE.MeshPhongMaterial({
    color: 0x222222, // dark gray for fill
    specular: 0xffffff,
    shininess: 30,
    side: THREE.FrontSide,
  });

  const outlineMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff, // white outline
  });

  // Create two lines of text
  const geometry1 = new TextGeometry('MEET', options);
  geometry1.computeBoundingBox();
  const xOffset1 = -0.5 * (geometry1.boundingBox.max.x - geometry1.boundingBox.min.x);
  geometry1.translate(xOffset1, 0, 0);

  const geometry2 = new TextGeometry('JOHNSON!', options);
  geometry2.computeBoundingBox();
  const xOffset2 = -0.5 * (geometry2.boundingBox.max.x - geometry2.boundingBox.min.x);
  geometry2.translate(xOffset2, -fontSize * 1.2, 0); // lower line

  // Merge text
  const mergedGeometry = BufferGeometryUtils.mergeGeometries([geometry1, geometry2], false);

  // Create filled mesh
  const mesh = new THREE.Mesh(mergedGeometry, textMaterial.clone());

  // Create outline
  const edgeGeometry = new THREE.EdgesGeometry(mergedGeometry);
  const outline = new THREE.LineSegments(edgeGeometry, outlineMaterial.clone());

  // Group them
  textMeshFront = new THREE.Group();
  textMeshFront.add(mesh);
  textMeshFront.add(outline);
  scene.add(textMeshFront);

  // Back side (mirrored)
  textMeshBack = textMeshFront.clone();
  textMeshBack.rotation.y = Math.PI;
  scene.add(textMeshBack);
}




function onScroll() {
  const scrollY = window.scrollY;
  const heroHeight = window.innerHeight;

  const scrollRatio = Math.min(scrollY / heroHeight, 1);
  const maxZ = getCameraZ();
  const minZ = 150;
  camera.position.z = maxZ - scrollRatio * (maxZ - minZ);

  isHeroVisible = scrollRatio <= 1;

  const aboutSection = document.getElementById('about');
  if (scrollRatio > 0.1) {
    aboutSection.classList.add('visible');
  } else {
    aboutSection.classList.remove('visible');
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  setInitialCameraZ();
  createText(); // recreate only if necessary
}

function animate() {
  requestAnimationFrame(animate);

  if (textMeshFront && textMeshBack && isHeroVisible) {
    const delta = 0.002;
    textMeshFront.rotation.y += delta;
    textMeshBack.rotation.y += delta;

    const yRotation = textMeshFront.rotation.y % (2 * Math.PI);
    const isFrontFacing = yRotation < Math.PI / 2 || yRotation > 3 * Math.PI / 2;

    textMeshFront.visible = isFrontFacing;
    textMeshBack.visible = !isFrontFacing;
  }

  render();
}

function render() {
  renderer.render(scene, camera);
}
