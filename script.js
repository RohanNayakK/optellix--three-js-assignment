import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader'
import {RoomEnvironment} from "three/addons/environments/RoomEnvironment";
import {TransformControls} from "three/addons/controls/TransformControls";
import {CSS2DObject, CSS2DRenderer} from "three/addons/renderers/CSS2DRenderer";

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


    //new CSS2DRenderer
    let css2dRenderer = new CSS2DRenderer();
    css2dRenderer.setSize( canvasContainerWidth, canvasContainerHeight );
    css2dRenderer.domElement.style.position = 'absolute';
    css2dRenderer.domElement.style.top = 0;
    canvasContainer.appendChild( css2dRenderer.domElement );
    css2dRenderer.domElement.style.pointerEvents = 'none'

    //Environment
    const pmremGenerator = new THREE.PMREMGenerator( renderer );
    scene.environment = pmremGenerator.fromScene( new RoomEnvironment() ).texture;

    //Tone Mapping
    renderer.toneMapping = THREE.LinearToneMapping;

    //Stats
    // const stats = Stats()
    // canvasContainer.appendChild(stats.dom)

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
        css2dRenderer.render( scene, camera );

    }

    //Animate function
    const animate=()=> {
        requestAnimationFrame( animate );
        orbitControls.update();
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
                   const material=new THREE.MeshStandardMaterial({color:0xdbcfc1,opacity:0.7,transparent:true});
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

   let pointsPositons = [

       {
           "x": -56.7131946939946,
           "y": -89.15283484072006,
           "z": 722.3627647612982
       },
       {
           "x": -68.76129171106788,
           "y": -107.152341510077,
           "z": 1151.4449395772365
       },

       {
           "x": -132.0311321283117,
           "y": -91.90489571577335,
           "z": 1133.749797709973
       },
       {
           "x": -48.93161874578718,
           "y": -115.9039033549401,
           "z": 732.0438013385067
       },
       {
           "x": -99.70990248393576,
           "y": -90.38725891145552,
           "z": 738.3310959167948
       },
       {
           "x": -18.84442425563458,
           "y": -83.87776973949804,
           "z": 738.9483912109132
       },
       {
           "x": -82.40301760776867,
           "y": -63.23425919229226,
           "z": 728.2797534372805
       },

       {
           "x": -37.4430446754395,
           "y": -57.243872851051606,
           "z": 727.8583405248667
       },


       {
           "x": -91.46550510635123,
           "y": -76.03137062700046,
           "z": 715.8937623442766
       },

       {
           "x": -74.90045947601438,
           "y": -100.91272736584324,
           "z": 715.6833767392832
       }
   ]


    //addPoints to scene
    const addPoints = ()=>{
        pointsPositons.forEach((p)=>{
            const geometry = new THREE.SphereGeometry( 3, 32, 32 );
            const material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
            const sphere = new THREE.Mesh( geometry, material );
            sphere.position.set(p.x,p.y,p.z)
            scene.add( sphere );
        })
    }
    addPoints()

    //Line Create – Between Femur Center & Hip Center Landmark (Mechanical Axis
    let femurCenter = pointsPositons[0]
    let hipCenter = pointsPositons[1]
    const createLine = (startPoint, endPoint)=>{
        const material = new THREE.LineBasicMaterial( { color: 0xFFD700 } );
        const geometry = new THREE.BufferGeometry().setFromPoints( [ startPoint, endPoint ] );
        return new THREE.Line( geometry, material );
    }

    let mechanicalAxis = createLine(femurCenter, hipCenter)
    mechanicalAxis.name = 'mechanicalAxis'
    scene.add(mechanicalAxis)


    //Line Create – Between Femur Proximal Canal & Femur Distal Canal (Anatomical Axis)
    let femurProximalCanal = pointsPositons[2]
    let femurDistalCanal = pointsPositons[3]

    let anatomicalAxis = createLine(femurProximalCanal, femurDistalCanal)
    anatomicalAxis.name = 'anatomicalAxis'
    scene.add(anatomicalAxis)

    //Line Create – Between Medial Epicondyle & Lateral Epicondyle (TEA-Trans epicondyle Axis)
    let medialEpicondyle = pointsPositons[4]
    let lateralEpicondyle = pointsPositons[5]

    let teaAxis = createLine(medialEpicondyle, lateralEpicondyle)
    teaAxis.name = 'teaAxis'
    scene.add(teaAxis)



    //Line Create – Between Posterior Medical Pt & Posterior Lateral Pt (PCA- Posterior Condyle Axis)
    let posteriorMedialPt = pointsPositons[6]
    let posteriorLateralPt = pointsPositons[7]

    let pcaAxis=createLine(posteriorMedialPt, posteriorLateralPt)
    pcaAxis.name = 'pcaAxis'
    scene.add(pcaAxis)


    //Step 4
    // Create a plane perpendicular to mechanicalAxis
    var planeGeometry = new THREE.PlaneGeometry(200, 200);
    var planeMaterial = new THREE.MeshBasicMaterial({color: 0x0000ff, side: THREE.DoubleSide, transparent: true, opacity: 0.5});
    var mechAisPerpendicularPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    mechAisPerpendicularPlane.position.set(femurCenter.x, femurCenter.y, femurCenter.z);
    mechAisPerpendicularPlane.lookAt(hipCenter.x, hipCenter.y, hipCenter.z)
    scene.add(mechAisPerpendicularPlane);



    const getProjection = (point, planeMesh) => {
        //direction is negative z axis
        let direction = new THREE.Vector3(0, 0, -1);

        raycaster.set(point, direction);
        let intersects = raycaster.intersectObject(planeMesh);

        return intersects[0].point;
    }

    let teaAxisPoint1 = getProjection(medialEpicondyle, mechAisPerpendicularPlane)
    let teaAxisPoint2 = getProjection(lateralEpicondyle, mechAisPerpendicularPlane)


    //add teaAxisPoint1 & teaAxisPoint2 to scen
    const geometry = new THREE.SphereGeometry( 3, 32, 32 );
    const material = new THREE.MeshBasicMaterial( {color: 0xff0000} );
    const sphere1 = new THREE.Mesh( geometry, material );
    sphere1.position.set(teaAxisPoint1.x,teaAxisPoint1.y,teaAxisPoint1.z)
    scene.add( sphere1 );

    const sphere2 = new THREE.Mesh( geometry, material );
    sphere2.position.set(teaAxisPoint2.x,teaAxisPoint2.y,teaAxisPoint2.z)
    scene.add( sphere2 );

    let projectedTeaAxis = createLine(teaAxisPoint1, teaAxisPoint2)
    projectedTeaAxis.name = 'projectedTeaAxis'
    scene.add(projectedTeaAxis)



    //create a point at distance of 10mm from femurCenter in anterior direction
    let femurCenterAnteriorPoint = new THREE.Vector3(femurCenter.x, femurCenter.y, femurCenter.z)
    femurCenterAnteriorPoint.add(new THREE.Vector3(0, -10, 0))

    //create a line between femurCenterAnteriorPoint & femurCenter
    let anteriorLine = createLine(femurCenterAnteriorPoint, femurCenter)
    anteriorLine.name = 'anteriorLine'
    scene.add(anteriorLine)


    //add femurCenterAnteriorPoint to scene
    const sphere3 = new THREE.Mesh( geometry, material );
    sphere3.position.set(femurCenterAnteriorPoint.x,femurCenterAnteriorPoint.y,femurCenterAnteriorPoint.z)
    scene.add( sphere3 );

    //duplicate perpendicular plane
    let varcusValgusPlane = mechAisPerpendicularPlane.clone()
    varcusValgusPlane.material = new THREE.MeshBasicMaterial({color: 0xffff00, side: THREE.DoubleSide, transparent: true, opacity: 0.5});

    varcusValgusPlane.material.needsUpdate = true

    scene.add(varcusValgusPlane)

    let varcusValgusIncrease = document.getElementById('varcusValgusIncrease')
    let varcusValgusDecrease = document.getElementById('varcusValgusDecrease')

    varcusValgusIncrease.addEventListener('click',()=>{
      //rotate in y axis
        varcusValgusPlane.rotateY(0.1)
    })

    varcusValgusDecrease.addEventListener('click',()=>{
        //rotate in y axis
        varcusValgusPlane.rotateY(-0.1)
    })

    //project anteriorLine on varcusValgusPlane
    let projectedAnteriorLinePoint1 = getProjection(femurCenterAnteriorPoint, varcusValgusPlane)
    let projectedAnteriorLinePoint2 = getProjection(femurCenter, varcusValgusPlane)

    //add projectedAnteriorLinePoint1 & projectedAnteriorLinePoint2 to scene
    const sphere4 = new THREE.Mesh( geometry, material );
    sphere4.position.set(projectedAnteriorLinePoint1.x,projectedAnteriorLinePoint1.y,projectedAnteriorLinePoint1.z)
    scene.add( sphere4 );

    const sphere5 = new THREE.Mesh( geometry, material );
    sphere5.position.set(projectedAnteriorLinePoint2.x,projectedAnteriorLinePoint2.y,projectedAnteriorLinePoint2.z)
    scene.add( sphere5 );

    let projectedAnteriorLine = createLine(projectedAnteriorLinePoint1, projectedAnteriorLinePoint2)
    projectedAnteriorLine.name = 'projectedAnteriorLine'
    scene.add(projectedAnteriorLine)


    //create a point at distance of 10mm from femurCenter in lateral direction
    let femurCenterLateralPoint = new THREE.Vector3(femurCenter.x, femurCenter.y, femurCenter.z)
    femurCenterLateralPoint.add(new THREE.Vector3(0, 10, 0))

    //create a line between femurCenterLateralPoint & femurCenter
    let lateralLine = createLine(femurCenterLateralPoint, femurCenter)
    lateralLine.name = 'lateralLine'
    scene.add(lateralLine)

    //add femurCenterLateralPoint to scene
    const sphere6 = new THREE.Mesh( geometry, material );
    sphere6.position.set(femurCenterLateralPoint.x,femurCenterLateralPoint.y,femurCenterLateralPoint.z)
    scene.add( sphere6 );


    //project lateralLine on varcusValgusPlane
    let projectedLateralLinePoint1 = getProjection(femurCenterLateralPoint, varcusValgusPlane)
    let projectedLateralLinePoint2 = getProjection(femurCenter, varcusValgusPlane)

    //add projectedLateralLinePoint1 & projectedLateralLinePoint2 to scene
    const sphere7 = new THREE.Mesh( geometry, material );
    sphere7.position.set(projectedLateralLinePoint1.x,projectedLateralLinePoint1.y,projectedLateralLinePoint1.z)
    scene.add( sphere7 );

    const sphere8 = new THREE.Mesh( geometry, material );
    sphere8.position.set(projectedLateralLinePoint2.x,projectedLateralLinePoint2.y,projectedLateralLinePoint2.z)
    scene.add( sphere8 );

    let projectedLateralLine = createLine(projectedLateralLinePoint1, projectedLateralLinePoint2)
    projectedLateralLine.name = 'projectedLateralLine'
    scene.add(projectedLateralLine)

    //duplicate varcusValgusPlane
    let flexionPlane = varcusValgusPlane.clone()
    flexionPlane.material = new THREE.MeshBasicMaterial({color: 0x00ff00, side: THREE.DoubleSide, transparent: true, opacity: 0.5});
    flexionPlane.material.needsUpdate = true
    scene.add(flexionPlane)


    let flexionIncrease = document.getElementById('flexionIncrease')
    let flexionDecrease = document.getElementById('flexionDecrease')

    flexionIncrease.addEventListener('click',()=>{
        //rotate in y axis
        flexionPlane.rotateY(0.1)
})

    flexionDecrease.addEventListener('click',()=>{
        //rotate in y axis
        flexionPlane.rotateY(-0.1)
    })


    let distalMedialPoint = pointsPositons[6]
    let distalLateralPoint = pointsPositons[7]

    let distalMedialVector = new THREE.Vector3(distalMedialPoint.x, distalMedialPoint.y, distalMedialPoint.z)

    //create a plane parallel to flexionPlane and passing through distalMedialPoint
    let distalMedialGeo = new THREE.PlaneGeometry(200, 200);
    let distalMedialMat= new THREE.MeshBasicMaterial({color: 0x5dd4b7, side: THREE.DoubleSide, transparent: true, opacity: 0.5});
    let distalMedialPlane = new THREE.Mesh(distalMedialGeo, distalMedialMat);
    distalMedialPlane.position.set(distalMedialVector.x, distalMedialVector.y, distalMedialVector.z);
    // distalMedialPlane.lookAt(flexionPlane.position);
    scene.add(distalMedialPlane);


    //create a new plane parallel to distalMedialPlane and 10mm away from distalMedialPoint in proximal direction
    let distalResectionPlane = distalMedialPlane.clone()
    distalResectionPlane.material = new THREE.MeshBasicMaterial({color: 0x4d53a4, side: THREE.DoubleSide, transparent: true, opacity: 0.5});
    distalResectionPlane.material.needsUpdate = true
    distalResectionPlane.position.set(distalMedialVector.x, distalMedialVector.y, distalMedialVector.z+10);

    scene.add(distalResectionPlane)


    //show distance between distalMedialPoint & distalResectionPlane
        const getDistance = (point1, point2)=>{
        return Math.sqrt(Math.pow(point1.x-point2.x, 2) + Math.pow(point1.y-point2.y, 2) + Math.pow(point1.z-point2.z, 2))
    }


    let distalMedialPointToDistalResectionPlane = getDistance(distalMedialPoint, distalResectionPlane.position)

    //show distance between distalLateralPoint & distalResectionPlane
    let distalLateralPointToDistalResectionPlane = getDistance(distalLateralPoint, distalResectionPlane.position)



    //show distance using css2dRenderer
    let distalMedialPointToDistalResectionPlaneLabel = new CSS2DObject( document.createElement( 'div' ) );
    distalMedialPointToDistalResectionPlaneLabel.position.set(distalMedialPoint.x, distalMedialPoint.y, distalMedialPoint.z);
    distalMedialPointToDistalResectionPlaneLabel.element.style.color = 'white';
    distalMedialPointToDistalResectionPlaneLabel.element.style.fontSize = 'small';
    distalMedialPointToDistalResectionPlaneLabel.element.style.fontWeight = 'bold';
    distalMedialPointToDistalResectionPlaneLabel.element.style.marginTop = '-1em';
    distalMedialPointToDistalResectionPlaneLabel.element.innerHTML =
        `<span style="color: red;" >Distal Medial :</span> ${distalMedialPointToDistalResectionPlane.toFixed(1)} mm`
    scene.add( distalMedialPointToDistalResectionPlaneLabel );


    let distalLateralPointToDistalResectionPlaneLabel = new CSS2DObject( document.createElement( 'div' ) );
    distalLateralPointToDistalResectionPlaneLabel.position.set(distalLateralPoint.x, distalLateralPoint.y, distalLateralPoint.z);
    distalLateralPointToDistalResectionPlaneLabel.element.style.color = 'white';
    distalLateralPointToDistalResectionPlaneLabel.element.style.fontSize = 'small';
    distalLateralPointToDistalResectionPlaneLabel.element.style.fontWeight = 'bold';
    distalLateralPointToDistalResectionPlaneLabel.element.style.marginTop = '-1em';
    distalLateralPointToDistalResectionPlaneLabel.element.innerHTML =
        `<span style="color: red;" >Distal Lateral :</span> ${distalLateralPointToDistalResectionPlane.toFixed(1)} mm`
    scene.add( distalLateralPointToDistalResectionPlaneLabel );




    let resectionToggle = document.getElementById('resectionToggle')
    resectionToggle.addEventListener('change',()=>{
        if(resectionToggle.checked){
            distalResectionPlane.visible = true
        }else{
            distalResectionPlane.visible = false
        }

    })







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
            const sphere = new THREE.Mesh( new THREE.SphereGeometry( 4, 16, 8 ), new THREE.MeshBasicMaterial( { color: 0xff0000 } ) );
            sphere.name = activeLandmark
            lastActiveLandmark = activeLandmark
            console.log(intersects[ meshIndex ].point)
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







