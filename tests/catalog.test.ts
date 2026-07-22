import { describe, expect, it } from "vitest";
import {
  bookableStarts,
  serviceReadiness,
  serviceWindowMinutes,
  updateService,
  type ServiceOffering,
} from "../src/catalog";

const offering: ServiceOffering = {
  id: "restore",
  name: "Restore Flow",
  durationMinutes: 60,
  bufferMinutes: 15,
  priceCents: 12500,
  channel: "studio",
  active: true,
};

describe("service catalog", () => {
  it("combines care duration and reset buffer", () => {
    expect(serviceWindowMinutes(offering)).toBe(75);
    expect(bookableStarts(540, 1020, offering)).toBe(6);
  });

  it("rejects unsafe configuration ranges", () => {
    expect(serviceReadiness({ ...offering, durationMinutes: 5 })).toContain(
      "Duration must be between 15 and 240 minutes",
    );
    expect(serviceReadiness({ ...offering, bufferMinutes: -1 })).toContain(
      "Buffer must be between 0 and 90 minutes",
    );
  });

  it("updates immutably and can append a new service", () => {
    const updated = updateService([offering], { ...offering, priceCents: 13500 });
    expect(updated[0].priceCents).toBe(13500);
    expect(updateService([], offering)).toEqual([offering]);
  });

  it("does not save an invalid service", () => {
    expect(() => updateService([], { ...offering, name: "" })).toThrow("Add a service name");
  });
});
