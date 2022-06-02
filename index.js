import * as THREE from 'three';
import { GLTFLoader }  from './node_modules/three/examples/jsm/loaders/GLTFLoader.js';


let tree, carObstacle;
let treeObj = new THREE.Object3D(); // three object where glb will be stored
const scene = new THREE.Scene();
const playerCar = Car();
scene.add(playerCar);       // adding player's car to the scene

const config = {
    trees: true
};

 const loader = new GLTFLoader();
// loader.load('objects/playerCar/scene.glb', function(gltf){

//     car = gltf.scene;
//    car.position.y = -100;
//    //car.scene.scale.set(0,2,2);
//     scene.add(car);
// }, undefined, function(error){
//     console.error(error);
// });


// to jest dzialajacy kod na wczytanie trucka, 
// loader.load('objects/playerCar/scene.glb', function(gltf){
//     (gltf.scene).scale.set(0.2,0.2,0.2);
//     (gltf.scene).rotation.x = Math.PI/2;
//     (gltf.scene).rotation.y = Math.PI/2;
    


//     scene.add(gltf.scene);
// }, undefined, function(error){
//     console.error(error);
// });



//track consts
const trackRadius = 225;
const trackWidth = 45;
const innerTrackRadius = trackRadius - trackWidth;
const outerTrackRadius = trackRadius + trackWidth;

const arcAngle1 = (1 / 3) * Math.PI;  // 60 deg

const deltaY = Math.sin(arcAngle1) * innerTrackRadius;
const arcAngle2 = Math.asin(deltaY / outerTrackRadius);

const arcCenterX = (
    Math.cos(arcAngle1) * innerTrackRadius +
    Math.cos(arcAngle2) * outerTrackRadius
) / 2;

const arcAngle3 = Math.acos(arcCenterX / innerTrackRadius);
const arcAngle4 = Math.acos(arcCenterX / outerTrackRadius);


//adding light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
directionalLight.position.set(100, -300, 400);
scene.add(directionalLight);

//setting camera
const aspectRatio = window.innerWidth / window.innerHeight;
const cameraWidth = 960;
const cameraHeight = cameraWidth / aspectRatio;

const camera = new THREE.OrthographicCamera(
    cameraWidth / -2,  //left
    cameraWidth / 2,   //right
    cameraHeight / 2,  //top
    cameraHeight / -2, //bottom
    0,  // near plane
    1000  //far plane
);
camera.position.set(0, -210, 300);
//camera.up.set(0, 0, 1);
camera.lookAt(0, 0, 0);

//map render

renderMap(cameraWidth, cameraHeight * 2);


//renderer !!!!
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);


document.body.appendChild(renderer.domElement);

//renderer.render(scene, camera);          /// to niby powinno byc przed {document.body.appendChild...}
animate();

/// GAME LOGIC 


let ready;
let playerAngleMoved;
let score;
const scoreElement = document.getElementById("score");
const buttonsElement = document.getElementById("buttons");
const instructionsElement = document.getElementById("instructions");
const resultsElement = document.getElementById("results");
const accelerateButton = document.getElementById("accelerate");
const decelerateButton = document.getElementById("decelerate");
let otherVehicles = [];
let lastTimestamp;
const playerAngleInitial = Math.PI;
const speed = 0.0017;
let accelerate = false;
let decelerate = false;
//let accelerate;
//let decelerate;

//reset function
reset();
 function reset(){
     //reset position and score
     playerAngleMoved = 0;
     movePlayerCar(0);
     score = 0;
     scoreElement.innerText = score;
     lastTimestamp = undefined;

     //remove other vehicles
     otherVehicles.forEach((vehicle) => {
         scene.remove(vehicle.mesh);
     });
     otherVehicles = [];
     renderer.render(scene, camera);
     ready = true;
 }
