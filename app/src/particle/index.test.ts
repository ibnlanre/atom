import { describe, expect, it, vi } from "vitest";
import { Particle } from ".";

describe("Particle", () => {
  it("should initialize with the given initial value", () => {
    const particle = new Particle(10);
    expect(particle.value).toBe(10);
  });

  it("should update the state and notify subscribers", () => {
    const particle = new Particle(10);
    const subscriber = vi.fn();
    particle.subscribe(subscriber);

    particle.publish(20);
    expect(particle.value).toBe(20);
    expect(subscriber).toHaveBeenCalledWith(20);
  });

  it("should maintain state history when debug is true", () => {
    const particle = new Particle(10, true);
    particle.publish(20);
    particle.publish(30);

    expect(particle.history).toEqual([10, 20, 30]);
  });

  it("should not maintain state history when debug is false", () => {
    const particle = new Particle(10);
    particle.publish(20);
    particle.publish(30);

    expect(particle.history).toEqual([]);
  });

  it("should undo state changes", () => {
    const particle = new Particle(10, true);
    particle.publish(20);
    particle.publish(30);

    particle.undo();
    expect(particle.value).toBe(20);

    particle.undo();
    expect(particle.value).toBe(10);
  });

  it("should redo state changes", () => {
    const particle = new Particle(10, true);
    particle.publish(20);
    particle.publish(30);

    particle.undo();
    particle.undo();
    particle.redo();
    expect(particle.value).toBe(20);

    particle.redo();
    expect(particle.value).toBe(30);
  });

  it("should not undo if there is no previous state", () => {
    const particle = new Particle(10, true);
    particle.undo();
    expect(particle.value).toBe(10);
  });

  it("should not redo if there is no next state", () => {
    const particle = new Particle(10, true);
    particle.publish(20);
    particle.redo();
    expect(particle.value).toBe(20);
  });

  it("should allow subscribers to unsubscribe", () => {
    const particle = new Particle(10);
    const subscriber = vi.fn();
    const subscription = particle.subscribe(subscriber);

    subscription.unsubscribe();
    particle.publish(20);
    expect(subscriber).not.toHaveBeenCalledWith(20);
  });

  it("should notify subscribers immediately if immediate is true", () => {
    const particle = new Particle(10);
    const subscriber = vi.fn();
    particle.subscribe(subscriber, true);

    expect(subscriber).toHaveBeenCalledWith(10);
  });

  it("should not notify subscribers immediately if immediate is false", () => {
    const particle = new Particle(10);
    const subscriber = vi.fn();
    particle.subscribe(subscriber, false);

    expect(subscriber).not.toHaveBeenCalled();
  });

  it("should clear all subscribers", () => {
    const particle = new Particle(10);
    const subscriber1 = vi.fn();
    const subscriber2 = vi.fn();
    particle.subscribe(subscriber1);
    particle.subscribe(subscriber2);

    particle.unsubscribe();
    particle.publish(20);

    expect(subscriber1).not.toHaveBeenCalledWith(20);
    expect(subscriber2).not.toHaveBeenCalledWith(20);
  });
});
