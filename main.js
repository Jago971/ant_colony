import { Ant } from "./ant.js";

const canvas = document.getElementById("antCanvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const gridWidth = 100;
const gridHeight = 100;
const loopSpeed = 50;

const colony = [];
const maxTrailStrength = 10;

const foodLocationMap = new Map();
const homeLocationMap = new Map();
const nestTrailMap = new Map();
const foodTrailMap = new Map();

let running = false;

function initialiseColony(number) {
    for (let i = 0; i < number; i++) {
        const ant = new Ant(gridWidth - 20, gridHeight - 20, maxTrailStrength);
        colony.push(ant);
    }
}

function fadeTrailMap(ctx, trailMap) {
    const trailFadeStep = 0.1;
    const colorFadeStep = (255 / maxTrailStrength) * trailFadeStep;

    for (const [key, trailNode] of trailMap.entries()) {
        trailNode.strength =
            Math.round((trailNode.strength - trailFadeStep) * 10) / 10;
        if (trailNode.strength < 10) {
            trailNode.r = Math.min(255, trailNode.r + colorFadeStep);
            trailNode.g = Math.min(255, trailNode.g + colorFadeStep);
            trailNode.b = Math.min(255, trailNode.b + colorFadeStep);

            const [x, y] = key.split(",").map(Number);
            ctx.fillStyle = `rgb(${Math.round(trailNode.r)}, ${Math.round(
                trailNode.g
            )}, ${Math.round(trailNode.b)})`;
            ctx.fillRect(x, y, 1, 1);
        }

        if (trailNode.strength === 0) {
            trailMap.delete(key);
        }
    }
}

function update(ant) {
    ant.updateRadar(nestTrailMap, foodTrailMap);
    ant.createTrail(nestTrailMap, foodTrailMap);
    ant.sensor(ant.returnRadar)

    ant.eraseAnt(ctx);
    ant.moveAnt(gridWidth, gridHeight);
    ant.drawAnt(ctx);
}

window.addEventListener("click", () => {
    if (!running) {
        running = true;
        initialiseColony(1);

        setInterval(() => {
            fadeTrailMap(ctx, nestTrailMap);
            fadeTrailMap(ctx, foodTrailMap);
            colony.forEach(update);
        }, loopSpeed);
    }
});
