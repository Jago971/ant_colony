import { Ant } from "./ant.js";

const canvas = document.getElementById("antCanvas");
const ctx = canvas.getContext("2d");
const gridSize = 200;
const loopSpeed = 100
const colony = [];
const trailMap = new Map();

let running = false;

for (let i = 0; i < 50; i++) {
    const ant = new Ant(150, 150);
    colony.push(ant);
}

function fadeTrails(ctx, trailMap) {
    console.log(trailMap.size);
    const fadeStep = 5;
    for (const [key, color] of trailMap.entries()) {
        color.r = Math.min(255, color.r + fadeStep);
        color.g = Math.min(255, color.g + fadeStep);
        color.b = Math.min(255, color.b + fadeStep);

        const [x, y] = key.split(',').map(Number);

        ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
        ctx.fillRect(x, y, 1, 1);

        if (color.r === 255 && color.g === 255 && color.b === 255) {
            trailMap.delete(key);
        }
    }
}

function update(ant) {
    ant.trail(ctx, trailMap);
    ant.rotate(Math.floor(Math.random() * 3) - 1);
    ant.move(gridSize, gridSize);
    ant.draw(ctx);
}

window.addEventListener("click", () => {
    if (running) return;
    running = true;

    setInterval(() => {
        colony.forEach(update);
        fadeTrails(ctx, trailMap);
    }, loopSpeed);
});
