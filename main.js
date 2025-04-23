import { Ant } from "./ant.js";

const canvas = document.getElementById("antCanvas");
const ctx = canvas.getContext("2d");
const gridWidth = 100;
const gridHeight = 100;
const loopSpeed = 100;
const home = {
    x: gridWidth - 10,
    y: gridHeight - 10,
    width: 10,
    color: "green",
    type: "home",
};
const food = { x: 10, y: 10, width: 10, color: "orange", type: "food" };

const colony = [];
const nestTrailMap = new Map();
const foodTrailMap = new Map();

let running = false;
let changeDirection = false;

for (let i = 0; i < 1; i++) {
    const ant = new Ant(gridWidth - 20, gridHeight - 20);
    colony.push(ant);
}

function fadeTrailMap(ctx, trailMap) {
    const fadeStep = 1;

    for (const [key, trailNode] of trailMap.entries()) {
        trailNode.strength = Math.max(0, trailNode.strength - fadeStep);

        if (trailNode.strength < 255) {
            trailNode.r = Math.min(
                255,
                trailNode.r + (trailNode.strength < 255 ? 1 : 0)
            );
            trailNode.g = Math.min(
                255,
                trailNode.g + (trailNode.strength < 255 ? 1 : 0)
            );
            trailNode.b = Math.min(
                255,
                trailNode.b + (trailNode.strength < 255 ? 1 : 0)
            );
        }

        const [x, y] = key.split(",").map(Number);
        ctx.fillStyle = `rgb(${trailNode.r}, ${trailNode.g}, ${trailNode.b})`;
        ctx.fillRect(x, y, 1, 1);

        if (trailNode.strength === 0) {
            trailMap.delete(key);
        }
    }
}

function fadeTrails(ctx, nestTrailMap, foodTrailMap) {
    fadeTrailMap(ctx, nestTrailMap);
    fadeTrailMap(ctx, foodTrailMap);
}

function update(ant) {
    ant.createTrail(nestTrailMap, foodTrailMap);
    ant.updateRadar(nestTrailMap, foodTrailMap);
    ant.sense()
    ant.getDirectionAwayFromWall(gridWidth, gridHeight)

    ant.eraseAnt(ctx);
    ant.moveAnt(gridWidth, gridHeight);
    ant.drawAnt(ctx);
}

function initialiseRescourses(ctx, arr) {
    arr.forEach((item) => {
        const half = Math.floor(item.width / 2);

        for (let dy = -half; dy <= half; dy++) {
            for (let dx = -half; dx <= half; dx++) {
                const x = item.x + dx;
                const y = item.y + dy;

                // Draw to canvas
                ctx.fillStyle = item.color;
                ctx.fillRect(x, y, 1, 1);

                // Add to trail map
                const key = `${x},${y}`;
                if (item.type === "home") {
                    nestTrailMap.set(key, { strength: 1 });
                } else if (item.type === "food") {
                    foodTrailMap.set(key, { strength: 2000 });
                }
            }
        }
    });
}

window.addEventListener("click", () => {
    if (!running) {
        running = true;
        fadeTrails(ctx, nestTrailMap, foodTrailMap);
        initialiseRescourses(ctx, [food, home]);
        colony.forEach(update);
        setInterval(() => {
            fadeTrails(ctx, nestTrailMap, foodTrailMap);
            initialiseRescourses(ctx, [food, home]);
            colony.forEach(update);
        }, loopSpeed);
    } else {
        changeDirection = !changeDirection;
    }
});
