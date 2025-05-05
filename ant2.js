export class Ant {
    constructor(x, y, gridWidth, gridHeight) {
        this.x = x;
        this.y = y;
        this.direction = 7;
        this.directionSetter = null;
        this.stepCount = 0;

        this.background = null;

        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;

        this.action = "searching";
        this.maxPheromoneStrength = 10;
        this.radarDiameter = 15;
        this.viewRange = 90
        this.resourceRadar = [];
        this.goalRadar = [];
        this.returnRadar = [];
    }

    directions = [
        [0, -1], // 0: up
        [1, -1], // 1: up-right
        [1, 0], // 2: right
        [1, 1], // 3: down-right
        [0, 1], // 4: down
        [-1, 1], // 5: down-left
        [-1, 0], // 6: left
        [-1, -1], // 7: up-left
    ];

    eraseAnt(ctx) {
        if (this.background) {
            ctx.putImageData(this.background, this.x, this.y);
        } else {
            this.background = ctx.getImageData(this.x, this.y, 1, 1);
        }
        //checks for background color
        // sets current coord to background color
    }

    drawAnt(ctx) {
        this.background = ctx.getImageData(this.x, this.y, 1, 1);
        ctx.fillStyle = "black";
        ctx.fillRect(this.x, this.y, 1, 1);
        // saves background color
        // sets current coord to black
    }

    rotateAnt(step = 1) {
        this.direction = (this.direction + step + 8) % 8;
        this.directionSetter = "rotateAnt";
        // returns a direction 0-7
    }

    moveAnt() {
        console.log(this.directionSetter);
        this.stepCount++;
        const [offsetX, offsetY] = this.directions[this.direction];
        this.x = Math.max(0, Math.min(this.gridWidth - 1, this.x + offsetX));
        this.y = Math.max(0, Math.min(this.gridHeight - 1, this.y + offsetY));
        // matches directions to this.direction
        // sets x and y to either the result or the boundaries of the canvas
    }

    mapPheromones(homePheromoneMap, foodPheromoneMap, resourceMap) {
        const pheromoneMap =
            this.action === "searching" ? homePheromoneMap : foodPheromoneMap;

        if (this.stepCount % 3 !== 0) return;
        const key = `${this.x},${this.y}`;

        if (resourceMap.has(key)) return;

        const color =
            this.action === "searching"
                ? { r: 0, g: 0, b: 255 }
                : { r: 255, g: 0, b: 0 };

        pheromoneMap.set(key, {
            type: "pheromone",
            strength: this.maxPheromoneStrength,
            ...color,
        });
    }

    updatePheromoneRadar(homePheromoneMap, foodPheromoneMap) {
        const radarRadius = Math.floor(this.radarDiameter / 2);

        const getRadar = (map) => {
            const grid = [];
            for (let dy = -radarRadius; dy <= radarRadius; dy++) {
                const row = [];
                for (let dx = -radarRadius; dx <= radarRadius; dx++) {
                    const x = this.x + dx;
                    const y = this.y + dy;
                    const key = `${x},${y}`;
                    const strength = map.get(key)?.strength || 0;
                    row.push(strength);
                }
                grid.push(row);
            }
            return grid;
        };

        this.goalRadar = getRadar(foodPheromoneMap);
        this.returnRadar = getRadar(homePheromoneMap);
    }

    updateResourceRadar(resourceMap) {
        const radarRadius = Math.floor(this.radarDiameter / 2);
        const targetType = this.action === "searching" ? "food" : "home";

        const getRadar = (map, type) => {
            const grid = [];
            for (let dy = -radarRadius; dy <= radarRadius; dy++) {
                const row = [];
                for (let dx = -radarRadius; dx <= radarRadius; dx++) {
                    const x = this.x + dx;
                    const y = this.y + dy;
                    const key = `${x},${y}`;
                    const match = map.get(key)?.type === type ? 1 : 0;
                    row.push(match);
                }
                grid.push(row);
            }
            return grid;
        };

        this.resourceRadar = getRadar(resourceMap, targetType);
    }

    getAngle(dx, dy) {
        // TESTED
        let angle = Math.atan2(dy, dx) * (180 / Math.PI);
        angle = (angle + 90) % 360;
        if (angle < 0) angle += 360;
        return angle;
    }

    getView(angleRange, direction, radar) {
        const directionAngle = direction * 45;
        const lowerBoundary =
            directionAngle - angleRange / 2 < 0
                ? directionAngle - angleRange / 2 + 360
                : directionAngle - angleRange / 2;
        const upperBoundary =
            directionAngle + angleRange / 2 > 360
                ? (directionAngle + angleRange / 2) % 360
                : directionAngle + angleRange / 2;

        let result = [];

        const centerX = Math.floor(radar[0].length / 2);
        const centerY = Math.floor(radar.length / 2);

        for (let y = 0; y < radar.length; y++) {
            for (let x = 0; x < radar[y].length; x++) {
                if (x === centerX && y === centerY) continue;
                const value = radar[y][x];
                if (value > 0) {
                    const dx = x - centerX;
                    const dy = y - centerY;

                    const angle = this.getAngle(dx, dy);

                    if (
                        (angle >= lowerBoundary && angle <= upperBoundary) ||
                        (lowerBoundary > upperBoundary &&
                            (angle >= lowerBoundary || angle <= upperBoundary))
                    ) {
                        result.push({
                            value,
                            angle,
                        });
                    }
                }
            }
        }
        return result;
    }

    getStrongestPheromone(direction, radar) {
        const view = this.getView(this.viewRange, direction, radar);
        let strongestPheromone = 0;
        let results = [];

        view.forEach((obj) => {
            if (obj.value > strongestPheromone) {
                strongestPheromone = obj.value;
            }
        });

        if (strongestPheromone === 0) return null;

        view.forEach((obj) => {
            if (obj.value === strongestPheromone) {
                results.push(obj.angle);
            }
        });
        return results;
    }

    getWeakestPheromone(direction, radar) {
        const view = this.getView(this.viewRange, direction, radar);
        let weakestSignal = Infinity;
        let results = [];

        view.forEach((obj) => {
            if (obj.value < weakestSignal) {
                weakestSignal = obj.value;
            }
        });

        if (weakestSignal === Infinity) return null;

        view.forEach((obj) => {
            if (obj.value === weakestSignal) {
                results.push(obj.angle);
            }
        });
        return results;
    }

    getPheromoneDirection(direction, radar, mode = "weakest") {
        const pheromoneAngles =
            mode === "weakest"
                ? this.getWeakestPheromone(direction, radar)
                : this.getStrongestPheromone(direction, radar);
        if (pheromoneAngles === null) return null;

        // If no angles, return the original direction
        if (pheromoneAngles.length === 0) {
            return direction;
        }

        // If only one angle, use it directly
        if (pheromoneAngles.length === 1) {
            return Math.floor((pheromoneAngles[0] / 45) % 8);
        }

        // For multiple angles, use vector addition for proper circular averaging
        let sumX = 0;
        let sumY = 0;

        pheromoneAngles.forEach((angle) => {
            // Convert angle to radians
            const radians = angle * (Math.PI / 180);
            // Add vector components
            sumX += Math.cos(radians);
            sumY += Math.sin(radians);
        });

        // Convert back to angle in degrees
        let finalAngle = Math.atan2(sumY, sumX) * (180 / Math.PI);
        // Normalize to 0-360 range
        if (finalAngle < 0) finalAngle += 360;

        // Convert to direction (0-7)
        return Math.floor((finalAngle / 45) % 8);
    }

    getRandomDirection(direction, weight) {
        const directions = [
            (direction - 1 + 8) % 8,
            direction,
            (direction + 1) % 8,
        ];

        const randomValue = Math.random() * (2 + weight);

        return randomValue < weight
            ? directions[1]
            : randomValue < 2 + weight - 1
            ? directions[0]
            : directions[2];
    }

    sense() {
        const currentRadar =
            this.action === "searching" ? this.goalRadar : this.returnRadar;

        const resourceDirection = this.getPheromoneDirection(
            this.direction,
            this.resourceRadar,
            "weakest"
        );

        const pheromoneDirection = this.getPheromoneDirection(
            this.direction,
            currentRadar,
            "weakest"
        );

        if (pheromoneDirection > 7 || resourceDirection > 7)
            console.log("error!", pheromoneDirection, resourceDirection);

        const randomDirection = this.getRandomDirection(this.direction, 15);

        if (resourceDirection !== null) {
            this.direction = resourceDirection;
            this.directionSetter = "resource";
        } else if (pheromoneDirection !== null) {
            this.direction = pheromoneDirection;
            this.directionSetter = "pheromone";
        } else {
            this.direction = randomDirection;
            this.directionSetter = "random";
        }
    }

    collectResource(resourceMap, ctx) {
        const directions = [
            [-1, -1],
            [-1, 0],
            [-1, 1],
            [0, -1],
            [0, 1],
            [1, -1],
            [1, 0],
            [1, 1],
        ];

        for (const [dx, dy] of directions) {
            const checkX = this.x + dx;
            const checkY = this.y + dy;
            const key = `${checkX},${checkY}`;

            if (resourceMap.has(key)) {
                const resourceType = resourceMap.get(key).type;

                if (resourceType === "food" && this.action === "searching") {
                    this.directionSetter = "opposite searching";
                    resourceMap.delete(key);
                    ctx.clearRect(checkX, checkY, 1, 1);
                    this.action = "returning";
                    this.direction = this.getOppositeDirection(this.direction);

                    return;
                } else if (
                    resourceType === "home" &&
                    this.action === "returning"
                ) {
                    this.directionSetter = "opposite returning";
                    this.action = "searching";
                    this.direction = this.getOppositeDirection(this.direction);
                    return;
                }
            }
        }
    }

    getOppositeDirection(direction) {
        return (direction + 4) % 8;
    }

    moveAwayFromWall(gridWidth, gridHeight) {
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
                    this.direction = this.getOppositeDirection(this.direction);
                }
            }
        }
    }

    updatePheromone(homePheromoneMap, foodPheromoneMap, mode = "increase") {
        const reducingMap =
            this.action === "searching" ? foodPheromoneMap : homePheromoneMap;
        const key = `${this.x},${this.y}`;

        if (reducingMap.has(key)) {
            const pheromone = reducingMap.get(key);
            pheromone.strength = mode === "increase" ? pheromone.strength + 1 : pheromone.strength - 1
            reducingMap.set(key, pheromone);
        }
    }
}
