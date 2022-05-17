import * as THREE from 'https://unpkg.com/three@0.140.2/build/three.module.js';

const scene = new THREE.Scene();
const playerCar = Car();
scene.add(playerCar);       // adding player's car to the scene

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
camera.position.set(0, 0, 300);
//camera.up.set(0, 0, 1);
camera.lookAt(0, 0, 0);

//map render

//renderMap(cameraWidth, cameraHeight * 2);


//renderer !!!!
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);


document.body.appendChild(renderer.domElement);

//renderer.render(scene, camera);          /// to niby powinno byc przed {document.body.appendChild...}

animate();

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


function renderMap(mapWidth, mapHeight){
    const lineMarkingsTexture = getLineMarkings(mapWidth, mapHeight);
    const planeGeometry  = new THREE.PlaneBufferGeometry(mapWidth, mapHeight);
    const planeMaterial  = new THREE.MeshLambertMaterial({
        color: 0x546e90,
        map: lineMarkingsTexture,
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    scene.add(plane);
}

function pickRandom(array){              /// dodac kolory? tak zeby randomowo dawalo kolory na auta itd
    return array[Math.floor(Math.random() * array.length)];
}

function animate(){
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}