//start game function
 function startGame(){
     if(ready) {
         ready = false;
         renderer.setAnimationLoop(animation);
     }
 }


 window.addEventListener("keydown", function (event){
     if(event.key == "ArrowUp"){
         startGame();
         accelerate = true;
         return;
     }
     if(event.key == "ArrowDown"){
         decelerate = true;
         return;
     }
     if(event.key == "R" || event.key == "r"){
         reset();
         return;
     }
 });

 window.addEventListener("keyup", function(event){
     if(event.key == "ArrowUp"){
         accelerate = false;
         return;
     }
     if(event.key == "ArrowDown"){
         decelerate = false;
         return;
     }
 });

function animation(timestamp){
    if(!lastTimestamp){
        lastTimestamp = timestamp;
        return;
    }
    const timeDelta = timestamp - lastTimestamp;
    movePlayerCar(timeDelta);

    const laps = Math.floor(Math.abs(playerAngleMoved) / (Math.PI * 2));
    /// update score if it changed
    if(laps != score){
        score = laps;
        scoreElement.innerText = score;
    }
    /// Add a new vehicle at start and every 5th lap
    if(otherVehicles.length < (laps + 1) /5){
        addVehicle();
    } 
    moveOtherVehicles(timeDelta);
    hitDetection();
    renderer.render(scene, camera);
    lastTimestamp = timestamp;
}
 function movePlayerCar(timeDelta){
     const playerSpeed = getPlayerSpeed();
     playerAngleMoved -= playerSpeed * timeDelta;
     const totalPlayerAngle = playerAngleInitial + playerAngleMoved;
     
     const playerX = Math.cos(totalPlayerAngle) * trackRadius - arcCenterX;
     const playerY = Math.sin(totalPlayerAngle) * trackRadius;

     playerCar.position.x = playerX;
     playerCar.position.y = playerY;

     playerCar.rotation.z = totalPlayerAngle - Math.PI / 2;
 }

 function getPlayerSpeed(){
     if(accelerate){
         return speed * 2;
     }
     if(decelerate){
         return speed * 0.5;
     }
     return speed;
 }

 function addVehicle(){
     const vehicleTypes = ["car", "truck"];

     const type = pickRandom(vehicleTypes);
     const mesh = type == "car" ? Car() : Truck();
     scene.add(mesh);

     const clockwise = Math.random() >= 0.5;
     const angle = clockwise ? Math.PI / 2 : -Math.PI / 2;

     const speed = getVehicleSpeed(type);
     
     otherVehicles.push({mesh, type, clockwise, angle, speed});
 }


 function getVehicleSpeed(type){
     if (type == "car"){
         const minimumSpeed = 1;
         const maximumSpeed = 2;
         return minimumSpeed + Math.random() * (maximumSpeed - minimumSpeed);
     }
     if(type == "truck"){
         const minimumSpeed = 0.6;
         const maximumSpeed = 1.5;
         return minimumSpeed + Math.random() * (maximumSpeed - minimumSpeed);
     }
 }
 
  function moveOtherVehicles(timeDelta){
      otherVehicles.forEach((vehicle) =>{
          if(vehicle.clockwise){
              vehicle.angle -= speed * timeDelta * vehicle.speed;
          } else{
              vehicle.angle += speed * timeDelta * vehicle.speed;
          }

          const vehicleX = Math.cos(vehicle.angle) * trackRadius + arcCenterX;
          const vehicleY = Math.sin(vehicle.angle) * trackRadius;

          const rotation = vehicle.angle + (vehicle.clockwise ? -Math.PI / 2 : Math.PI / 2);

          vehicle.mesh.position.x = vehicleX;
          vehicle.mesh.position.y = vehicleY;
          vehicle.mesh.rotation.z = rotation;
      });
  }

  function getHitZonePosition(center, angle, clockwise, distance){
      const directionAngle = angle + clockwise ? -Math.PI /2 : +Math.PI /2;
      return{
          x: center.x + Math.cos(directionAngle) * distance,
          y: center.y + Math.sin(directionAngle) * distance,
      };
  }

  function hitDetection(){
    const playerHitZone1 = getHitZonePosition(
        playerCar.position,
        playerAngleInitial + playerAngleMoved,
        true,
        15
    );
    const playerHitZone2 = getHitZonePosition(
        playerCar.position,
        playerAngleInitial + playerAngleMoved,
        true,
        -15
    );
    const hit = otherVehicles.some((vehicle) => {
        if(vehicle.type == "car"){
            const vehicleHitZone1 = getHitZonePosition(
                vehicle.mesh.position,
                vehicle.angle,
                vehicle.clockwise,
                15
            );
            const vehicleHitZone2 = getHitZonePosition(
                vehicle.mesh.position,
                vehicle.angle,
                vehicle.clockwise,
                -15
            );

            //the player hits another vehicle
            if(getDistance(playerHitZone1, vehicleHitZone1) < 40) return true;
            if(getDistance(playerHitZone1, vehicleHitZone2) < 40) return true;

            //another vehicle hits the player
            if(getDistance(playerHitZone2, vehicleHitZone1) < 40) return true;
        }
        if(vehicle.type == "truck"){ /////////////tu sa skopiowane wartosci z ifa dla car'a wiec uwaga !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            const vehicleHitZone1 = getHitZonePosition(
                vehicle.mesh.position,
                vehicle.angle,
                vehicle.clockwise,
                15
            );
            const vehicleHitZone2 = getHitZonePosition(
                vehicle.mesh.position,
                vehicle.angle,
                vehicle.clockwise,
                -15
            );
            
            //the player hits another vehicle
            if(getDistance(playerHitZone1, vehicleHitZone1) < 40) return true;
            if(getDistance(playerHitZone1, vehicleHitZone2) < 40) return true;

            //another vehicle hits the player
            if(getDistance(playerHitZone2, vehicleHitZone1) < 40) return true;
            // do zrobienia
        }
    });
    if (hit) renderer.setAnimationLoop(null); // stop animation loop
  }
  
  function getDistance(coordinate1, coordinate2){
      const horizontalDistance = coordinate2.x - coordinate1.x;
      const verticalDistance = coordinate2.y - coordinate1.y;
      return Math.sqrt(horizontalDistance ** 2 + verticalDistance ** 2);
      
  }

