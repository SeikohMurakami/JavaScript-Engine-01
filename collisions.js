import {Circle} from './circle.js';
import {Rect} from './rect.js';
import {renderer} from './main.js';
import {calc} from './main.js';

export class Collisions {
    constructor() {
        this.collisions = [];
        this.e = 0.5;   //between 0 and 1
        this.kf = 0.5;  //friction
        this.sf = 0.8   //friction, has to be more than kf
    }

    clearCollisions() {
        this.collisions = [];
    }

    narrowPhaseDetection(objects) {
        for (let i=0; i<objects.length; i++) {
            for (let j=0; j<objects.length; j++) {  //try j=i+1
                if(j > i) {
                    //detect collisions
                    if(objects[i].shape instanceof Circle && 
                        objects[j].shape instanceof Circle) {
                        this.detectCollisionCircleCircle(objects[i], objects[j]);
                    }  
                    else if (objects[i].shape instanceof Circle && 
                        objects[j].shape instanceof Rect) {
                            this.detectCollisionCirclePolygon(objects[i], objects[j]);
                    }
                    else if (objects[i].shape instanceof Rect && 
                        objects[j].shape instanceof Circle) {
                            this.detectCollisionCirclePolygon(objects[j], objects[i]);
                    }
                    else if (objects[i].shape instanceof Rect && 
                        objects[j].shape instanceof Rect) {
                            this.detectCollisionPolygonPolygon(objects[i], objects[j]);
                    }
                }
            }
        }
    }

    detectCollisionCircleCircle(o1, o2) {   //o1 and o2 are rigidBodies from array objects in main
        const s1 = o1.shape;    //rigidBodies have shape circle or rectangle
        const s2 = o2.shape;    //shape has position and radius
        const dist = s1.position.distanceTo(s2.position);
        if (dist < s1.radius + s2.radius) {
            const overlap = s1.radius + s2.radius - dist;
            //unit vector from s1 to s2
            const normal = s2.position.clone().subtract(s1.position).normalize();   //unit vector(direction) normal(perpendicular) to contact surface
            const point = s1.position.clone().add(normal.clone().multiply(s1.radius-overlap/2));
            //renderer.renderedNextFrame.push(point);
            
            this.collisions.push({  //object
                collidedPair: [o1, o2], //[array]
                overlap: overlap,
                normal: normal,
                point: point,
            })
        }
    }

    //detect rectangles collisions
    detectCollisionCirclePolygon (c, p) {
        const vertices = p.shape.vertices;
        const cShape = c.shape;
        let axis, overlap, normal;

        overlap = Number.MAX_VALUE;

        for (let i=0; i<vertices.length; i++) {
            const v1 = vertices[i]; //i = 0,1,2,3
            const v2 = vertices[(i+1)%vertices.length]; //1,2,3,0

            //test closest point segment
            this.findClosestPointSegment(cShape.position, v1, v2);

            axis = v2.clone().subtract(v1).rotateCCW90().normalize();
            //we found the vector from v1 to v2, then rotated to point out of polygon, 
            //then normalized to make length 1 (unit vector)
            //find min and max projections on this axis
            const [min1, max1] = this.projectVertices(vertices, axis);
            const [min2, max2] = this.projectCircle(cShape.position, cShape.radius, axis);
            if (min1 >= max2 || min2 >= max1) {
                return; //we have separation, therefore no collision
            }

            const axisOverlap = Math.min(max2-min1, max1-min2); //find on which axis we have the smallest overlap
            if (axisOverlap < overlap) {
                overlap = axisOverlap;
                normal = axis;
            }
        }
        //also test for axis that is from the closest Vertex to the center of circle
        const closestVertex = this.findClosestVertex(vertices, cShape.position);
        axis = closestVertex.clone().subtract(cShape.position).normalize(); //axis from circle to closest vertex on polygon
        
        const [min1, max1] = this.projectVertices(vertices, axis);
        const [min2, max2] = this.projectCircle(cShape.position, cShape.radius, axis);
        if (min1 >= max2 || min2 >= max1) {
            return;
        }

        const axisOverlap = Math.min(max2-min1, max1-min2); //find on which axis we have the smallest overlap
        if (axisOverlap < overlap) {
            overlap = axisOverlap;
            normal = axis;
        }

        const vec1to2 = p.shape.position.clone().subtract(c.shape.position);  //gives correct direction for normal
        if (normal.dot(vec1to2) < 0) { 
            normal.invert();
        }

        const point = this.findContactPointCirclePolygon(cShape.position, vertices);

        this.collisions.push({
            collidedPair: [c, p],
            overlap: overlap,
            normal: normal,       //direction from c1 to c2
            point: point,
        });
    }

