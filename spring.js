export class Springs {
    constructor(k, restLength, object1, object2) {  //k = spring stiffness
        this.k = k;
        this.restLength = restLength; 
        this.object1 = object1;
        this.object2 = object2;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.object1.position.x, this.object1.position.y);
        ctx.lineTo(this.object2.position.x, this.object2.position.y);
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    addForce(object1, object2) {
        const displacement = {
        x: this.object2.position.x - this.object1.position.x,
        y: this.object2.position.y - this.object1.position.y,
        };
    }
}
