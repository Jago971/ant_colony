export class Ant {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.direction = 6;
        this.stepCount = 0;
        this.radar = [];
        this.radarDiameter = 11;
        this.signalDirection = null;
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

    draw(context, color = "black") {
        context.fillStyle = color;
        context.fillRect(this.x, this.y, 1, 1);
    }

    erase(context) {
        context.fillStyle = "white";
        context.fillRect(this.x, this.y, 1, 1);
    }

    trail(context, trailMap) {
        const key = `${this.x},${this.y}`;
        if (this.stepCount % 2 === 0) {
            trailMap.set(key, { r: 255, g: 0, b: 0, v: 255 });
            context.fillRect(this.x, this.y, 1, 1);
        } else {
            trailMap.set(key, { r: 255, g: 255, b: 255, v: 255 });
        }
    }

    rotate(step = 1) {
        this.direction = (this.direction + step + 8) % 8;
    }

    move(gridWidth, gridHeight) {
        this.stepCount++;
        const [offsetX, offsetY] = Ant.directions[this.direction];
        this.x = Math.max(0, Math.min(gridWidth - 1, this.x + offsetX));
        this.y = Math.max(0, Math.min(gridHeight - 1, this.y + offsetY));
    }

    radarMap(targetMap) {
        const radarData = [];
        const radarRadius = Math.floor(this.radarDiameter / 2);

        for (let offsetY = -radarRadius; offsetY <= radarRadius; offsetY++) {
            const row = [];
            for (
                let offsetX = -radarRadius;
                offsetX <= radarRadius;
                offsetX++
            ) {
                const checkX = this.x + offsetX;
                const checkY = this.y + offsetY;
                const key = `${checkX},${checkY}`;
                const signalValue =
                    targetMap.has(key) && targetMap.get(key).v
                        ? targetMap.get(key).v
                        : 0;
                row.push(signalValue);
            }
            radarData.push(row);
        }
        this.radar = radarData;
    }

    radarDirectionFromCenter() {
        const radar = this.radar;
        const radarSize = this.radarDiameter;
        const centerIndex = Math.floor(radarSize / 2);

        // Determine the strongest signal in the radar to use as reference
        let highestSignal = 0;
        for (let row = 0; row < radarSize; row++) {
            for (let col = 0; col < radarSize; col++) {
                if (radar[row][col] > highestSignal) {
                    highestSignal = radar[row][col];
                }
            }
        }

        if (highestSignal === 0) return null;

        let weightedX = 0;
        let weightedY = 0;

        for (let row = 0; row < radarSize; row++) {
            for (let col = 0; col < radarSize; col++) {
                const signalStrength = radar[row][col];
                if (
                    signalStrength === 0 ||
                    (col === centerIndex && row === centerIndex)
                )
                    continue;

                if (signalStrength < highestSignal) {
                    const deltaX = col - centerIndex;
                    const deltaY = row - centerIndex;
                    const distance = Math.sqrt(
                        deltaX * deltaX + deltaY * deltaY
                    );

                    if (distance === 0) continue;

                    const relativeStrength =
                        (highestSignal - signalStrength) / highestSignal;
                    const unitX = deltaX / distance;
                    const unitY = deltaY / distance;

                    weightedX += unitX * relativeStrength;
                    weightedY += unitY * relativeStrength;
                }
            }
        }

        if (weightedX === 0 && weightedY === 0) return null;

        const angleRadians = Math.atan2(weightedY, weightedX);
        const angleDegrees = ((angleRadians * 180) / Math.PI + 90 + 360) % 360;

        return angleDegrees;
    }

    aimTowardSignal() {
        const targetAngle = this.radarDirectionFromCenter();

        if (targetAngle === null || targetAngle === undefined) {
            const randomRotation = Math.floor(Math.random() * 3) - 1;
            this.rotate(randomRotation);
            return;
        }

        const currentAngle = this.direction * 45;
        let angleDifference = ((targetAngle - currentAngle + 540) % 360) - 180;

        if (Math.abs(angleDifference) < 5) return;

        const rotateStep = angleDifference > 0 ? 1 : -1;
        this.rotate(rotateStep);
    }
}