    projectVertices (vertices, axis) {
        let min, max;
        min = vertices[0].dot(axis);
        max = min;

        for (let i=1; i<vertices.length; i++) {
            const proj = vertices[i].dot(axis);//dot product gives us the projection
            if (proj < min) {
                min = proj;
            }
            if (proj > max) {
                max = proj;
            }
        }

        return [min, max];
    }

    projectCircle (center, radius, axis) {
        let min,max;

        const direction = axis.clone();
        const points = [
            center.clone().moveDistInDir(radius, direction),
            center.clone().moveDistInDir(-radius, direction)
        ];  //points are two points on circle along axis
        min = points[0].dot(axis);  //projection of points on axis
        max = points[1].dot(axis);
        if(min > max) {
            const t = min;
            min = max;
            max = t;    //swap min and max if they are opposite
        }
        return [min, max];
    }

    findClosestVertex (vertices, center) {  //returns the i of the closest of vertices to a center point
        let minDist = Number.MAX_VALUE;
        let vertexDist, closestVertex;
        for (let i=0; i<vertices.length; i++) {
            vertexDist = vertices[i].distanceTo(center);
            if (vertexDist < minDist) {
                minDist = vertexDist;
                closestVertex = vertices[i];
            }
        }
        return closestVertex;
    }

    //lesson 9, detect polygons collisions
    detectCollisionPolygonPolygon (o1, o2) {
        const vertices1 = o1.shape.vertices;
        const vertices2 = o2.shape.vertices;
        let smallestOverlap, collisionNormal, axis;
        smallestOverlap = Number.MAX_VALUE;

        const vector1to2 = o2.shape.position.clone().subtract(o1.shape.position);

        const edges1 = this.calculateEdges(vertices1);
        const axes1 = [];
        for (let i = 0; i < edges1.length; i++) {
            axes1.push(edges1[i].rotateCCW90().normalize());
        }
        //check if axes are not on the back side of rectangle
        for (let i = 0; i < axes1.length; i++) {
            const axis = axes1[i];
            if(axis.dot(vector1to2) < 0) {
                //axis is in the wrong direction, i.e it is on the backside of rectangle
                continue;
            }
            //calculate overlap on axis
            const { overlap, normal } = this.calculateOverlap(vertices1, vertices2, axis);
            
            if (overlap <= 0) {
                return; // Separating axis found, no collision
            } else if (overlap < smallestOverlap) {
                smallestOverlap = overlap;
                collisionNormal = normal;
            }
        }

        //object2 edges
        const vector2to1 = vector1to2.clone().invert();
        const edges2 = this.calculateEdges(vertices2);
        const axes2 = [];
        for (let i = 0; i < edges2.length; i++) {
            axes2.push(edges2[i].rotateCCW90().normalize());
        }
        for (let i = 0; i < axes2.length; i++) {
            const axis = axes2[i];
            if(axis.dot(vector2to1) < 0) {
                continue;
            }
            const { overlap, normal } = this.calculateOverlap(vertices1, vertices2, axis);
            if (overlap <= 0) {
                return;
            } else if (overlap < smallestOverlap) {
                smallestOverlap = overlap;
                collisionNormal = normal;
            }
        }
        
        const normal = this.correctNormalDirection(collisionNormal, o1, o2);

        const point = this.findContactPointPolygons(vertices1, vertices2);
        //renderer.renderedNextFrame.push(point);

        this.collisions.push({
            collidedPair: [o1, o2],
            overlap: smallestOverlap,
            normal: normal,       //direction from o1 to o2, normal points out of o1
            point: point,
        });
    }

    calculateEdges(vertices) {
        const edges = [];
        for (let i=0; i<vertices.length; i++) {
            const v1 = vertices[i]; //i = 0,1,2,3
            const v2 = vertices[(i+1)%vertices.length]; //1,2,3,0
            edges.push(v2.clone().subtract(v1));
        }
        return edges;
    }

    calculateOverlap(vertices1, vertices2, axis) {
        const [min1, max1] = this.projectVertices(vertices1, axis);
        const [min2, max2] = this.projectVertices(vertices2, axis);

        if (min1 >= max2 || min2 >= max1) {
            return {
                overlap: 0,
                normal: null
            }
        }
        return {
            overlap: Math.min(max2-min1, max1-min2),
            normal: axis.clone(),
        };
    }

