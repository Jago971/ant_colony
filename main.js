import { Ant } from "./ant.js";

const canvas = document.getElementById("antCanvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const gridWidth = 500;
const gridHeight = 500;

let running = false;
const loopSpeed = 20;

const colony = [];

// Create typed arrays for resources and pheromones
const resourceGrid = new Uint8Array(gridWidth * gridHeight);
const homePheromoneStrengthGrid = new Float32Array(gridWidth * gridHeight);
const foodPheromoneStrengthGrid = new Float32Array(gridWidth * gridHeight);

// Define constants for resource types
const EMPTY = 0;
const HOME = 1;
const FOOD = 2;

const home = {
  x: gridWidth - 20,
  y: gridHeight - 20,
  type: "home", // Keep the string for backwards compatibility
  numericType: HOME, // Add numeric type
  width: 15,
  color: "green",
};

const food1 = {
  x: 20,
  y: 20,
  type: "food",
  numericType: FOOD,
  width: 25,
  color: "orange",
};

const food2 = {
  x: gridWidth - 20,
  y: 20,
  type: "food",
  numericType: FOOD,
  width: 25,
  color: "orange",
};

const food3 = {
  x: 20,
  y: gridHeight - 20,
  type: "food",
  numericType: FOOD,
  width: 25,
  color: "orange",
};

// Convert x,y coordinates to grid index
function gridIndex(x, y) {
  return y * gridWidth + x;
}

const homePheromoneMap = new Map();
const foodPheromoneMap = new Map();
const resourceMap = new Map();

function initialiseResources(ctx, resourcesArray) {
  resourcesArray.forEach((resource) => {
    const half = Math.floor(resource.width / 2);
    const resourceType = resource.type === "home" ? HOME : FOOD;

    for (let offsetY = -half; offsetY <= half; offsetY++) {
      for (let offsetX = -half; offsetX <= half; offsetX++) {
        const x = resource.x + offsetX;
        const y = resource.y + offsetY;

        if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
          // Store in typed array instead of Map
          resourceGrid[gridIndex(x, y)] = resourceType;
          
          // Still draw to canvas as before
          ctx.fillStyle = resource.color;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  });
}

// function initialiseResources(ctx, resourcesArray) {
//   resourcesArray.forEach((resource) => {
//     const half = Math.floor(resource.width / 2);

//     for (let offsetY = -half; offsetY <= half; offsetY++) {
//       for (let offsetX = -half; offsetX <= half; offsetX++) {
//         const x = resource.x + offsetX;
//         const y = resource.y + offsetY;

//         ctx.fillStyle = resource.color;
//         ctx.fillRect(x, y, 1, 1);

//         const key = `${x},${y}`;
//         resourceMap.set(key, {
//           type: resource.type,
//           color: resource.color,
//         });
//       }
//     }
//   });
// }

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

// function updatePheromones(ctx, pheromoneMap) {
//   const PheromoneFadeStep = 0.01;
//   const colorFadeStep = (255 / 10) * PheromoneFadeStep;

//   for (const [key, pheromoneNode] of pheromoneMap.entries()) {
//     pheromoneNode.strength =
//       Math.round((pheromoneNode.strength - PheromoneFadeStep) * 100) / 100;

//     if (pheromoneNode.strength <= 0) {
//       pheromoneMap.delete(key);
//       continue; // Skip rendering
//     }

//     pheromoneNode.r = Math.min(255, pheromoneNode.r + colorFadeStep);
//     pheromoneNode.g = Math.min(255, pheromoneNode.g + colorFadeStep);
//     pheromoneNode.b = Math.min(255, pheromoneNode.b + colorFadeStep);
//   }
// }

function updatePheromones() {
  const decayRate = 0.002; // Adjust for faster or slower decay

  for (let i = 0; i < gridWidth * gridHeight; i++) {
    if (homePheromoneStrengthGrid[i] > 0) {
      homePheromoneStrengthGrid[i] *= Math.exp(-decayRate);
      if (homePheromoneStrengthGrid[i] < 0.001) homePheromoneStrengthGrid[i] = 0;
    }

    if (foodPheromoneStrengthGrid[i] > 0) {
      foodPheromoneStrengthGrid[i] *= Math.exp(-decayRate);
      if (foodPheromoneStrengthGrid[i] < 0.001) foodPheromoneStrengthGrid[i] = 0;
    }
  }
}

function drawWorldImageData(ctx, resourceGrid, foodPheromoneStrengthGrid, homePheromoneStrengthGrid) {
  const imageData = ctx.createImageData(gridWidth, gridHeight);
  const data = imageData.data;
  const maxStrength = 1;

  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      const idx = y * gridWidth + x;
      const index = idx * 4;

      const resource = resourceGrid[idx];

      if (resource === FOOD) {
        // Orange for food
        data[index] = 255;
        data[index + 1] = 165;
        data[index + 2] = 0;
        data[index + 3] = 255;
        continue;
      } else if (resource === HOME) {
        // Green for home
        data[index] = 0;
        data[index + 1] = 255;
        data[index + 2] = 0;
        data[index + 3] = 255;
        continue;
      }

      const foodStrength = foodPheromoneStrengthGrid[idx];
      const homeStrength = homePheromoneStrengthGrid[idx];

      if (foodStrength <= 0 && homeStrength <= 0) {
        data[index + 3] = 0; // Transparent if nothing
        continue;
      }

      const totalStrength = foodStrength + homeStrength;
      const fadeLevel = 1 - (totalStrength / maxStrength);
      const clampedFade = Math.max(0, Math.min(1, fadeLevel));

      let r, g, b;
      if (foodStrength > 0 && homeStrength > 0) {
        const foodRatio = foodStrength / totalStrength;
        const homeRatio = homeStrength / totalStrength;
        r = 255 * foodRatio;
        g = 0;
        b = 255 * homeRatio;
      } else if (foodStrength > 0) {
        r = 255;
        g = 255 * clampedFade;
        b = 255 * clampedFade;
      } else {
        r = 255 * clampedFade;
        g = 255 * clampedFade;
        b = 255;
      }

      data[index] = Math.round(r);
      data[index + 1] = Math.round(g);
      data[index + 2] = Math.round(b);
      data[index + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}





let frameCount = 0;
let lastTime = Date.now();

window.addEventListener("click", () => {
  if (!running) {
    running = true;
    initialiseResources(ctx, [food1, food2, food3, home]);
    initialiseColony(500);

    setInterval(() => {
      const now = Date.now();
      const deltaTime = now - lastTime;

      // Update FPS every second
      if (deltaTime >= 1000) {
        const fps = frameCount; // FPS is the number of frames within 1 second
        console.log(`FPS: ${fps}`);
        frameCount = 0; // Reset frame count
        lastTime = now; // Reset the time
      }

      frameCount++; // Increment frame count

      // Main simulation loop
      updatePheromones();
      drawWorldImageData(ctx, resourceGrid, foodPheromoneStrengthGrid, homePheromoneStrengthGrid)
      
      colony.forEach(ant => {
        ant.collectResource(resourceGrid, ctx);
        ant.moveAwayFromWall(gridWidth, gridHeight);
        
        // Pass the new arrays to existing methods
        ant.updatePheromoneRadar(homePheromoneStrengthGrid, foodPheromoneStrengthGrid);
        ant.updateResourceRadar(resourceGrid);
        
        ant.mapPheromones(homePheromoneStrengthGrid, foodPheromoneStrengthGrid, resourceGrid);
        ant.sense();

        ant.eraseAnt(ctx);
        ant.moveAnt(resourceGrid);
        ant.drawAnt(ctx);
      });
      
      // Optionally draw pheromones (would need to update this function too)
    }, loopSpeed);
  }
});

