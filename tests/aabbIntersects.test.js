import { describe, it, expect } from "vitest";
import { aabbIntersects } from "../src/systems/PhysicsSystem.js";

describe("aabbIntersects", () => {

  it("rectangles overlap", () => {
    expect(aabbIntersects(0, 0, 10, 10, 5, 5, 10, 10)).toBe(true);
  });

  it("rectangles are far apart", () => {
    expect(aabbIntersects(0, 0, 10, 10, 20, 20, 10, 10)).toBe(false);
  });

  it("rectangles just touch edges", () => {
    expect(aabbIntersects(0, 0, 10, 10, 10, 0, 10, 10)).toBe(false);
  });

  it("one rectangle is inside another", () => {
    expect(aabbIntersects(0, 0, 20, 20, 5, 5, 5, 5)).toBe(true);
  });

  it("rectangles overlap only on one axis", () => {
    expect(aabbIntersects(0, 0, 10, 10, 5, 20, 10, 10)).toBe(false);
  });

});