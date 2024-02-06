import {Renderer} from './renderer.js';
import {Circle} from './circle.js';
import {Input} from './input.js';
import { rectangle } from './rectangle';

const SMALLEST_RADIUS = 10;
const dt = 1/60;

const canv = document.getElementById("canvas");
const ctx = canv.getContext("2d");

const renderer = new Renderer(canv, ctx);
const fillCol = "darkGray";
const bordCol = "black";

//inputs
const inp = new Input(canv, window, dt);
inp.resizeCanvas();
inp.addListeners();

const objects = [];
let shapeBeingMade = null;

//MAIN LOOP
function updateAndDraw() {

    //make objects
    if (inp.inputs.lclick && shapeBeingMade == null) {
        shapeBeingMade = new Circle(inp.inputs.mouse.position.clone(), SMALLEST_RADIUS, 0);
    }
    if (inp.inputs.lclick && shapeBeingMade) {
        const selectedRadius = shapeBeingMade.position.clone().subtract(inp.inputs.mouse.position).magnitude();
        shapeBeingMade.radius = selectedRadius < SMALLEST_RADIUS ? shapeBeingMade.radius : selectedRadius;
    }

    //add objects
    if (shapeBeingMade && !inp.inputs.lclick) {
        objects.push(shapeBeingMade);
        shapeBeingMade = null;
    }

    //draw objects
    renderer.clearFrame();
    renderer.drawFrame(objects, fillCol, bordCol);
    //draw shape
    if (shapeBeingMade) {
        renderer.drawRect(shapeBeingMade, bordCol, null);
    }

}
let renderInterval = setInterval(updateAndDraw, 1000 / 60);