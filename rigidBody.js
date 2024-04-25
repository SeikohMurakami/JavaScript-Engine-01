import {Vec} from './vector.js';
import {Rect} from './rect.js';

export class RigidBody {
	constructor(shape, fixed) {
		this.shape = shape;   
		this.velocity = new Vec(0, 0);
		this.acceleration = new Vec (0, 0);

		this.angularVelocity = 0;
		this.angularAcceleration = 0;

		this.mass;
		this.inverseMass;
		this.density = 5;

		this.inertia;
		this.inverseInertia;

		this.isFixed = fixed;
		
	}	

	setMass() {
		this.mass = this.shape.calculateMass(this.density);
		this.inertia = this.shape.calculateInertia(this.mass);
		
		if (this.isFixed) {
			this.inverseMass = 0;
			this.inverseInertia = 0;
		} else {
			this.inverseMass = 1 / this.mass;
			this.inverseInertia = 1 / this.mass;
		}
	}

	updateShape(dt) {
		//Linear kinematics
		this.velocity.add(this.acceleration.clone().multiply(dt));
		const ds = this.velocity.clone().multiply(dt);  //multiply v * dt = giving you displacement per frame
		this.shape.position.add(ds);

		//angular kinematics
		this.angularVelocity += this.angularAcceleration * dt;
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