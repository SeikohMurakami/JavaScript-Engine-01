import {Renderer} from './renderer.js';
import {Circle} from './circle.js';
import {Rect} from './rect.js';
import {Input} from './input.js';
import {RigidBody} from './rigidBody.js';
import {Collisions} from './collisions.js';
import { Vec } from './vector.js';

const WORLD_SIZE = 5000;
const SMALLEST_RADIUS = 10;
const dt = 1/60;    //time per frame
let g;

const canv = document.getElementById("canvas");
const ctx = canv.getContext("2d");

export const renderer = new Renderer(canv, ctx);
const fillCol = "darkGray";
const bordCol = "black";

const col = new Collisions();

//inputs
const inp = new Input(canv, window, dt);
inp.resizeCanvas();
inp.addListeners();

const objects = [];

//make ground
addObject(
    new Rect (
        new Vec(canv.width / 2, canv.height), 
        canv.width * 3, 
        canv.height * 0.3
    ),
    true
);

let shapeBeingMade = null;
//button variables
let shapeSelected = 'r';
const circleButton = document.getElementById("c");
const rectButton = document.getElementById("r");
circleButton.onclick = function() {
    shapeSelected = 'c';
};
rectButton.onclick = function() {
    shapeSelected = 'r';
};

//MAIN LOOP
function updateAndDraw() {

    //make objects
    if (inp.inputs.lclick && shapeBeingMade == null) {
        //lesson 03 - make rectangles with mouse
        if (shapeSelected == 'c') {
            shapeBeingMade = new Circle(inp.inputs.mouse.position.clone(), SMALLEST_RADIUS, 0);
        } else if (shapeSelected == 'r') {
            shapeBeingMade = new Rect(inp.inputs.mouse.position.clone(), SMALLEST_RADIUS*2, SMALLEST_RADIUS*2);
        }
        
    }
    //adjust radius
    if (inp.inputs.lclick && shapeBeingMade instanceof Circle) {
        const selectedRadius = shapeBeingMade.position.clone().subtract(inp.inputs.mouse.position).magnitude();
        shapeBeingMade.radius = selectedRadius < SMALLEST_RADIUS ? shapeBeingMade.radius : selectedRadius;
    } 
    //lesson 03 - adjust rectangle
    else if (inp.inputs.lclick && shapeBeingMade instanceof Rect) {
        const selectionVector = shapeBeingMade.position.clone().subtract(inp.inputs.mouse.position).absolute();
        shapeBeingMade.width = selectionVector.x > SMALLEST_RADIUS ? selectionVector.x * 2 : SMALLEST_RADIUS * 2;
        shapeBeingMade.height = selectionVector.y > SMALLEST_RADIUS ? selectionVector.y * 2 : SMALLEST_RADIUS * 2;
    }

    //add objects - lesson 03
    if (shapeBeingMade && !inp.inputs.lclick) {
        addObject(shapeBeingMade);
        shapeBeingMade = null;
    }

    //move objects with mouse
    if(!inp.inputs.lclick && inp.inputs.rclick && !inp.inputs.mouse.movedObject) {
        const closestObject = findClosestObject(objects, inp.inputs.mouse.position);
        inp.inputs.mouse.movedObject = closestObject == null ? null : closestObject;
    }
    if(!inp.inputs.rclick || inp.inputs.lclick) {
        inp.inputs.mouse.movedObject = null;
    }
    if(inp.inputs.mouse.movedObject) {
        moveObjectWithMouse(inp.inputs.mouse.movedObject);
    }

    g = 200;
    for(let i=1; i<objects.length; i++) {
        objects[i].acceleration.zero().addY(g);
    }

    const iterations = 20;
    for(let i=0; i<iterations; i++) {

        //Lesson 03 - update object positions with velocity
        for(let i=0; i<objects.length; i++) {
            objects[i].updateShape(dt/iterations);
        }

        //COLLISIONS
        col.clearCollisions();
        col.narrowPhaseDetection(objects);  //detect all possible collisions
        col.resolveCollisionsLinear();    //push off
    
    }

    //remove objects that are too far
    const objectsToRemove = [];
    for(let i=0; i<objects.length; i++) {
        const obj = objects[i];
        if(obj.checkTooFar(WORLD_SIZE)){
            objectsToRemove.push(obj);
        };
    }
    removeObjects(objectsToRemove);

    //draw objects
    renderer.clearFrame();
    renderer.drawFrame(objects, fillCol, bordCol);
    //draw shape
    if (shapeBeingMade) {
        shapeBeingMade.draw(ctx, bordCol, null);
    }
}
let renderInterval = setInterval(updateAndDraw, 1000 / 60);

function findClosestObject(objects, vector) {
    let closestObject = null;
    let distance;
    let lowestDistance = 30;
    for(let i=0; i<objects.length; i++) {
        distance = objects[i].shape.position.distanceTo(vector);
        if (distance < lowestDistance) {
            lowestDistance = distance;
            closestObject = objects[i];
        }
    }
    return closestObject;
}

function moveObjectWithMouse(object) {
    object.shape.position.copy(inp.inputs.mouse.position);
    object.velocity.copy(inp.inputs.mouse.velocity);
}

function addObject(shape, fixed = false) {
    const object = new RigidBody(shape, fixed); 
    object.setMass();
    objects.push(object);
} 

function removeObjects(objectsToRemove) {
    for(let i=0; i<objectsToRemove.length; i++) {
        for(let j=0; j<objects.length; j++) {   //search for object to remove in objects
            if (objects[j] == objectsToRemove[i]) {
                objects.splice(j, 1);
                break;
            } 
        }
    }
}

