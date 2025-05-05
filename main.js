import { Ant } from "./ant.js";

const canvas = document.getElementById("antCanvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const gridWidth = 200;
const gridHeight = 200;

let running = false;
const loopSpeed = 25;

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
    const ant = new Ant(gridWidth - 30, gridHeight - 30, gridWidth, gridHeight);
    colony.push(ant);
  }
}

function updateAnt(ant) {
  ant.collectResource(resourceMap, ctx);
  ant.moveAwayFromWall(gridWidth, gridHeight);
  ant.updatePheromoneRadar(homePheromoneMap, foodPheromoneMap);
  ant.updateResourceRadar(resourceMap);
  ant.mapPheromones(homePheromoneMap, foodPheromoneMap, resourceMap);
  ant.sense();

  ant.eraseAnt(ctx);
  ant.moveAnt(resourceMap);
  ant.drawAnt(ctx);
}

function updatePheromones(ctx, pheromoneMap) {
  const PheromoneFadeStep = 0.01;
  const colorFadeStep = (255 / 10) * PheromoneFadeStep;

  for (const [key, pheromoneNode] of pheromoneMap.entries()) {
    pheromoneNode.strength =
      Math.round((pheromoneNode.strength - PheromoneFadeStep) * 100) / 100;

    if (pheromoneNode.strength <= 0) {
      pheromoneMap.delete(key);
      continue; // Skip rendering
    }

    pheromoneNode.r = Math.min(255, pheromoneNode.r + colorFadeStep);
    pheromoneNode.g = Math.min(255, pheromoneNode.g + colorFadeStep);
    pheromoneNode.b = Math.min(255, pheromoneNode.b + colorFadeStep);
  }
}

function drawPheromones(ctx, foodPheromoneMap, homePheromoneMap) {
  const drawnKeys = new Set();

  // Draw food pheromones
  for (const [key, foodNode] of foodPheromoneMap.entries()) {
    if (homePheromoneMap.has(key)) {
      const homeNode = homePheromoneMap.get(key);
      const r = Math.round((foodNode.r + homeNode.r) / 2);
      const g = Math.round((foodNode.g + homeNode.g) / 2);
      const b = Math.round((foodNode.b + homeNode.b) / 2);
      const [x, y] = key.split(",");

      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(x, y, 1, 1);
    } else {
      const [x, y] = key.split(",");
      ctx.fillStyle = `rgb(${Math.round(foodNode.r)}, ${Math.round(
        foodNode.g
      )}, ${Math.round(foodNode.b)})`;
      ctx.fillRect(x, y, 1, 1);
    }
    drawnKeys.add(key);
  }

  // Draw home pheromones that weren't already drawn
  for (const [key, homeNode] of homePheromoneMap.entries()) {
    if (!drawnKeys.has(key)) {
      const [x, y] = key.split(",");
      ctx.fillStyle = `rgb(${Math.round(homeNode.r)}, ${Math.round(
        homeNode.g
      )}, ${Math.round(homeNode.b)})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

window.addEventListener("click", () => {
  if (!running) {
    running = true;
    initialiseResources(ctx, [food, home]);
    initialiseColony(10);

    setInterval(() => {
      updatePheromones(ctx, homePheromoneMap);
      updatePheromones(ctx, foodPheromoneMap);
      drawPheromones(ctx, foodPheromoneMap, homePheromoneMap)
      
      colony.forEach(updateAnt);
    }, loopSpeed);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    console.log("homePheromoneMap", homePheromoneMap);
    console.log("foodPheromoneMap", foodPheromoneMap);
    event.preventDefault();
  }
});