//car
function Car(){
    const car = new THREE.Group();

    const backWheel = new THREE.Mesh(
        new THREE.BoxBufferGeometry(12, 33, 12),
        new THREE.MeshLambertMaterial({color: 0x333333})
    );
    backWheel.position.z = 6;
    backWheel.position.x = -18;
    car.add(backWheel);

    const frontWheel = new THREE.Mesh(
        new THREE.BoxBufferGeometry(12, 33, 12),
        new THREE.MeshLambertMaterial({color: 0x333333})
    );
    frontWheel.position.z = 6;
    frontWheel.position.x = 18;
    car.add(frontWheel);

    const main = new THREE.Mesh(
        new THREE.BoxBufferGeometry(60, 30, 15),
        new THREE.MeshLambertMaterial({color: 0xa52523})
    );
    main.position.z = 12;
    car.add(main);

     ////////adjusting window textures
     const carFrontTexture = getCarFrontTexture();
     carFrontTexture.center = new THREE.Vector2(0.5, 0.5);
     carFrontTexture.rotation = Math.PI / 2;
 
     const carBackTexture = getCarFrontTexture();
     carBackTexture.center = new THREE.Vector2(0.5, 0.5);
     carBackTexture.rotation = -Math.PI / 2;
 
     const carRightSideTexture = getCarSideTexture();
     const carLeftSideTexture = getCarSideTexture();
     carLeftSideTexture.flipY = false;

    const cabin = new THREE.Mesh(
        new THREE.BoxBufferGeometry(33, 24, 12),[
            new THREE.MeshLambertMaterial({map: carFrontTexture}),
            new THREE.MeshLambertMaterial({map: carBackTexture}),
            new THREE.MeshLambertMaterial({map: carLeftSideTexture}),
            new THREE.MeshLambertMaterial({map: carRightSideTexture}),
            new THREE.MeshLambertMaterial({color: 0xffffff}), //top
            new THREE.MeshLambertMaterial({color: 0xffffff}), //bottom
        ]);
    cabin.position.z = 25.5;
    cabin.position.x = -6;
    car.add(cabin);

    return car;
}

