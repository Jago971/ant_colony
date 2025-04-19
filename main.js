import { Ant } from "./ant.js";

const canvas = document.getElementById("antCanvas");
const ctx = canvas.getContext("2d");
const gridSize = 200;
const colony = [];

for (let i = 0; i < 20; i++) {
    const ant = new Ant(150, 150);
    colony.push(ant);
}

function update(ant) {
    ant.trail(ctx);
    ant.rotate(Math.floor(Math.random() * 3) - 1);
    ant.move(gridSize, gridSize);
    ant.draw(ctx);
}

window.addEventListener("click", () => {
    setInterval(() => {
        colony.forEach((ant) => {
            ant.draw(ctx);
            update(ant);
        });
    }, 100);
});
