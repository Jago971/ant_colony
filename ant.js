export class Ant {
  //#region Constants
  static DIRECTION = {
    UP: 0,
    UP_RIGHT: 1,
    RIGHT: 2,
    DOWN_RIGHT: 3,
    DOWN: 4,
    DOWN_LEFT: 5,
    LEFT: 6,
    UP_LEFT: 7
  };

  static RESOURCE_TYPE = {
    EMPTY: 0,
    HOME: 1,
    FOOD: 2
  };

  static DIRECTION_VECTORS = [
    [0, -1], [1, -1], [1, 0], [1, 1],
    [0, 1], [-1, 1], [-1, 0], [-1, -1]
  ];
  //#endregion

  //#region Constructor
  constructor(x, y, gridWidth, gridHeight) {
    this.x = x;
    this.y = y;
    this.direction = Ant.DIRECTION.UP_LEFT;
    this.stepCount = 0;
    this.action = "searching";

    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    this.gridIndex = (x, y) => y * gridWidth + x;

    this.resourceRadar = [];
    this.goalRadar = [];
    this.returnRadar = [];

    this.configureSettings();
  }
  //#endregion

  //#region Configuration
  configureSettings() {
    this.maxPheromoneStrength = 10;
    this.minPheromoneStrength = 0.1;
    this.pheromoneInterval = 3;
    this.decayRate = 0.01;
    this.favorStrength = 0.75;
    this.favorConcentration = 0.5;

    this.radarDiameter = 15;
    this.viewRange = 180;

    this.goalNoise = 10;
    this.randomNoise = 20;
  }
  //#endregion

  //#region Drawing
  eraseAnt(ctx) {
    ctx.clearRect(this.x, this.y, 1, 1);
  }

  drawAnt(ctx) {
    ctx.fillStyle = "black";
    ctx.fillRect(this.x, this.y, 1, 1);
  }
  //#endregion

  //#region Movement
  rotateAnt(step = 1) {
    this.direction = (this.direction + step + 8) % 8;
  }

  getOppositeDirection(direction) {
    return (direction + 4) % 8;
  }

  moveAnt(resourceGrid) {
    const [offsetX, offsetY] = Ant.DIRECTION_VECTORS[this.direction];
    const newX = this.x + offsetX;
    const newY = this.y + offsetY;

    if (
      newX >= 0 && newX < this.gridWidth &&
      newY >= 0 && newY < this.gridHeight
    ) {
      const idx = this.gridIndex(newX, newY);
      if (resourceGrid[idx] === Ant.RESOURCE_TYPE.EMPTY) {
        this.x = newX;
        this.y = newY;
      }
    }

    this.stepCount++;
  }

  moveAwayFromWall() {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;

        const currentX = this.x + dx;
        const currentY = this.y + dy;

        if (
          currentX < 0 || currentX >= this.gridWidth ||
          currentY < 0 || currentY >= this.gridHeight
        ) {
          this.direction = this.getOppositeDirection(this.direction);
          return;
        }
      }
    }
  }
  //#endregion

  //#region Pheromone Mapping
  mapPheromones(homePheremoneStrengthGrid, foodPheremoneStrengthGrid, resourceGrid) {
    if (this.stepCount % this.pheromoneInterval !== 0) return;

    const idx = this.gridIndex(this.x, this.y);
    if (resourceGrid[idx] !== Ant.RESOURCE_TYPE.EMPTY) return;

    const strength = Math.max(
      0,
      this.maxPheromoneStrength * Math.exp(-this.stepCount * this.decayRate)
    );

    if (strength <= this.minPheromoneStrength) return;

    if (this.action === "searching" && homePheremoneStrengthGrid[idx] < strength) {
      homePheremoneStrengthGrid[idx] += strength;
    } else if (this.action === "returning" && foodPheremoneStrengthGrid[idx] < strength) {
      foodPheremoneStrengthGrid[idx] += strength;
    }
  }

  updatePheromoneRadar(homePheremoneStrengthGrid, foodPheremoneStrengthGrid) {
    this.goalRadar = this._buildRadar(foodPheremoneStrengthGrid);
    this.returnRadar = this._buildRadar(homePheremoneStrengthGrid);
  }

  _buildRadar(grid) {
    const radarRadius = Math.floor(this.radarDiameter / 2);
    const result = [];

    for (let dy = -radarRadius; dy <= radarRadius; dy++) {
      const row = [];
      for (let dx = -radarRadius; dx <= radarRadius; dx++) {
        const x = this.x + dx;
        const y = this.y + dy;

        if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) {
          row.push(0);
          continue;
        }

        const idx = this.gridIndex(x, y);
        row.push(grid[idx] || 0);
      }
      result.push(row);
    }

    return result;
  }
  //#endregion

  //#region Resource Radar
  updateResourceRadar(resourceGrid) {
    const radarRadius = Math.floor(this.radarDiameter / 2);
    const targetType = this.action === "searching"
      ? Ant.RESOURCE_TYPE.FOOD
      : Ant.RESOURCE_TYPE.HOME;

    const grid = [];
    for (let dy = -radarRadius; dy <= radarRadius; dy++) {
      const row = [];
      for (let dx = -radarRadius; dx <= radarRadius; dx++) {
        const x = this.x + dx;
        const y = this.y + dy;

        if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) {
          row.push(0);
          continue;
        }

        const idx = this.gridIndex(x, y);
        row.push(resourceGrid[idx] === targetType ? 1 : 0);
      }
      grid.push(row);
    }

    this.resourceRadar = grid;
  }
  //#endregion

  //#region Radar Evaluation
  getAngle(dx, dy) {
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    angle = (angle + 90) % 360;
    if (angle < 0) angle += 360;
    return angle;
  }

  getView(angleRange, direction, radar) {
    const directionAngle = direction * 45;
    const lowerBoundary = (directionAngle - angleRange / 2 + 360) % 360;
    const upperBoundary = (directionAngle + angleRange / 2) % 360;

    const result = [];
    const centerX = Math.floor(radar[0].length / 2);
    const centerY = Math.floor(radar.length / 2);

    for (let y = 0; y < radar.length; y++) {
      for (let x = 0; x < radar[y].length; x++) {
        if (x === centerX && y === centerY) continue;

        const value = radar[y][x];
        if (value > 0) {
          const dx = x - centerX;
          const dy = y - centerY;
          const angle = this.getAngle(dx, dy);

          const inView = (
            (angle >= lowerBoundary && angle <= upperBoundary) ||
            (lowerBoundary > upperBoundary &&
              (angle >= lowerBoundary || angle <= upperBoundary))
          );

          if (inView) {
            result.push({ value, angle });
          }
        }
      }
    }

    return result;
  }

  evaluateDirection(radar, mode = "toward", viewAngle = 90) {
    const view = this.getView(viewAngle, this.direction, radar);
    const sectors = { "-1": [], "0": [], "1": [] };
    const directionDegrees = this.direction * 45;
    const sectorWidth = viewAngle / 3;

    for (let { angle, value } of view) {
      let relativeAngle = (angle - directionDegrees + 360) % 360;
      if (relativeAngle > 180) relativeAngle -= 360;

      if (relativeAngle >= -viewAngle / 2 && relativeAngle < -sectorWidth / 2) {
        sectors["-1"].push({ value, angle });
      } else if (
        relativeAngle >= -sectorWidth / 2 &&
        relativeAngle <= sectorWidth / 2
      ) {
        sectors["0"].push({ value, angle });
      } else if (
        relativeAngle > sectorWidth / 2 &&
        relativeAngle <= viewAngle / 2
      ) {
        sectors["1"].push({ value, angle });
      }
    }

    const scoreSector = (sector) => {
      if (sector.length === 0) return 0;
      const strengthSum = sector.reduce((sum, { value }) => sum + value, 0);
      const count = sector.length;
      return strengthSum * this.favorStrength + count * this.favorConcentration;
    };

    const scores = {
      "-1": scoreSector(sectors["-1"]),
      "0": scoreSector(sectors["0"]),
      "1": scoreSector(sectors["1"])
    };

    let chosen;
    if (mode === "toward") {
      chosen = Object.entries(scores).reduce(
        (a, b) => (b[1] > a[1] ? b : a),
        ["0", 0]
      );
    } else if (mode === "away") {
      chosen = Object.entries(scores).reduce(
        (a, b) => (b[1] < a[1] ? b : a),
        ["0", Infinity]
      );
    }

    const rotateStep = parseInt(chosen[0]);
    if (chosen[1] === 0) return null;

    return (this.direction + rotateStep + 8) % 8;
  }
  //#endregion

  //#region Noise and Direction Helpers
  addNoise(direction, likelyNoChange = 1) {
    if (direction === null) return null;

    likelyNoChange = Math.max(0, likelyNoChange);
    const totalWeight = likelyNoChange + 2;
    const probNoChange = likelyNoChange / totalWeight;
    const rand = Math.random();

    let change;
    if (rand < probNoChange) change = 0;
    else if (rand < probNoChange + 1 / totalWeight) change = -1;
    else change = 1;

    return (direction + change + 8) % 8;
  }

  getRandomDirection(direction, weight) {
    const directions = [
      (direction - 1 + 8) % 8,
      direction,
      (direction + 1) % 8,
    ];

    const randomValue = Math.random() * (2 + weight);

    return randomValue < weight
      ? directions[1]
      : randomValue < 2 + weight - 1
      ? directions[0]
      : directions[2];
  }
  //#endregion

  //#region Sensing and Interaction
  sense() {
    const goalRadar = this.action === "searching" ? this.goalRadar : this.returnRadar;

    const resourceDirection = this.evaluateDirection(this.resourceRadar, "toward");

    const towardGoalDirection = this.addNoise(
      this.evaluateDirection(goalRadar, "toward", this.viewRange),
      this.goalNoise
    );

    const randomDirection = this.getRandomDirection(this.direction, this.randomNoise);

    if (resourceDirection !== null) {
      this.direction = resourceDirection;
    } else if (towardGoalDirection !== null) {
      this.direction = towardGoalDirection;
    } else {
      this.direction = randomDirection;
    }
  }

  collectResource(resourceGrid, ctx) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;

        const checkX = this.x + dx;
        const checkY = this.y + dy;

        if (
          checkX >= 0 && checkX < this.gridWidth &&
          checkY >= 0 && checkY < this.gridHeight
        ) {
          const idx = this.gridIndex(checkX, checkY);
          const resourceType = resourceGrid[idx];

          if (resourceType === Ant.RESOURCE_TYPE.FOOD && this.action === "searching") {
            this.stepCount = 0;
            resourceGrid[idx] = Ant.RESOURCE_TYPE.EMPTY;
            ctx.clearRect(checkX, checkY, 1, 1);
            this.action = "returning";
            this.direction = this.getOppositeDirection(this.direction);
            return;
          } else if (resourceType === Ant.RESOURCE_TYPE.HOME && this.action === "returning") {
            this.stepCount = 0;
            this.action = "searching";
            this.direction = this.getOppositeDirection(this.direction);
            return;
          }
        }
      }
    }
  }

  updatePheromone(homePheromoneMap, foodPheromoneMap, mode = "increase") {
    const reducingMap = this.action === "searching" ? foodPheromoneMap : homePheromoneMap;
    const key = `${this.x},${this.y}`;

    if (reducingMap.has(key)) {
      const pheromone = reducingMap.get(key);
      pheromone.strength += mode === "increase" ? 1 : -1;
      reducingMap.set(key, pheromone);
    }
  }
  //#endregion
}
