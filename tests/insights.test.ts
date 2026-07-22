import { describe, expect, it } from "vitest";
import { percentageChange, summarizePractice, type VisitSignal } from "../src/insights";

const visits: VisitSignal[] = [
  { id: "1", clientId: "A", service: "Restore Flow", status: "completed", revenueCents: 12500 },
  { id: "2", clientId: "A", service: "Restore Flow", status: "completed", revenueCents: 12500 },
  { id: "3", clientId: "B", service: "Community Care", status: "completed", revenueCents: 10500 },
  { id: "4", clientId: "C", service: "Restore Flow", status: "cancelled", revenueCents: 12500 },
  { id: "5", clientId: "D", service: "Restore Flow", status: "scheduled", revenueCents: 12500 },
];

describe("practice insights", () => {
  it("summarizes completed care without counting cancelled or future revenue", () => {
    expect(summarizePractice(visits, 5)).toMatchObject({
      completed: 3,
      scheduled: 1,
      cancelled: 1,
      revenueCents: 35500,
      uniqueClients: 2,
      returningClients: 1,
      utilizationPercent: 60,
    });
  });

  it("builds a sorted service mix", () => {
    expect(summarizePractice(visits, 5).serviceMix).toEqual([
      { service: "Restore Flow", visits: 2, percent: 67 },
      { service: "Community Care", visits: 1, percent: 33 },
    ]);
  });

  it("handles percentage change without inventing a baseline", () => {
    expect(percentageChange(12, 10)).toBe(20);
    expect(percentageChange(0, 0)).toBe(0);
    expect(percentageChange(10, 0)).toBeNull();
  });
});
