export class Ant {
    constructor(x, y, maxTrailStrength) {
        this.x = x;
        this.y = y;
        this.stepCount = 0;
        this.direction = 0;
        this.underAnt = null;
        this.sensorDiameter = 7;
        this.action = "searching";
        this.wallMemory = 0;
        this.goalRadar = null;
        this.returnRadar = null;
        this.radarDiameter = 15;
        this.maxTrailStrength = maxTrailStrength;
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
    // #region ant graphics
    eraseAnt(ctx) {
        if (this.underAnt) {
            ctx.putImageData(this.underAnt, this.x, this.y);
        }
    }

    drawAnt(ctx) {
        this.underAnt = ctx.getImageData(this.x, this.y, 1, 1);
        ctx.fillStyle = "black";
        ctx.fillRect(this.x, this.y, 1, 1);
    }
    // #endregion ant graphics
    // #region ant movement
    rotateAnt(step = 1) {
        this.direction = (this.direction + step + 8) % 8;
    }

    moveAnt(gridWidth, gridHeight) {
        this.stepCount++;
        const [offsetX, offsetY] = Ant.directions[this.direction];
        this.x = Math.max(0, Math.min(gridWidth - 1, this.x + offsetX));
        this.y = Math.max(0, Math.min(gridHeight - 1, this.y + offsetY));
    }
    // #endregion ant movement
    // #region get-directions
    getTurnDirectionStep(targetDirection) {
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
            this.wallMemory = 1;
            return;
        }

        this.wallMemory = Math.max(0, this.wallMemory - 1);
    }
    // #region utils
    convertAngleToDirection(angleDeg) {
        if (angleDeg === null) return null;
        const normalised = (angleDeg + 360) % 360; // ensure 0–359
        const direction = Math.round(normalised / 45) % 8;

        return direction;
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
    // #region ant actions
    checkNextToResource(nestTrailMap, foodTrailMap) {
        const resourceSignal =
            this.action === "searching" ? this.foodCode : this.homeCode;
        const resourceRadar =
            this.action === "searching" ? foodTrailMap : nestTrailMap;

        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const currentX = this.x + dx;
                const currentY = this.y + dy;
                const coordKey = `${currentX},${currentY}`;

                if (resourceRadar.has(coordKey)) {
                    if (
                        resourceRadar.get(coordKey).strength === resourceSignal
                    ) {
                        // Switch the action based on the current action
                        this.action =
                            this.action === "searching"
                                ? "returning"
                                : "searching";
                        break; // Stop checking once we contact a resource
                    }
                }
            }
        }
    }

    createTrail(nestTrailMap, foodTrailMap) {
        if (this.stepCount % 3 === 0) {
            const trailMap =
                this.action === "searching" ? nestTrailMap : foodTrailMap;

            const key = `${this.x},${this.y}`;
            const color =
                this.wallMemory > 0
                    ? { r: 255, g: 255, b: 0 }
                    : this.action === "searching"
                    ? { r: 0, g: 0, b: 255 }
                    : { r: 255, g: 0, b: 0 };

            trailMap.set(key, {
                ...color,
                strength: this.maxTrailStrength,
            });
        }
    }
    // #endregion ant actions

    updateRadar(nestTrailMap, foodTrailMap) {
        const radarRadius = Math.floor(this.radarDiameter / 2);

        const getRadar = (map) => {
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

        this.returnRadar = getRadar(nestTrailMap);
        this.goalRadar = getRadar(foodTrailMap);
    }

    sensor(radar) {
        const directionAngle = 2 * 45; // e.g. 3→135°
        const sensorRange = 180;
        const halfRange = sensorRange / 2; // ±90°
        const leftSensor = [],
            middleSensor = [],
            rightSensor = [];
        const cx = Math.floor(this.radarDiameter / 2),
            cy = Math.floor(this.radarDiameter / 2);

        for (let y = 0; y < this.radarDiameter; y++) {
            for (let x = 0; x < this.radarDiameter; x++) {
                const value = radar[y][x];
                if (value <= 0) continue;

                const dx = x - cx,
                    dy = cy - y;
                if (dx === 0 && dy === 0) continue;

                // 1) rawAngle: 0=→,90=↑,180=←,270=↓
                let rawAngle = Math.atan2(dy, dx) * (180 / Math.PI);
                if (rawAngle < 0) rawAngle += 360;

                // 2) rotate zero: 0=↑,90=→,180=↓,270=←
                let angle = (90 - rawAngle + 360) % 360;

                // 3) relative to your facing dir, in –180..+180
                let rel = ((angle - directionAngle + 540) % 360) - 180;

                if (Math.abs(rel) <= halfRange) {
                    if (Math.abs(rel) <= halfRange / 3) {
                        middleSensor.push({ x, y, value, angle });
                    } else if (rel < 0) {
                        leftSensor.push({ x, y, value, angle });
                    } else {
                        rightSensor.push({ x, y, value, angle });
                    }
                }
            }
        }

        console.log("L:", leftSensor, "M:", middleSensor, "R:", rightSensor);
    }
}

