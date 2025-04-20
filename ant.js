export class Ant {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.direction = 6;
        this.stepCount = 0;
        this.radar = [];
        this.radarDiamater = 7;
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
            trailMap.set(`${this.x},${this.y}`, { r: 0, g: 0, b: 255, v: 255 });
            ctx.fillRect(this.x, this.y, 1, 1);
        } else {
            trailMap.set(`${this.x},${this.y}`, {
                r: 255,
                g: 255,
                b: 255,
                v: 255,
            });
        }
    }

    rotate(step = 1) {
        this.direction = (this.direction + step + 8) % 8;
    }

    move(gridWidth, gridHeight) {
        this.stepCount++;
        const [dx, dy] = Ant.directions[this.direction];
        this.x = Math.max(0, Math.min(gridWidth - 1, this.x + dx));
        this.y = Math.max(0, Math.min(gridHeight - 1, this.y + dy));
    }

    radarMap(trailMap) {
        const radar = [];
        const radarRadius = Math.floor(this.radarDiamater / 2);

        for (let dy = -radarRadius; dy <= radarRadius; dy++) {
            const row = [];
            for (let dx = -radarRadius; dx <= radarRadius; dx++) {
                const x = this.x + dx;
                const y = this.y + dy;
                const key = `${x},${y}`;
                const value =
                    trailMap.has(key) && trailMap.get(key).v
                        ? trailMap.get(key).v
                        : 0;
                row.push(value);
            }
            radar.push(row);
        }
        this.radar = radar;
        console.log(this.radar);
    }

    radarDirectionFromCenter() {
        let gradX = 0;
        let gradY = 0;
    
        const center = Math.floor(this.radarDiamater / 2);
    
        for (let y = 0; y < this.radarDiamater; y++) {
            for (let x = 0; x < this.radarDiamater; x++) {
                const v = this.radar[y][x];
                if (v === 0) continue; // skip if no signal
    
                // direction from center to this cell
                const dx = x - center;
                const dy = y - center; // In canvas, y increases downward
    
                // normalize direction (unit vector)
                const length = Math.sqrt(dx * dx + dy * dy);
                if (length === 0) continue; // skip the center itself
    
                const unitX = dx / length;
                const unitY = dy / length;
    
                // weighted by signal value
                gradX += unitX * v;
                gradY += unitY * v;
            }
        }
    
        // Calculate angle with proper rotation for your system
        // We want 0° at top, increasing clockwise (90° right, 180° down, 270° left)
        const angleRad = Math.atan2(gradY, gradX);
        
        // Convert to degrees and rotate to make 0° point up
        // atan2 returns -π to π, with 0 pointing right
        // To make 0 point up: add 90° (to rotate counterclockwise), then normalize
        const angleDeg = ((angleRad * 180 / Math.PI + 90) + 360) % 360;
        
        console.log("Direction to strongest signals:", angleDeg, "°");
    }
}