    correctNormalDirection(normal, o1, o2) {
        const vecO1O2 = o2.shape.position.clone().subtract(o1.shape.position);
        const dot = normal.dot(vecO1O2);
        if (dot >= 0) {
            return normal;
        } else {
            return normal.invert();
        }
    }

    findClosestPointSegment(p, a, b) {
        const vAB = b.clone().subtract(a);  //vector from point a to point b
        const vAP = p.clone().subtract(a);

        const proj = vAB.dot(vAP);
        const d = proj / vAB.magnitude() / vAB.magnitude();

        let closest;    //closest point

        if (d <= 0) {
            closest = a;
        } else if (d >= 1) {
            closest = b;
        } else {
            closest = a.clone().add(vAB.clone().multiply(d));
        }
        
        const dist = p.distanceTo(closest);
        return [closest, dist];  //explain next class
    }

    findContactPointCirclePolygon(circleCenter, polygonVertices) {
        let contact, v1, v2;
        let shortestDist = Number.MAX_VALUE;
        for (let i=0; i<polygonVertices.length; i++) {
            v1 = polygonVertices[i];
            v2 = polygonVertices[(i+1)%polygonVertices.length];
            const info = this.findClosestPointSegment(circleCenter, v1, v2);    //closest and distSq
            if(info[1] < shortestDist) {
                contact = info[0];
                shortestDist = info[1];
            }
        }
        //renderer.renderedNextFrame.push(contact);
        return contact;
    }

    findContactPointPolygons (vertices1, vertices2) {
        let contact1, contact2, p, v1, v2, minDist;
        contact2 = null;
        minDist = Number.MAX_VALUE;
        for (let i=0; i<vertices1.length; i++) {
            p = vertices1[i];
            for (let j=0; j<vertices2.length; j++) {
                v1 = vertices2[j];
                v2 = vertices2[(j+1) % vertices2.length];
                const info = this.findClosestPointSegment(p, v1, v2);
                if (calc.checkNearlyEqual(info[1], minDist) && !calc.checkNearlyEqualVectors(info[0], contact1)) {
                    contact2 = info[0];
                } else if (info[1] < minDist) {
                    contact1 = info[0];
                    minDist = info[1];
                }
            }
        }

        for (let i=0; i<vertices2.length; i++) {
            p = vertices2[i];
            for (let j=0; j<vertices1.length; j++) {
                v1 = vertices1[j];
                v2 = vertices1[(j+1) % vertices1.length];
                const info = this.findClosestPointSegment(p, v1, v2);
                if (calc.checkNearlyEqual(info[1], minDist) && !calc.checkNearlyEqualVectors(info[0], contact1)) {
                    contact2 = info[0];
                } else if (info[1] < minDist) {
                    contact1 = info[0];
                    minDist = info[1];
                }
            }
        }

        if (contact2) {
            return calc.averageVector([contact1, contact2]);
        } else {
            return contact1;
        }
    }

    pushOffObjects(o1, o2, overlap, normal) {
        if (o1.isFixed) {
            o2.shape.position.add(normal.clone().multiply(overlap));
        } else if (o2.isFixed) {
            o1.shape.position.subtract(normal.clone().multiply(overlap));
        } else {
            o1.shape.position.subtract(normal.clone().multiply(overlap/2));
            o2.shape.position.add(normal.clone().multiply(overlap/2));
        }
    }

    bounceOffObjects(o1, o2, normal) {
        const relativeVelocity = o2.velocity.clone().subtract(o1.velocity);
        if (relativeVelocity.dot(normal) > 0) {
            return;
        }
        const j = -(1 + this.e) * relativeVelocity.dot(normal) / (o1.inverseMass + o2.inverseMass); //impulse = mass x change in velocity
        const dv1 = j * o1.inverseMass;
        const dv2 = j * o2.inverseMass;
        o1.velocity.subtract(normal.clone().multiply(dv1));
        o2.velocity.add(normal.clone().multiply(dv2));
    }

    resolveCollisionsPushOff() {
        let collidedPair, overlap, normal, o1, o2;
        for(let i=0; i<this.collisions.length; i++) {
            ({collidedPair, overlap, normal} = this.collisions[i]);
            [o1, o2] = collidedPair;
            this.pushOffObjects(o1, o2, overlap, normal);
        }
    }