// export class Ant {

//     averageTwoAngles(angle1, angle2) {

//         if(angle1 === null && angle2 === null) return null
//         // Convert both to radians
//         const rad1 = (angle1 * Math.PI) / 180;
//         const rad2 = (angle2 * Math.PI) / 180;

//         // Convert to unit vectors and sum
//         const x = Math.cos(rad1) + Math.cos(rad2);
//         const y = Math.sin(rad1) + Math.sin(rad2);

//         // Average direction from summed vector
//         const avgRad = Math.atan2(y, x);
//         const avgDeg = ((avgRad * 180) / Math.PI + 360) % 360;

//         return avgDeg;
//     }
//     // #endregion utils

//     findDirection(radar) {
//         const radarSize = radar.length;
//         const center = {
//             i: Math.floor(radarSize / 2),
//             j: Math.floor(radarSize / 2),
//         };

//         let smallestValue = Infinity;
//         let positions = [];

//         // Step 1: Find the smallest non-zero value in the grid
//         for (let i = 0; i < radarSize; i++) {
//             for (let j = 0; j < radarSize; j++) {
//                 const value = radar[i][j];

//                 if (value > 0 && value < smallestValue) {
//                     smallestValue = value;
//                 }
//             }
//         }

//         // Step 2: Find all positions that have the smallest value
//         for (let i = 0; i < radarSize; i++) {
//             for (let j = 0; j < radarSize; j++) {
//                 const value = radar[i][j];

//                 // Only push positions with the smallest value
//                 if (value === smallestValue) {
//                     positions.push({ i, j });
//                 }
//             }
//         }

//         if (positions.length === 0) {
//             return null; // or any fallback
//         }

//         let totalAngle = 0;

//         positions.forEach((pos) => {
//             const deltaY = pos.i - center.i;
//             const deltaX = pos.j - center.j;

//             // Calculate angle using atan2 and convert to degrees
//             let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

//             // Adjust the angle by adding 90 degrees to rotate the system
//             angle += 90;

//             // Ensure the angle stays within the range of 0 to 360 degrees
//             if (angle < 0) angle += 360; // if negative, adjust by adding 360 degrees
//             if (angle >= 360) angle -= 360; // if >= 360, subtract 360 to bring it within range

//             totalAngle += angle;
//         });

//         // Average the angle for multiple smallest values
//         const averageAngle = totalAngle / positions.length;

//         return averageAngle;
//     }

//     sense() {
//         if (this.wallMemory > 0) {
//             return;
//         }

//         const primaryRadar =
//             this.action === "seeking" ? this.goalRadar : this.returnRadar;
//         const secondaryRadar =
//             this.action === "seeking" ? this.returnRadar : this.goalRadar;

//         const primaryDirection = this.convertAngleToDirection(
//             this.addNoise(
//                 15,
//                 this.averageTwoAngles(this.findDirection(primaryRadar), this.calculateWeightedAngleFromCenter(primaryRadar))
//                 // this.findDirection(primaryRadar)
//             )
//         );
//         console.log(this.findDirection(primaryRadar), this.calculateWeightedAngleFromCenter(primaryRadar), this.averageTwoAngles(this.findDirection(primaryRadar), this.calculateWeightedAngleFromCenter(primaryRadar)))

