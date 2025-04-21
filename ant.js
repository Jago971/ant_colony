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
        this.radarSize = 11;
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

            const trailMap = this.phase === "seeking" ? nestTrailMap : foodTrailMap;
            const color =
                this.phase === "seeking"
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
                strength: current.strength + 255,
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
        trail = "goal"
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

        return this.angleToDirection(angleDeg);
    }

    angleToDirection(angleDeg) {
        const normalized = (angleDeg + 360) % 360; // ensure 0–359
        const direction = Math.round(normalized / 45) % 8;

        return direction;
    }

    getTurnStep(targetDirection) {
        const current = this.direction;
        let diff = (targetDirection - current + 8) % 8;

        if (diff === 0) return 0;
        if (diff <= 4) return 1;
        return -1;
    }

    sense() {
        const goalDirection = this.getRadarSignalDirection(
            "towards",
            "weakest",
            this.phase === "seeking" ? "goal" : "return"
        );

        if (goalDirection !== null) {
            const step = this.getTurnStep(goalDirection);
            this.rotate(step);
        } else {
            const avoidReturnDirection = this.getRadarSignalDirection(
                "away",
                "strongest",
                this.phase === "seeking" ? "return" : "goal"
            );

            if (avoidReturnDirection !== null) {
                const step = this.getTurnStep(avoidReturnDirection);
                this.rotate(step);
            } else {
                const randomStep = [-1, 0, 1][Math.floor(Math.random() * 3)];
                this.rotate(randomStep);
            }
        }
    }
}
