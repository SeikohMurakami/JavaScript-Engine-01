import {Vec} from './vector.js';

export class Calc {
    constructor() {
        this.verySmallAmount = 0.05;
    }

    checkNearlyEqual (a, b) {
        return Math.abs(a - b) < this.verySmallAmount; //true or false
    }

    checkNearlyEqualVectors(v1, v2) {
        return v1.distanceTo(v2) < this.verySmallAmount;
    }

    averageVector(vectors) {
        const n = vectors.length;
        const average = new Vec(0, 0);
        for (let i=0; i<n; i++) {
            average.add(vectors[i]);
        }
        return average.divide(n);
    }
}