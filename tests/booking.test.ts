import { describe, expect, it } from "vitest";
import {
  bookingReadiness,
  confirmBookingRequest,
  createBookingRequest,
  formatBookingTime,
  type BookingDraft,
} from "../src/booking";

const ready: BookingDraft = {
  serviceId: "restore",
  date: "2026-07-24",
  startMinutes: 540,
  firstName: "Maya",
  email: "maya@example.test",
  acceptsPolicy: true,
};

describe("synthetic online booking", () => {
  it("requires a complete contact-safe request", () => {
    expect(bookingReadiness({ ...ready, email: "invalid" })).toContain(
      "Add a valid email",
    );
    expect(bookingReadiness({ ...ready, acceptsPolicy: false })).toContain(
      "Accept the booking policy",
    );
  });

  it("creates and confirms an immutable booking request", () => {
    const created = createBookingRequest(
      [],
      ready,
      "BOOK-1",
      "2026-07-23T10:00:00Z",
    );
    expect(created[0].status).toBe("requested");
    const confirmed = confirmBookingRequest(created, "BOOK-1");
    expect(created[0].status).toBe("requested");
    expect(confirmed[0].status).toBe("confirmed");
  });

  it("rejects incomplete creation and missing confirmation targets", () => {
    expect(() =>
      createBookingRequest([], { ...ready, startMinutes: null }, "B", "now"),
    ).toThrow("Choose a time");
    expect(() => confirmBookingRequest([], "missing")).toThrow(
      "Booking request not found",
    );
  });

  it("formats bookable times", () => {
    expect(formatBookingTime(540)).toBe("9:00 AM");
    expect(formatBookingTime(810)).toBe("1:30 PM");
  });
});
