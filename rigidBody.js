import {Vec} from './vector.js';
import {Rect} from './rect.js';

export class RigidBody {
	constructor(shape) {
		this.shape = shape;   
		this.velocity = new Vec(0, 0);

		this.angularVelocity = 0.1;

		this.mass;
		this.inverseMass;
		this.density = 5;
	}	

	setMass() {
		this.mass = this.shape.calculateMass(this.density);
		this.inverseMass = 1 / this.mass;
	}

	updateShape(dt) {
		const ds = this.velocity.clone().multiply(dt);  //multiply v * dt = giving you displacement per frame
		this.shape.position.add(ds);

		this.shape.orientation += this.angularVelocity * dt;

		//update vertices and aabb of shape if it is rectangle
		if (this.shape instanceof Rect) {
			this.shape.updateVertices();
		}
		this.shape.updateAabb();
    } 

	checkTooFar (worldSize) {
		if (this.shape.position.magnitude() > worldSize) {
			return true;
		}
		if (objects[i].checkTooFar(WORLD_SIZE)) {
			objectsToRemove.push(objects[i]);
		}
	}
}
function removeObjects(objectsToRemove) {
	for (let i=0; i<objects.length; i++) {
		for (let j=0; j<objectsToRemove.length; j++) {
			if (objects[i] == objectsToRemove[j]) {
				objects.splice(i, 1);
			}
		}
	}
}