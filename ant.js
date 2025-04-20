export class Ant {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.direction = 0;
        this.stepCount = 0;
    }

    static directions = [
        [0, -1], // 0: up
        [1, -1], // 1: up-right
        [1, 0], // 2: right
        [1, 1], // 3: down-right
        [0, 1], // 4: down
        [-1, 1], // 5: down-left
        [-1, 0], // 6: left
        [-1, -1], // 7: up-left
    ];

    draw(ctx, color = "black") {
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, 1, 1);
    }

    erase(ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(this.x, this.y, 1, 1);
    }

    trail(ctx, trailMap) {
        if (this.stepCount % 2 === 0) {
            trailMap.set(`${this.x},${this.y}`, { r: 0, g: 0, b: 255 });
            ctx.fillRect(this.x, this.y, 1, 1);
        } else {
            this.erase(ctx);
        }
    }

    rotate(step = 1) {
        this.direction = (this.direction + step + 8) % 8;
    }

    move(gridWidth, gridHeight) {
        console.log(this.stepCount);
        this.stepCount++;
        const [dx, dy] = Ant.directions[this.direction];
        this.x = Math.max(0, Math.min(gridWidth - 1, this.x + dx));
        this.y = Math.max(0, Math.min(gridHeight - 1, this.y + dy));
    }
}
