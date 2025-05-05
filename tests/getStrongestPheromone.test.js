// import { Ant } from "../ant2.js";

// const radar1 = [
//     [2, 0, 1, 0, 0],
//     [0, 0, 0, 0, 0],
//     [0, 0, 2, 0, 0],
//     [0, 0, 0, 0, 0],
//     [0, 0, 0, 0, 0],
// ];

// test("test1", () => {
//     expect(Ant.getStrongestPheromone(0, radar1)).toStrictEqual([315]);
// });

// const radar2 = [
//     [0, 0, 1, 0, 0],
//     [0, 0, 0, 0, 0],
//     [0, 0, 0, 0, 0],
//     [0, 0, 0, 0, 0],
//     [2, 0, 0, 0, 0],
// ];

// test("test2", () => {
//     expect(Ant.getStrongestPheromone(0, radar2)).toStrictEqual([0]);
// });

// const radar3 = [
//     [2, 0, 1, 0, 2],
//     [0, 0, 0, 0, 0],
//     [0, 0, 0, 0, 0],
//     [0, 0, 0, 0, 0],
//     [0, 0, 0, 0, 0],
// ];

// test("test3", () => {
//     expect(Ant.getStrongestPheromone(0, radar3)).toStrictEqual([315, 45]);
// });