function Truck(){
    var carObstacle = new THREE.Group();//wczesniej nie bylo tej komendy i wywalalo, a teraz respi sie truck jako tekstura, ale tak naprawde jezdzi truck widmo xD
    loader.load('objects/playerCar/scene.glb', function(gltf){
    scene.add(gltf.scene);

        //treeObj = gltf.scene;
        
        carObstacle.scale.set(0.2,0.2,0.2);
        carObstacle.rotation.x = Math.PI/2;
        carObstacle.rotation.y = Math.PI/2;
        carObstacle.position.x = 25.5
        carObstacle.position.z = 25.5
        carObstacle = gltf.scene;


    //scene.add(tree);  //to moze potem xd
}, undefined, function(error){
    console.error(error);
});


return carObstacle;
}



function Wheel(){
    const wheel = new THREE.Mesh(
        new THREE.BoxBufferGeometry(12, 33, 12),
        new THREE.MeshLambertMaterial({color: 0x333333})
    );
    wheel.position.z = 6;
    return wheel;
}

function getCarFrontTexture(){
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 32;
    const context = canvas.getContext("2d");

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, 64, 32);

    context.fillStyle = "#666666";
    context.fillRect(8, 8, 48, 24);

    return new THREE.CanvasTexture(canvas);
}

function getCarSideTexture(){
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 32;
    const context = canvas.getContext("2d");

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, 128, 32);

    context.fillStyle = "#666666";
    context.fillRect(10, 8, 38, 24);
    context.fillRect(58, 8, 60, 24);

    return new THREE.CanvasTexture(canvas);
}

function getLineMarkings(mapWidth, mapHeight){
    const canvas = document.createElement("canvas");
    canvas.width = mapWidth;
    canvas.height = mapHeight;
    const context = canvas.getContext("2d");

    context.fillStyle = "#546E90";
    context.fillRect(0, 0, mapWidth, mapHeight);

    context.lineWidth = 2;
    context.strokeStyle = "#E0FFFF";
    context.setLineDash([10, 14]);

    //Left circle
    context.beginPath();
    context.arc(
        mapWidth / 2 - arcCenterX,
        mapHeight / 2,
        trackRadius,
        0,
        Math.PI * 2
    );
    context.stroke();

    //Right circle
    context.beginPath();
    context.arc(
        mapWidth / 2 + arcCenterX,
        mapHeight / 2,
        trackRadius,
        0,
        Math.PI * 2
    );
    context.stroke();
    
    return new THREE.CanvasTexture(canvas);
}

function getLeftIsland(){
    const islandLeft = new THREE.Shape();
    islandLeft.absarc(
        -arcCenterX,
        0,
        innerTrackRadius,
        arcAngle1,
        -arcAngle1,
        false
    );

    islandLeft.absarc(
        arcCenterX,
        0,
        outerTrackRadius,
        Math.PI + arcAngle2,
        Math.PI - arcAngle2,
        true
    );
    return islandLeft;
    
}

function getMiddleIsland(){
    const islandMiddle = new THREE.Shape();

    islandMiddle.absarc(
        -arcCenterX,
        0,
        innerTrackRadius,
        arcAngle3,
        -arcAngle3,
        true
    );

    islandMiddle.absarc(
        arcCenterX,
        0,
        innerTrackRadius,
        Math.PI + arcAngle3,
        Math.PI - arcAngle3,
        true
    );
    return islandMiddle;
}

function getRightIsland(){
    const islandRight = new THREE.Shape();

    islandRight.absarc(
        arcCenterX,
        0,
        innerTrackRadius,
        Math.PI - arcAngle1,
        Math.PI + arcAngle1,
        true
    );

    islandRight.absarc(
        -arcCenterX,
        0,
        outerTrackRadius,
        -arcAngle2,
        arcAngle2,
        false
    );

    return islandRight;
}

