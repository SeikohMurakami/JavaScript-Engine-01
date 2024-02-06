export class Renderer {
    constructor(canv, ctx, objects) {
        this.canvas = canv;
        this.ctx = ctx;
        this.objects = objects;
    }

    
    
    drawRect(rect, strokeColor, fillColor) {    //in () we have the input
        this.ctx.save();            //inside {} we have code we can execute
        this.ctx.translate(rect.position.x, rect.position.y);   //translate the canvas to position of rectangle
        if (fillColor) {
            this.ctx.fillStyle = fillColor; //set colors
            this.ctx.fillRect(
                - rect.width/2,
                - rect.height/2,  
                rect.width,
                rect.height,
            );
        }
        this.ctx.strokeStyle = strokeColor;
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(
            - rect.width/2,
            - rect.height/2,
            rect.width,
            rect.height,
        );
        this.ctx.restore();  
    }

    drawFrame(objects, fillCol, bordCol) {
        for (let i = 0; i<objects.length; i++) {
            this.drawRect(objects[i], bordCol, fillCol);
        } 
    }

    clearFrame() {
        this.ctx.clearcircle(0, 0, this.canvas.width, this.canvas.height);
    }

    
}