    resolveCollisionsBounceOff() {
        let collidedPair, overlap, normal, o1, o2;
        for(let i=0; i<this.collisions.length; i++) {
            ({collidedPair, overlap, normal} = this.collisions[i]);
            [o1, o2] = collidedPair;
            this.pushOffObjects(o1, o2, overlap, normal);
            this.bounceOffObjects(o1, o2, normal);
        }
    }

    resolveCollisionsBounceAndRotate(friction) {
        let collidedPair, overlap, normal, o1, o2, point, j;
        for(let i=0; i<this.collisions.length; i++) {
            ({collidedPair, overlap, normal, point} = this.collisions[i]);
            [o1, o2] = collidedPair;
            this.pushOffObjects(o1, o2, overlap, normal);
            j = this.bounceAndRotate(o1, o2, normal, point);
            if (friction) {
                this.addFriction(o1, o2, normal, point, j);
            }
        }
    }

    bounceAndRotate(o1, o2, normal, point) {
        //linear v from rotation at contact = r vectors from objects to contact points, rotated perp, multiplied by angVel 
        const r1 = point.clone().subtract(o1.shape.position);
        const r2 = point.clone().subtract(o2.shape.position);

        const r1Perp = r1.clone().rotateCW90();
        const r2Perp = r2.clone().rotateCW90();
        const v1 = r1Perp.clone().multiply(o1.angularVelocity);  
        const v2 = r2Perp.clone().multiply(o2.angularVelocity);

        //relative vel at contact = relative linear vel + relative rotatonal vel
        const relativeVelocity = o2.velocity.clone().add(v2).subtract(o1.velocity).subtract(v1);
        const contactVelocityNormal = relativeVelocity.dot(normal);
        if (contactVelocityNormal > 0) {
            return 0;
        }
        
        const r1PerpDotN = r1Perp.dot(normal);
        const r2PerpDotN = r2Perp.dot(normal);

        const denom = o1.inverseMass + o2.inverseMass 
        + r1PerpDotN * r1PerpDotN * o1.inverseInertia 
        + r2PerpDotN * r2PerpDotN * o2.inverseInertia;

        let j = -(1+this.e) * contactVelocityNormal;
        j /= denom;

        const impulse = normal.clone().multiply(j);

        o1.velocity.subtract(impulse.clone().multiply(o1.inverseMass));
        o1.angularVelocity -= r1.cross(impulse) * o1.inverseInertia;
        o2.velocity.add(impulse.clone().multiply(o2.inverseMass));
        o2.angularVelocity += r2.cross(impulse) * o2.inverseInertia;
    
        return j;
    }

    addFriction(o1, o2, normal, point, j) {
        //linear v from rotation at contact = r vectors from objects to contact points, rotated perp, multiplied by angVel 
        const r1 = point.clone().subtract(o1.shape.position);
        const r2 = point.clone().subtract(o2.shape.position);
        const r1Perp = r1.clone().rotateCW90();
        const r2Perp = r2.clone().rotateCW90();
        const v1 = r1Perp.clone().multiply(o1.angularVelocity);  
        const v2 = r2Perp.clone().multiply(o2.angularVelocity);

        const relativeVelocity = o2.velocity.clone().add(v2).subtract(o1.velocity).subtract(v1);
        
        const tangentVelocity = relativeVelocity.clone().subtract(normal.clone().multiply(relativeVelocity.dot(normal)));
        if (tangentVelocity.checkNearlyZero()) {
            return;
        }
        const tangent = tangentVelocity.normalize();
        
        const r1PerpDotT = r1Perp.dot(tangent);
        const r2PerpDotT = r2Perp.dot(tangent);

        const denom = o1.inverseMass + o2.inverseMass 
        + r1PerpDotT * r1PerpDotT * o1.inverseInertia 
        + r2PerpDotT * r2PerpDotT * o2.inverseInertia;

        let jt = -relativeVelocity.dot(tangent);
        jt /= denom;

        //Coloumb's law
        let frictionImpulse;
        if (Math.abs(jt) <= j * this.sf) {
            frictionImpulse = tangent.clone().multiply(jt);
        } else {
            frictionImpulse = tangent.clone().multiply(-j * this.kf);
        }
        
        o1.velocity.subtract(frictionImpulse.clone().multiply(o1.inverseMass));
        o1.angularVelocity -= r1.cross(frictionImpulse) * o1.inverseInertia;
        o2.velocity.add(frictionImpulse.clone().multiply(o2.inverseMass));
        o2.angularVelocity += r2.cross(frictionImpulse) * o2.inverseInertia;
    }
}