//         if (primaryDirection !== null) {
//             const step = this.getTurnStep(primaryDirection);
//             this.rotateAnt(step);
//         } else {
//             const awayFromSecondaryDirection = this.getOppositeDirection(
//                 this.convertAngleToDirection(
//                     this.addNoise(
//                         30,
//                         this.calculateWeightedAngleFromCenter(secondaryRadar)
//                     )
//                 )
//             );

//             if (awayFromSecondaryDirection !== null) {
//                 const step = this.getTurnStep(awayFromSecondaryDirection);
//                 this.rotateAnt(step);
//             } else {
//                 const weight = 7;
//                 const weightedSteps = [-1, 1, ...Array(weight).fill(0)];
//                 const randomStep =
//                     weightedSteps[
//                         Math.floor(Math.random() * weightedSteps.length)
//                     ];
//                 this.rotateAnt(randomStep);
//             }
//         }

//         // const primaryRadar =
//         //     this.action === "seeking" ? this.goalRadar : this.returnRadar;
//         // const secondaryRadar =
//         //     this.action === "seeking" ? this.returnRadar : this.goalRadar;

//         // const primaryDirection = this.convertAngleToDirection(
//         //     this.addNoise(15, this.findDirection(primaryRadar))
//         // );

//         // if (primaryDirection !== null) {
//         //     const step = this.getTurnStep(primaryDirection);
//         //     this.rotateAnt(step);
//         // } else {
//         //     const awayFromSecondaryDirection = this.getOppositeDirection(
//         //         this.convertAngleToDirection(
//         //             this.addNoise(50, this.findDirection(secondaryRadar))
//         //         )
//         //     );

//         //     if (awayFromSecondaryDirection !== null) {
//         //         const step = this.getTurnStep(awayFromSecondaryDirection);
//         //         this.rotateAnt(step);
//         //     } else {
//         //         const weight = 7;
//         //         const weightedSteps = [-1, 1, ...Array(weight).fill(0)];
//         //         const randomStep =
//         //             weightedSteps[
//         //                 Math.floor(Math.random() * weightedSteps.length)
//         //             ];
//         //         this.rotateAnt(randomStep);
//         //     }
//         // }
//     }

//     calculateWeightedAngleFromCenter(grid) {
//         const rows = grid.length;
//         if (rows === 0) return null;

//         const cols = grid[0].length;
//         if (rows !== cols) {
//             throw new Error("Grid must be square");
//         }

//         // Find the center coordinates
//         const centerY = Math.floor(rows / 2);
//         const centerX = Math.floor(cols / 2);

//         let totalWeight = 0;
//         let weightedSumSin = 0;
//         let weightedSumCos = 0;

//         // Process each cell in the grid
//         for (let y = 0; y < rows; y++) {
//             for (let x = 0; x < cols; x++) {
//                 // Skip the center point
//                 if (x === centerX && y === centerY) continue;

//                 const value = grid[y][x];

//                 // Skip if value is 0 or negative
//                 if (value <= 0) continue;

//                 // Calculate displacement from center
//                 const dx = x - centerX;
//                 const dy = centerY - y; // Flip y since grid indices increase downward

//                 // Calculate angle for this point (0° is up)
//                 const angle = Math.atan2(dx, dy);

//                 // Add weighted contribution of angle
//                 weightedSumSin += Math.sin(angle) * value;
//                 weightedSumCos += Math.cos(angle) * value;
//                 totalWeight += value;
//             }
//         }

//         // Return null if no positive values were found (except possibly at center)
//         if (totalWeight === 0) return null;

//         // Calculate the average angle using the weighted sums
//         let avgAngle = Math.atan2(weightedSumSin, weightedSumCos);

//         // Convert to degrees and normalize to 0-360 range
//         let angleDeg = avgAngle * (180 / Math.PI);
//         if (angleDeg < 0) {
//             angleDeg += 360;
//         }

//         return Math.round(angleDeg);
//     }
// }