function getOuterField(mapWidth, mapHeight){
    const field = new THREE.Shape();

    field.moveTo(-mapWidth / 2, -mapHeight / 2);
    field.lineTo(0, -mapHeight / 2);

    field.absarc(
        -arcCenterX,
        0,
        outerTrackRadius,
        -arcAngle4,
        arcAngle4,
        true
    );

    field.absarc(
        arcCenterX,
        0,
        outerTrackRadius,
        Math.PI - arcAngle4,
        Math.PI + arcAngle4,
        true
    );

    field.lineTo(0, -mapHeight / 2);
    field.lineTo(mapWidth / 2, -mapHeight / 2);
    field.lineTo(mapWidth / 2, mapHeight / 2);
    field.lineTo(-mapWidth / 2, mapHeight / 2);
    return field;
}

function renderMap(mapWidth, mapHeight){
    const lineMarkingsTexture = getLineMarkings(mapWidth, mapHeight);
    const planeGeometry  = new THREE.PlaneBufferGeometry(mapWidth, mapHeight);
    const planeMaterial  = new THREE.MeshLambertMaterial({
        map: lineMarkingsTexture,
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    scene.add(plane);

    //extruded geometry with curbs

    const islandLeft = getLeftIsland();
    const islandRight = getRightIsland();
    const islandMiddle = getMiddleIsland();
    const outerField  = getOuterField(mapWidth, mapHeight);
    
    // An extruded geometry turns a 2D shape into 3D by giving it a depth
    const fieldGeometry = new THREE.ExtrudeBufferGeometry(
        [islandLeft, islandMiddle, islandRight, outerField],
        {depth: 6, bevelEnabled: false}
    );
    const fieldMesh = new THREE.Mesh(fieldGeometry,[
        new THREE.MeshLambertMaterial({ color: 0x67c240}),
        new THREE.MeshLambertMaterial({ color: 0x23311c}),
    ]);
    scene.add(fieldMesh);

    if(config.trees){
        const tree1 = Tree();
        tree1.position.x = arcCenterX * 1.3;      // tree in the middle of right circle
        //tree1.scale.set = (20,20,20);
        //tree1.rotation.x = Math.PI/4;
        //tree1.rotation.y = Math.PI/4;
        scene.add(tree1);
        
        const tree2 = Tree();
        tree2.position.y = arcCenterX * 1.9;
        tree2.position.x = arcCenterX * 1.3;
        scene.add(tree2);
    
        const tree3 = Tree();
        tree3.position.y = arcCenterX * 0.8;
        tree3.position.x = arcCenterX * 2;
        scene.add(tree3);
    
        const tree4 = Tree();
        tree4.position.y = arcCenterX * 1.8;
        tree4.position.x = arcCenterX * 2;
        scene.add(tree4);
    
        const tree5 = Tree();
        tree5.position.y = -arcCenterX * 1;
        tree5.position.x = arcCenterX * 2;
        scene.add(tree5);
    }
}

function pickRandom(array){              /// dodac kolory? tak zeby randomowo dawalo kolory na auta itd
    return array[Math.floor(Math.random() * array.length)];
}

function Tree(){
    const tree = new THREE.Group();
    var i=0;
    for(i=0;i<6;i++){
    loader.load('objects/tree/tree.glb', function(gltf){
        
        //(gltf.scene).rotation.x = Math.PI/4;
        //(gltf.scene).rotation.y = Math.PI/4;
        //(gltf.scene).scale = 1;
      
        treeObj.scale.set(20,20,20);
        treeObj.rotation.x = Math.PI/4;
        treeObj.rotation.y = Math.PI/4;
        treeObj = gltf.scene;
//        treeObj.scale = (10,10,10);

        scene.add(gltf.scene);  
   


    //scene.add(tree);  //to moze potem xd
}

, undefined, function(error){
    console.error(error);
});
}

    tree.add(treeObj);
    return treeObj;
}





accelerateButton.addEventListener("mousedown", function(){
    startGame();
    accelerate = true;
});
decelerateButton.addEventListener("mousedown", function(){
    startGame();
    decelerate = true;
});
accelerateButton.addEventListener("mouseup", function(){
    accelerate = false;
});
decelerateButton.addEventListener("mouseup", function(){
    decelerate = false;
});



function animate(){
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
