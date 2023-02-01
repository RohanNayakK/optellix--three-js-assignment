import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader'
import Stats from 'three/examples/jsm/libs/stats.module'
import {RoomEnvironment} from "three/addons/environments/RoomEnvironment";

export const initScene = () => {

    //Canvas container
    const canvasContainer = document.getElementById('canvasContainer');
    const canvasContainerHeight = canvasContainer.clientHeight;
    const canvasContainerWidth = canvasContainer.clientWidth;

    //Scene
    const scene = new THREE.Scene();

    //Camera
    const camera = new THREE.PerspectiveCamera( 100, canvasContainerWidth/canvasContainerHeight, 0.1, 1000 );
    camera.position.z = 300;

    //Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true,alpha: true});
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.outputEncoding = THREE.sRGBEncoding
    renderer.setSize( canvasContainerWidth, canvasContainerHeight );
    canvasContainer.appendChild( renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator( renderer );
    scene.environment = pmremGenerator.fromScene( new RoomEnvironment() ).texture;

    //Tone Mapping
    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    //Stats
    const stats = Stats()
    canvasContainer.appendChild(stats.dom)


    //OrbitControls
    const controls = new OrbitControls( camera, renderer.domElement );
    controls.enableDamping = true;

    // STL Loader
    const loader = new STLLoader()


    //Animate function
    const animate=()=> {
        requestAnimationFrame( animate );
        controls.update();
        stats.update();
        renderer.render( scene, camera );
    };

    window.addEventListener('resize', function () {
        renderer.setSize(canvasContainerWidth,canvasContainerHeight);
        camera.aspect = canvasContainerWidth/canvasContainerHeight;
        camera.updateProjectionMatrix();
    }, false);


   const loadSTL=(modelPath,position={x:0,y:0,z:0},rotation={x:0,y:0,z:0})=>{
       loader.load(
           modelPath,
           function (geometry) {
               //Create mesh
               const material=new THREE.MeshStandardMaterial({color: 0xe3dac9 });
               material.envMapIntensity=0.6;
               const mesh = new THREE.Mesh(geometry, material);
               //Add mesh to scene
               mesh.geometry.computeVertexNormals(true);
               mesh.geometry.center();
               scene.add(mesh);

           },
           (xhr) => {
               console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
           },
           (error) => {
               console.log(error)
           }
       )
    }

    //Load STL
    loadSTL('assets/3D/models/STL/Right_Femur.stl',{x:0,y:0,z:0},{x:0,y:0,z:0})
    loadSTL('assets/3D/models/STL/Right_Tibia.stl',{x:0,y:0,z:0},{x:0,y:0,z:0})


    animate();

}






