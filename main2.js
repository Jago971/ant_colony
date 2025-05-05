import { Ant } from "./ant2.js";

const canvas = document.getElementById("antCanvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const gridWidth = 200;
const gridHeight = 200;

let running = false;
const loopSpeed = 50;

const colony = [];

const home = {
    x: gridWidth - 20,
    y: gridHeight - 20,
    type: "home",
    width: 15,
    color: "green",
};

const food = {
    x: 20,
    y: 20,
    type: "food",
    width: 15,
    color: "orange",
};

const homePheromoneMap = new Map();
const foodPheromoneMap = new Map();
const resourceMap = new Map();

function initialiseResources(ctx, resourcesArray) {
    resourcesArray.forEach((resource) => {
        const half = Math.floor(resource.width / 2);

        for (let offsetY = -half; offsetY <= half; offsetY++) {
            for (let offsetX = -half; offsetX <= half; offsetX++) {
                const x = resource.x + offsetX;
                const y = resource.y + offsetY;

                ctx.fillStyle = resource.color;
                ctx.fillRect(x, y, 1, 1);

                const key = `${x},${y}`;
                resourceMap.set(key, {
                    type: resource.type,
                    color: resource.color,
                });
            }
        }
    });
}

function initialiseColony(number) {
    for (let i = 0; i < number; i++) {
        const ant = new Ant(
            gridWidth - 20,
            gridHeight - 20,
            gridWidth,
            gridHeight
        );
        colony.push(ant);
    }
}

function updateAnt(ant) {
    ant.collectResource(resourceMap, ctx)
    ant.moveAwayFromWall(gridWidth, gridHeight)
    ant.updatePheromoneRadar(homePheromoneMap, foodPheromoneMap);
    ant.updateResourceRadar(resourceMap)
    ant.mapPheromones(homePheromoneMap, foodPheromoneMap, resourceMap);
    ant.sense()

    ant.eraseAnt(ctx);
    ant.moveAnt();
    ant.drawAnt(ctx);

    
}

function updatePheromones(ctx, pheromoneMap) {
    const PheromoneFadeStep = 0.005;
    const colorFadeStep = (255 / 10) * PheromoneFadeStep;

    for (const [key, pheromoneNode] of pheromoneMap.entries()) {
        if (pheromoneNode.type === "pheromone") {
            pheromoneNode.strength =
                Math.round((pheromoneNode.strength - PheromoneFadeStep) * 10) /
                10;
            pheromoneNode.r = Math.min(255, pheromoneNode.r + colorFadeStep);
            pheromoneNode.g = Math.min(255, pheromoneNode.g + colorFadeStep);
            pheromoneNode.b = Math.min(255, pheromoneNode.b + colorFadeStep);

            const [x, y] = key.split(",");
            ctx.fillStyle = `rgb(${Math.round(pheromoneNode.r)}, ${Math.round(
                pheromoneNode.g
            )}, ${Math.round(pheromoneNode.b)})`;
            ctx.fillRect(x, y, 1, 1);
        }

        if (pheromoneNode.strength === 0) {
            pheromoneMap.delete(key);
        }
    }
}

window.addEventListener("click", () => {
    if (!running) {
        running = true;
        initialiseResources(ctx, [food, home]);

        initialiseColony(30);

        setInterval(() => {
            updatePheromones(ctx, homePheromoneMap);
            updatePheromones(ctx, foodPheromoneMap);
            colony.forEach(updateAnt);
        }, loopSpeed);
    }
});
