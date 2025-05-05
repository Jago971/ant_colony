// import { Ant } from "../ant2.js";

// const radar1 = [
//     [0, 0, 1, 0, 0],
//     [0, 0, 0, 0, 0],
//     [0, 0, 0, 0, 0],
//     [0, 0, 0, 0, 0],
//     [0, 0, 0, 0, 0],
// ];

// test("Single hit at 0deg (north) within the view range", () => {
//     expect(Ant.getView(180, 0, radar1)).toStrictEqual([{ value: 1, angle: 0 }]);
// });

// const radar2 = [
//     [0, 0, 0, 0, 0],
//     [0, 0, 0, 0, 0],
//     [0, 0, 0, 0, 1],
//     [0, 0, 0, 0, 0],
//     [0, 0, 0, 0, 0],
// ];

// test("Single hit at 90deg (east) within the view range", () => {
//     expect(Ant.getView(180, 0, radar2)).toStrictEqual([
//         { value: 1, angle: 90 },
//     ]);
// });

// const radar3 = [
//     [0, 0, 0, 0, 0],
//     [0, 0, 0, 0, 0],
//     [0, 0, 0, 0, 0],
//     [0, 0, 0, 0, 0],
//     [0, 0, 1, 0, 0],
// ];

// test("No hits within the view range (180 degrees) for a target at 270deg (west)", () => {
//     expect(Ant.getView(180, 0, radar3)).toStrictEqual([]);
// });

// const radar4 = [
//     [0, 0, 0, 0, 0],
//     [0, 0, 0, 0, 0],
//     [1, 0, 0, 0, 0],
//     [0, 0, 0, 0, 0],
//     [0, 0, 0, 0, 0],
// ];

// test("Single hit at 270deg (west) within the view range", () => {
//     expect(Ant.getView(180, 0, radar4)).toStrictEqual([
//         { value: 1, angle: 270 },
//     ]);
// });

// const radar5 = [
//     [0, 0, 0, 0, 0],
//     [0, 0, 0, 0, 0],
//     [0, 0, 0, 0, 1],
//     [0, 0, 0, 0, 0],
//     [0, 0, 0, 0, 0],
// ];

// test("Single hit at 90deg (east) within a narrower view range of 90 degrees", () => {
//     expect(Ant.getView(90, 2, radar5)).toStrictEqual([{ value: 1, angle: 90 }]);
// });

// const radar6 = [
//     [0, 0, 1, 0, 0],
//     [0, 0, 0, 0, 0],
//     [0, 0, 0, 0, 1],
//     [0, 0, 0, 0, 0],
//     [0, 0, 0, 0, 0],
// ];

// test("Single hit at 90deg (east) within a narrower view range of 90 degrees", () => {
//     expect(Ant.getView(90, 2, radar6)).toStrictEqual([{ value: 1, angle: 90 }]);
// });

// const radar7 = [
//     [1, 0, 1, 0, 1],
//     [0, 0, 0, 0, 0],
//     [0, 0, 0, 0, 0],
//     [0, 0, 0, 0, 0],
//     [0, 0, 0, 0, 0],
// ];

// test("Multiple hits within 180-degree view range: hits at 315deg (north-west), 0deg (north), and 45deg (north-east)", () => {
//     expect(Ant.getView(180, 0, radar7)).toStrictEqual([
//         { value: 1, angle: 315 },
//         { value: 1, angle: 0 },
//         { value: 1, angle: 45 },
//     ]);
// });
