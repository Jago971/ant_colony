import { Ant } from "./ant.js";

const canvas = document.getElementById("antCanvas");
const ctx = canvas.getContext("2d");
const gridSize = 200;
const loopSpeed = 50;

const colony = [];
const nestTrailMap = new Map();
const foodTrailMap = new Map();

let running = false;
let changeDirection = false;

for (let i = 0; i < 1; i++) {
    const ant = new Ant(150, 150);
    colony.push(ant);
}

function fadeTrailMap(ctx, trailMap) {
    const fadeStep = 1;
    
    for (const [key, trailNode] of trailMap.entries()) {
        trailNode.strength = Math.max(0, trailNode.strength - fadeStep);

        if (trailNode.strength < 255) {
            trailNode.r = Math.min(255, trailNode.r + (trailNode.strength < 255 ? 1 : 0));
            trailNode.g = Math.min(255, trailNode.g + (trailNode.strength < 255 ? 1 : 0));
            trailNode.b = Math.min(255, trailNode.b + (trailNode.strength < 255 ? 1 : 0));
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
    ant.phase = !changeDirection ? "seeking" : "returning";

    ant.erase(ctx);
    ant.trail(nestTrailMap, foodTrailMap);
    ant.updateRadar(nestTrailMap, foodTrailMap)
    ant.sense()
    ant.move(gridSize, gridSize);
    ant.draw(ctx);
}

window.addEventListener("click", () => {
    if (!running) {
        running = true;

        colony.forEach(update);
        setInterval(() => {
            fadeTrails(ctx, nestTrailMap, foodTrailMap);
            colony.forEach(update);
        }, loopSpeed);
    }
    else {
        changeDirection = !changeDirection
    }
});
