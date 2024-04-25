import {Vec} from './vector.js';
import {Rect} from './rect.js';

export class RigidBody {
	constructor(shape, fixed) {
		this.shape = shape;   
		this.velocity = new Vec(0, 0);

		this.angularVelocity = 0;

		this.mass;
		this.inverseMass;
		this.density = 5;

		this.isFixed = fixed;
		this.acceleration = new Vec (0, 0);
	}	

	setMass() {
		this.mass = this.shape.calculateMass(this.density);
		if (this.isFixed) {
			this.inverseMass = 0;
		} else {
			this.inverseMass = 1 / this.mass;
		}
	}

	updateShape(dt) {
		this.velocity.add(this.acceleration.clone().multiply(dt));

		const ds = this.velocity.clone().multiply(dt);  //multiply v * dt = giving you displacement per frame
		this.shape.position.add(ds);

		this.shape.orientation += this.angularVelocity * dt;

		//update vertices and aabb of shape if it is rectangle
		if (this.shape instanceof Rect) {
			this.shape.updateVertices();
		}
		this.shape.updateAabb();
    } 

	checkTooFar(worldSize) {
		if(this.shape.position.magnitude() > worldSize) {	
			return true;
		}
	}

}