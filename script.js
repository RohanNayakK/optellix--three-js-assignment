import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader'
import Stats from 'three/examples/jsm/libs/stats.module'
import {RoomEnvironment} from "three/addons/environments/RoomEnvironment";
import {TransformControls} from "three/addons/controls/TransformControls";

export const initScene = async () => {

    //Canvas container
    const canvasContainer = document.getElementById('canvasContainer');
    const canvasContainerHeight = canvasContainer.clientHeight;
    const canvasContainerWidth = canvasContainer.clientWidth;

    //Scene
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 0.01, 5000 );

    //Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true,alpha: true});
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.outputEncoding = THREE.sRGBEncoding
    renderer.setSize( canvasContainerWidth, canvasContainerHeight );
    canvasContainer.appendChild( renderer.domElement);

    //Environment
    const pmremGenerator = new THREE.PMREMGenerator( renderer );
    scene.environment = pmremGenerator.fromScene( new RoomEnvironment() ).texture;

    //Tone Mapping
    renderer.toneMapping = THREE.LinearToneMapping;

    //Stats
    const stats = Stats()
    canvasContainer.appendChild(stats.dom)

    //AmbientLight
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambientLight);


    //OrbitControls
    const orbitControls = new OrbitControls( camera, renderer.domElement );
    orbitControls.enableDamping = true;

    const transformControls = new TransformControls( camera, renderer.domElement );
    transformControls.setSpace('world')
    transformControls.setSize( 0.5 );
    scene.add( transformControls );


    // STL Loader
    const loader = new STLLoader()

    //Raycaster
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    //Landmark Variables
    let activeLandmark = null
    let lastActiveLandmark = null
    let isTrasformMode = false
    let landMarkSphereMeshArr = []


    //Methods

    //Render function
    const render = ()=>{
        renderer.render( scene, camera );
    }

    //Animate function
    const animate=()=> {
        requestAnimationFrame( animate );
        orbitControls.update();
        stats.update();
        render();
    };

    //Load STL function
    const loadSTL= async(modelPath)=>{

       return new Promise((resolve, reject) => {
           loader.load(
               modelPath,
               function (geometry) {
                   //Smooth the geometry
                   geometry.computeVertexNormals();

                   //Create mesh
                   const material=new THREE.MeshStandardMaterial({color:0xdbcfc1});
                   material.envMapIntensity=0.6;
                   const mesh = new THREE.Mesh(geometry, material);
                   resolve(mesh)
               },
               (xhr) => {
                   //Loading progress
                   // console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
               },
               (error) => {
                  reject(error)
               }
           )

       })
    }

    //Method to check if landmark is already added
    let isLandMarkAdded = (landmarkName)=>{
        let isAdded = false
        landMarkSphereMeshArr.forEach((lms)=>{
            if(lms.name === landmarkName){
                isAdded = true
            }
        })
        return isAdded
    }


    //Event Listeners
    canvasContainer.addEventListener('click',(e)=>{

        //If landmark radio is not selected then return
        if(activeLandmark === null || isTrasformMode || isLandMarkAdded(activeLandmark)){
            return
        }

        const rect = renderer.domElement.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        mouse.x = ( x / canvasContainer.clientWidth ) *  2 - 1;
        mouse.y = ( y / canvasContainer.clientHeight) * - 2 + 1
        raycaster.setFromCamera( mouse, camera );
        const intersects = raycaster.intersectObjects( scene.children );
        if ( intersects.length > 0) {
            let meshIndex= null

            //Find the mesh index
            for(let i=0;i<intersects.length;i++){
                if(intersects[i].object.type === 'Mesh'){
                    meshIndex = i
                    break
                }
            }

            //Add a sphere to the intersected point
            const sphere = new THREE.Mesh( new THREE.SphereGeometry( 2, 16, 8 ), new THREE.MeshBasicMaterial( { color: 0xff0000 } ) );
            sphere.name = activeLandmark
            lastActiveLandmark = activeLandmark
            scene.add( sphere );
            transformControls.attach(sphere)
            landMarkSphereMeshArr.push(sphere)
            sphere.position.copy( intersects[ meshIndex ].point );
        }
    })

    window.addEventListener('resize', function () {
        let canvasContainerHeight = canvasContainer.clientHeight;
        let canvasContainerWidth = canvasContainer.clientWidth;
        let cameraAspect = canvasContainerWidth / canvasContainerHeight;
        renderer.setSize(canvasContainerWidth,canvasContainerHeight);
        camera.left = camera.bottom * cameraAspect;
        camera.right = camera.top * cameraAspect;
        camera.updateProjectionMatrix();
    }, false);

    transformControls.addEventListener( 'change', render );

    transformControls.addEventListener( 'dragging-changed', function ( event ) {
        orbitControls.enabled = ! event.value;
    } );


    //Async Load STL
    let femurMesh = await loadSTL('assets/3D/models/STL/Right_Femur.stl')
    let tibiaMesh = await loadSTL('assets/3D/models/STL/Right_Tibia.stl')


    femurMesh.material.color.setHex(0x248b82)
    tibiaMesh.material.color.setHex(0x973a3c)





    //make material look realistic
    femurMesh.material.metalness = 0.1
    femurMesh.material.roughness = 0.5
    tibiaMesh.material.metalness = 0.1
    tibiaMesh.material.roughness = 0.5


    //Add mesh to scene
    scene.add(femurMesh)
    scene.add(tibiaMesh)

    //Make camera fit the both meshes
    const box = new THREE.Box3().setFromObject(femurMesh);
    const box2 = new THREE.Box3().setFromObject(tibiaMesh);
    box.union(box2);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize( new THREE.Vector3() );
    camera.position.copy(center);
    camera.position.z += size.z / 2;
    camera.lookAt(center);
    camera.updateProjectionMatrix();

    //Reset controls target to center of the mesh
    orbitControls.target.copy(center);
    orbitControls.update();

    let landmarkPointsEle = document.querySelectorAll('.landmark-points');

    landmarkPointsEle.forEach((lp)=>{
        //add onChange event listener
        lp.addEventListener('click',(e)=>{
            e.stopPropagation()
            activeLandmark = e.target.value
            console.log(isTrasformMode)
            if(isLandMarkAdded(activeLandmark)){
                isTrasformMode = true
                //Remove transform controls from last active landmark
                transformControls.detach(landMarkSphereMeshArr.find((lms)=>lms.name === lastActiveLandmark))
                //Add transform controls to current active landmark
                transformControls.attach(landMarkSphereMeshArr.find((lms)=>lms.name === activeLandmark))
            }
            else {
                isTrasformMode = false
            }

        })
    })


    //Start animation
    animate();


}


//DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
    //Init scene
    initScene()
})







