import { Ant } from "./ant.js";

const canvas = document.getElementById("antCanvas");
const ctx = canvas.getContext("2d");
const gridSize = 200;
const loopSpeed = 1000
const colony = [];
const trailMap = new Map();

let running = false;

for (let i = 0; i < 1; i++) {
    const ant = new Ant(150, 150);
    colony.push(ant);
}

function fadeTrails(ctx, trailMap) {
    const fadeStep = 5;
    for (const [key, trailNode] of trailMap.entries()) {
        trailNode.r = Math.min(255, trailNode.r + fadeStep);
        trailNode.g = Math.min(255, trailNode.g + fadeStep);
        trailNode.b = Math.min(255, trailNode.b + fadeStep);
        trailNode.v = Math.min(255, trailNode.v - fadeStep);
        

        const [x, y] = key.split(',').map(Number);

        ctx.fillStyle = `rgb(${trailNode.r}, ${trailNode.g}, ${trailNode.b})`;
        ctx.fillRect(x, y, 1, 1);

        if (trailNode.v === 0) {
            trailMap.delete(key);
        }
    }
}

function update(ant) {
    ant.trail(ctx, trailMap);

    // ant.rotate(Math.floor(Math.random() * 3) - 1);
    ant.rotate(0);

    ant.move(gridSize, gridSize);
    ant.draw(ctx);
    ant.radarMap(trailMap);
    ant.radarDirectionFromCenter();
}

window.addEventListener("click", () => {
    if (running) return;
    running = true;

    setInterval(() => {
        colony.forEach(update);
        fadeTrails(ctx, trailMap);
    }, loopSpeed);
});
