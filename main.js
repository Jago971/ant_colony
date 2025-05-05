

const canvas = document.getElementById("antCanvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const gridWidth = 100;
const gridHeight = 100;
const loopSpeed = 200;

const colony = [];
const maxTrailStrength = 10;

const foodLocationMap = new Map();
const homeLocationMap = new Map();

const home = {
    x: gridWidth - 20,
    y: gridHeight - 20,
    color: "green",
    type: "home",
    width: 10,
};
const food = { x: 20, y: 20, color: "orange", type: "food", width: 10 };
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
    ant.getDirectionAwayFromWall(gridWidth, gridHeight);
    ant.updateRadar(nestTrailMap, foodTrailMap);
    ant.createTrail(nestTrailMap, foodTrailMap);
    ant.brain();

    ant.eraseAnt(ctx);
    ant.moveAnt(gridWidth, gridHeight);
    ant.drawAnt(ctx);
}

function initialiseRescourses(ctx, arr) {
    arr.forEach((item) => {
        const half = Math.floor(item.width / 2);

        for (let dy = -half; dy <= half; dy++) {
            for (let dx = -half; dx <= half; dx++) {
                const x = item.x + dx;
                const y = item.y + dy;

                // Draw to canvas
                ctx.fillStyle = item.color;
                ctx.fillRect(x, y, 1, 1);

                // Add to trail map
                const key = `${x},${y}`;
                if (item.type === "home") {
                    nestTrailMap.set(key, { strength: 11 });
                } else if (item.type === "food") {
                    foodTrailMap.set(key, { strength: 12 });
                }
            }
        }
    });
}

window.addEventListener("click", () => {
    if (!running) {
        running = true;
        initialiseRescourses(ctx, [food, home]);
        initialiseColony(1);

        setInterval(() => {
            fadeTrailMap(ctx, nestTrailMap);
            fadeTrailMap(ctx, foodTrailMap);

            initialiseRescourses(ctx, [food, home]);
            colony.forEach(update);
        }, loopSpeed);
    }
});
