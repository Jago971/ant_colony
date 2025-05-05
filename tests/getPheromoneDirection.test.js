import { Ant } from "../ant2.js";

const radar1 = [
    [2, 0, 1, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 2, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
];

test("test1", () => {
    expect(Ant.getPheromoneDirection(0, radar1)).toStrictEqual(7);
});

const radar2 = [
    [0, 0, 1, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [2, 0, 0, 0, 0],
];

test("test2", () => {
    expect(Ant.getPheromoneDirection(0, radar2)).toStrictEqual(0);
});

const radar3 = [
    [2, 0, 1, 0, 2],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
];

test("test3", () => {
    expect(Ant.getPheromoneDirection(0, radar3)).toStrictEqual(0);
});

const radar4 = [
    [2, 0, 1, 0, 2],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [2, 0, 0, 0, 2],
];

test("test4", () => {
    expect(Ant.getPheromoneDirection(0, radar4)).toStrictEqual(0);
});

const radar5 = [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
];

test("test5", () => {
    expect(Ant.getPheromoneDirection(0, radar5)).toStrictEqual(null);
});

// resource test
const radar6 = [
    [1, 1, 1, 0, 0],
    [1, 1, 1, 0, 0],
    [1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
];

test("test5", () => {
    expect(Ant.getPheromoneDirection(0, radar6)).toStrictEqual(7);
});