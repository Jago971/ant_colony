export class Ant {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.direction = 6;
        this.stepCount = 0;
        this.goal = "food";
        this.goalRadar = [];
        this.returnRadar = [];
        this.phase = "seeking";
        this.radarSize = 15;
        this.maxTrailStrength = 255;
        this.wallMemory = 0;
    }
    // #region basic
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

    drawAnt(context) {
        context.fillStyle = "black";
        context.fillRect(this.x, this.y, 1, 1);
    }

    eraseAnt(context) {
        context.fillStyle = "white";
        context.fillRect(this.x, this.y, 1, 1);
    }

    rotateAnt(step = 1) {
        this.direction = (this.direction + step + 8) % 8;
    }

    moveAnt(gridWidth, gridHeight) {
        this.stepCount++;
        const [offsetX, offsetY] = Ant.directions[this.direction];
        this.x = Math.max(0, Math.min(gridWidth - 1, this.x + offsetX));
        this.y = Math.max(0, Math.min(gridHeight - 1, this.y + offsetY));
    }

    // #endregion basic
    // #region utils
    convertAngleToDirection(angleDeg) {
        if (angleDeg === null) return null;
        const normalised = (angleDeg + 360) % 360; // ensure 0–359
        const direction = Math.round(normalised / 45) % 8;

        return direction;
    }

    getTurnStep(targetDirection) {
        const current = this.direction;
        let diff = (targetDirection - current + 8) % 8;

        if (diff === 0) return 0;
        if (diff <= 4) return 1;
        return -1;
    }

    getOppositeDirection(direction) {
        if (direction === null) return null;
        return (direction + 4) % 8;
    }

    addNoise(percentRange, angle) {
        // 13% of 360 = 46.8. So 13 and over introduces differing direction(45 degree segments)
        if (angle === null) return null;
        const range = (360 * percentRange) / 100;
        const halfRange = range / 2;
        const min = angle - halfRange;
        const max = angle + halfRange;

        let noisyAngle = Math.random() * (max - min) + min;
        noisyAngle = (noisyAngle + 360) % 360; // Keep result within 0–359

        return noisyAngle;
    }

    getDirectionAwayFromWall(gridWidth, gridHeight) {
        let dirX = 0;
        let dirY = 0;

        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;

                const currentX = this.x + dx;
                const currentY = this.y + dy;

                if (
                    currentX < 0 ||
                    currentX >= gridWidth ||
                    currentY < 0 ||
                    currentY >= gridHeight
                ) {
                    dirX -= dx;
                    dirY -= dy;
                }
            }
        }

        if (dirX !== 0 || dirY !== 0) {
            let angle = Math.atan2(-dirY, -dirX) * (180 / Math.PI) - 90;
            angle = (angle + 360) % 360;
            this.direction = this.convertAngleToDirection(Math.round(angle));
            this.wallMemory = 3;
            return;
        }

        this.wallMemory = Math.max(0, this.wallMemory - 1);
    }
    // #endregion utils

    createTrail(nestTrailMap, foodTrailMap) {
        if (this.stepCount % 3 === 0) {
            const key = `${this.x},${this.y}`;
            const trailMap =
                this.phase === "seeking" ? nestTrailMap : foodTrailMap;
            const color =
                this.wallMemory > 0
                    ? { r: 255, g: 255, b: 0 }
                    : this.phase === "seeking"
                    ? { r: 0, g: 0, b: 255 }
                    : { r: 255, g: 0, b: 0 };

            const current = trailMap.get(key) || {
                r: 0,
                g: 0,
                b: 0,
                strength: 0,
            };

            trailMap.set(key, {
                ...color,
                strength: (current.strength = this.maxTrailStrength),
            });
        }
    }

    updateRadar(nestTrailMap, foodTrailMap) {
        const radarRadius = Math.floor(this.radarSize / 2);

        const createRadarSnapshot = (map) => {
            const grid = [];
            for (let dy = -radarRadius; dy <= radarRadius; dy++) {
                const row = [];
                for (let dx = -radarRadius; dx <= radarRadius; dx++) {
                    const currentX = this.x + dx;
                    const currentY = this.y + dy;
                    const coordKey = `${currentX},${currentY}`;

                    if (map.has(coordKey)) {
                        const strength = map.get(coordKey).strength;
                        row.push(strength);
                    } else {
                        row.push(0);
                    }
                }
                grid.push(row);
            }
            return grid;
        };

        this.returnRadar = createRadarSnapshot(nestTrailMap);
        this.goalRadar = createRadarSnapshot(foodTrailMap);
    }

    findDirection(radar) {
        const radarSize = radar.length;
        const center = {
            i: Math.floor(radarSize / 2),
            j: Math.floor(radarSize / 2),
        };

        let smallestValue = Infinity;
        let positions = [];

        // Find the smallest non-zero value and its positions
        for (let i = 0; i < radarSize; i++) {
            for (let j = 0; j < radarSize; j++) {
                const value = radar[i][j];

                if (value > 0 && value < smallestValue) {
                    smallestValue = value;
                    positions = [{ i, j }]; // reset and store this position
                } else if (value === smallestValue) {
                    positions.push({ i, j }); // store additional positions with the same smallest value
                }
            }
        }

        if (positions.length === 0) {
            return null; // or any fallback
        }

        let totalAngle = 0;

        positions.forEach((pos) => {
            const deltaY = pos.i - center.i;
            const deltaX = pos.j - center.j;

            // Calculate angle using atan2 and convert to degrees
            let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

            // Adjust the angle by adding 90 degrees to rotate the system
            angle += 90;

            // Ensure the angle stays within the range of 0 to 360 degrees
            if (angle < 0) angle += 360; // if negative, adjust by adding 360 degrees
            if (angle >= 360) angle -= 360; // if >= 360, subtract 360 to bring it within range

            totalAngle += angle;
        });

        // Average the angle for multiple smallest values
        const averageAngle = totalAngle / positions.length;

        return averageAngle;
    }

    sense() {
        if (this.wallMemory > 0) {
            return;
        }

        const primaryRadar =
            this.phase === "seeking" ? this.goalRadar : this.returnRadar;
        const secondaryRadar =
            this.phase === "seeking" ? this.returnRadar : this.goalRadar;

        const primaryDirection = this.convertAngleToDirection(
            this.addNoise(50, this.findDirection(primaryRadar))
        );

        if (primaryDirection !== null) {
            const step = this.getTurnStep(primaryDirection);
            this.rotateAnt(step);
        } else {
            const awayFromSecondaryDirection = this.getOppositeDirection(
                this.convertAngleToDirection(
                    this.addNoise(50, this.findDirection(secondaryRadar))
                )
            );

            if (awayFromSecondaryDirection !== null) {
                const step = this.getTurnStep(awayFromSecondaryDirection);
                this.rotateAnt(step);
            } else {
                const weight = 7;
                const weightedSteps = [-1, 1, ...Array(weight).fill(0)];
                const randomStep =
                    weightedSteps[
                        Math.floor(Math.random() * weightedSteps.length)
                    ];
                this.rotateAnt(randomStep);
            }
        }
    }
}
