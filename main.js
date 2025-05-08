//#region Imports
import { Ant } from "./ant.js";
//#endregion

//#region Canvas Setup
const canvas = document.getElementById("antCanvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const gridWidth = 200;
const gridHeight = 200;
//#endregion

//#region Constants
const loopSpeed = 20;

const EMPTY = 0;
const HOME = 1;
const FOOD = 2;
//#endregion

//#region Simulation State
let running = false;
const colony = [];
//#endregion

//#region Typed Arrays
const resourceGrid = new Uint8Array(gridWidth * gridHeight);
const homePheromoneStrengthGrid = new Float32Array(gridWidth * gridHeight);
const foodPheromoneStrengthGrid = new Float32Array(gridWidth * gridHeight);
//#endregion

//#region Resource Definitions
const home = {
  x: gridWidth - 10,
  y: gridHeight - 10,
  type: "home",
  numericType: HOME,
  width: 5,
  color: "green",
};

const food1 = {
  x: 20,
  y: 20,
  type: "food",
  numericType: FOOD,
  width: 20,
  color: "orange",
};

const food2 = {
  x: gridWidth - 20,
  y: 20,
  type: "food",
  numericType: FOOD,
  width: 20,
  color: "orange",
};

const food3 = {
  x: 20,
  y: gridHeight - 20,
  type: "food",
  numericType: FOOD,
  width: 20,
  color: "orange",
};
//#endregion

//#region Utility Functions
function gridIndex(x, y) {
  return y * gridWidth + x;
}
//#endregion

//#region Initialization Functions
function initialiseResources(ctx, resourcesArray) {
  resourcesArray.forEach((resource) => {
    const half = Math.floor(resource.width / 2);
    const resourceType = resource.type === "home" ? HOME : FOOD;

    for (let offsetY = -half; offsetY <= half; offsetY++) {
      for (let offsetX = -half; offsetX <= half; offsetX++) {
        const x = resource.x + offsetX;
        const y = resource.y + offsetY;

        if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
          resourceGrid[gridIndex(x, y)] = resourceType;
          ctx.fillStyle = resource.color;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  });
}

function initialiseColony(number) {
  for (let i = 0; i < number; i++) {
    const ant = new Ant(gridWidth - 1, gridHeight - 1, gridWidth, gridHeight);
    colony.push(ant);
  }
}
//#endregion

//#region Pheromone Update
function updatePheromones() {
  const decayRate = 0.002;

  for (let i = 0; i < gridWidth * gridHeight; i++) {
    if (homePheromoneStrengthGrid[i] > 0) {
      homePheromoneStrengthGrid[i] *= Math.exp(-decayRate);
      if (homePheromoneStrengthGrid[i] < 0.1) {
        homePheromoneStrengthGrid[i] = 0;
      }
    }

    if (foodPheromoneStrengthGrid[i] > 0) {
      foodPheromoneStrengthGrid[i] *= Math.exp(-decayRate);
      if (foodPheromoneStrengthGrid[i] < 0.1) {
        foodPheromoneStrengthGrid[i] = 0;
      }
    }
  }
}
//#endregion

//#region World Rendering
function drawWorldImageData(
  ctx,
  resourceGrid,
  foodPheromoneStrengthGrid,
  homePheromoneStrengthGrid
) {
  const imageData = ctx.createImageData(gridWidth, gridHeight);
  const data = imageData.data;
  const maxStrength = 1;

  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      const idx = y * gridWidth + x;
      const index = idx * 4;
      const resource = resourceGrid[idx];

      if (resource === FOOD) {
        data[index] = 255;
        data[index + 1] = 165;
        data[index + 2] = 0;
        data[index + 3] = 255;
        continue;
      } else if (resource === HOME) {
        data[index] = 0;
        data[index + 1] = 255;
        data[index + 2] = 0;
        data[index + 3] = 255;
        continue;
      }

      const foodStrength = foodPheromoneStrengthGrid[idx];
      const homeStrength = homePheromoneStrengthGrid[idx];

      if (foodStrength <= 0 && homeStrength <= 0) {
        data[index + 3] = 0;
        continue;
      }

      const r = Math.min(255, (foodStrength / maxStrength) * 255);
      const b = Math.min(255, (homeStrength / maxStrength) * 255);
      const a = Math.min(255, ((foodStrength + homeStrength) / maxStrength) * 255);

      data[index] = Math.round(r);
      data[index + 1] = 0;
      data[index + 2] = Math.round(b);
      data[index + 3] = Math.round(a);
    }
  }

  ctx.putImageData(imageData, 0, 0);
}
//#endregion

//#region Performance Tracking
let frameCount = 0;
let lastTime = Date.now();
//#endregion

//#region Simulation Loop
window.addEventListener("click", () => {
  if (!running) {
    running = true;

    initialiseResources(ctx, [food1, food2, food3, home]);
    initialiseColony(200);

    setInterval(() => {
      const now = Date.now();
      const deltaTime = now - lastTime;

      if (deltaTime >= 1000) {
        const fps = frameCount;
        console.log(`FPS: ${fps}`);
        frameCount = 0;
        lastTime = now;
      }
      frameCount++;

      updatePheromones();
      drawWorldImageData(
        ctx,
        resourceGrid,
        foodPheromoneStrengthGrid,
        homePheromoneStrengthGrid
      );

      colony.forEach((ant) => {
        ant.collectResource(resourceGrid, ctx);
        ant.moveAwayFromWall(gridWidth, gridHeight);
        ant.updatePheromoneRadar(
          homePheromoneStrengthGrid,
          foodPheromoneStrengthGrid
        );
        ant.updateResourceRadar(resourceGrid);
        ant.mapPheromones(
          homePheromoneStrengthGrid,
          foodPheromoneStrengthGrid,
          resourceGrid
        );
        ant.sense();
        ant.eraseAnt(ctx);
        ant.moveAnt(resourceGrid);
        ant.drawAnt(ctx);
      });
    }, loopSpeed);
  }
});
//#endregion
