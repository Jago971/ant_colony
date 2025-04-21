export class Ant {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.direction = 0;
        this.stepCount = 0;
        this.goal = "food";
        this.goalRadar = [];
        this.returnRadar = [];
        this.phase = "seeking";
        this.radarSize = 31;
        this.wallMemory = 0;
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

    draw(context) {
        context.fillStyle = "black";
        context.fillRect(this.x, this.y, 1, 1);
    }

    erase(context) {
        context.fillStyle = "white";
        context.fillRect(this.x, this.y, 1, 1);
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

    trail(nestTrailMap, foodTrailMap) {
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
                strength: (current.strength = 1800),
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
                        row.push(map.get(coordKey).strength);
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

    getRadarSignalDirection(
        directionBias = "towards",
        signalType = "weakest",
        trail = "goal",
        noise = 0
    ) {
        const radar = trail === "return" ? this.returnRadar : this.goalRadar;
        const radarRadius = Math.floor(this.radarSize / 2);
        let signalStrength = signalType === "strongest" ? -Infinity : Infinity;
        let targetX = 0;
        let targetY = 0;

        for (let y = 0; y < radar.length; y++) {
            for (let x = 0; x < radar[y].length; x++) {
                const cell = radar[y][x];

                if (signalType === "strongest") {
                    if (cell > signalStrength) {
                        signalStrength = cell;
                        targetX = x;
                        targetY = y;
                    }
                } else if (signalType === "weakest") {
                    if (cell > 0 && cell < signalStrength) {
                        signalStrength = cell;
                        targetX = x;
                        targetY = y;
                    }
                }
            }
        }

        if (
            signalStrength ===
            (signalType === "strongest" ? -Infinity : Infinity)
        ) {
            return null; // No signal found
        }

        const dx = targetX - radarRadius;
        const dy = targetY - radarRadius;

        if (targetX === radarRadius && targetY === radarRadius) {
            return null;
        }

        let angleRad = Math.atan2(dy, dx) + Math.PI / 2;

        if (directionBias === "away") {
            angleRad += Math.PI;
        }
        const angleDeg = ((angleRad * 180) / Math.PI + 360) % 360;
        const range = noise * 180;
        const offset = (Math.random() * 2 - 1) * range;
        let noiseyAngle = (angleDeg + offset + 360) % 360;

        return this.angleToDirection(noiseyAngle);
    }

    angleToDirection(angleDeg) {
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

    sense(home, food) {
        const distance = (a, b) => {
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            return Math.sqrt(dx * dx + dy * dy);
        };

        if (this.phase === "seeking") {
            if (distance(this, food) <= 3) {
                this.phase = "returning";
            }
        } else {
            if (distance(this, home) <= 3) {
                this.phase = "seeking";
            }
        }

        if (this.wallMemory > 0) {
            return; // Ignore sensing while avoiding wall
        }

        const goalDirection = this.getRadarSignalDirection(
            "towards",
            "weakest",
            this.phase === "seeking" ? "goal" : "return",
            0.25
        );

        if (goalDirection !== null) {
            const step = this.getTurnStep(goalDirection);
            this.rotate(step);
        } else {
            const avoidReturnDirection = this.getRadarSignalDirection(
                "away",
                "weakest",
                this.phase === "seeking" ? "return" : "goal",
                0.75
            );

            if (avoidReturnDirection !== null) {
                const step = this.getTurnStep(avoidReturnDirection);
                this.rotate(step);
            } else {
                const weight = 7;
                const weightedSteps = [-1, 1, ...Array(weight).fill(0)];
                const randomStep =
                    weightedSteps[
                        Math.floor(Math.random() * weightedSteps.length)
                    ];
                this.rotate(randomStep);
            }
            // const weight = 7;
            // const weightedSteps = [-1, 1, ...Array(weight).fill(0)];
            // const randomStep =
            //     weightedSteps[Math.floor(Math.random() * weightedSteps.length)];
            // this.rotate(randomStep);
            // console.log("random")
        }
    }

    directionAwayFromWall(gridWidth, gridHeight) {
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
            this.direction = this.angleToDirection(Math.round(angle));
            this.wallMemory = 10;
            return;
        }

        this.wallMemory = Math.max(0, this.wallMemory - 1);
    }
}
