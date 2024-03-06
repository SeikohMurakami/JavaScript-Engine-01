import {Circle} from './circle.js';

export class Collisions {
	constructor() {
		this.collisions = [];
	}

    clearCollisions() {
        this.collisions = [];
    }

    narrowPhaseDetection(objects) {
        for(let i=0; i<objects.length; i++) { 
            for(let j=0; j<objects.length; j++) {
                if(j>i) {
                    //detect collisions
                    //circle collisions
                    if(objects[i].shape instanceof Circle &&
                        objects[j].shape instanceof Circle) {
                        this.detectCollisionCircleCircle(objects[i], objects[j]);    
                    }
                    //rectangle collisions
                }
            } 
        }
    }

    detectCollisionCircleCircle(o1, o2) {
        const s1 = o1.shape;
        const s2 = o2.shape;
        const dist = s1.position.distanceTo(s2.position);
        if (dist < s1.radius + s2.radius) { //the circles collide
            const overlap = s1.radius + s2.radius - dist;
            const normal = s2.position.clone().subtract(s1.position).normalize();
            this.collisions.push({
                collidedPair: [o1, o2],
                overlap: overlap,
                normal: normal  //unit vector from s1 to s2
            });
        }
    }

    pushOffObjects(o1, o2, overlap, normal) {
        o1.shape.position.subtract(normal.clone().multiply(overlap/2));
        o2.shape.position.add(normal.clone().multiply(overlap/2));
    }

    resolveCollisions() {
        let collidedPair, overlap, normal, o1, o2;
        for(let i=0; i<this.collisions.length; i++) {
            ({collidedPair, overlap, normal} = this.collisions[i]);
            [o1, o2] = collidedPair;
            this.pushOffObjects(o1, o2, overlap, normal);
        }
    }
}

