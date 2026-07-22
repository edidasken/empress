import { describe, expect, it } from "vitest";
import {
  applyMessageTemplate,
  messageReadiness,
  queueSyntheticMessage,
  type MessageDraft,
  type OutboxMessage,
} from "../src/messages";

const ready: MessageDraft = {
  clientId: "EMP-1024",
  channel: "sms",
  body: "Your appointment is confirmed.",
};

describe("client message safeguards", () => {
  it("interpolates only known template fields", () => {
    expect(
      applyMessageTemplate("Hi {first}, see you {date}. {unknown}", {
        first: "Maya",
        date: "Friday",
      }),
    ).toBe("Hi Maya, see you Friday. {unknown}");
  });

  it("requires content and consent for the selected channel", () => {
    expect(
      messageReadiness({ ...ready, body: "" }, { sms: true, email: true }),
    ).toContain("Write a message");
    expect(messageReadiness(ready, { sms: false, email: true })).toContain(
      "No SMS consent on file",
    );
  });

  it("queues a synthetic message without mutating the existing outbox", () => {
    const existing: OutboxMessage[] = [];
    const next = queueSyntheticMessage(
      existing,
      ready,
      { sms: true, email: false },
      "MSG-1",
      "2026-07-22T12:00:00.000Z",
    );
    expect(existing).toEqual([]);
    expect(next[0]).toMatchObject({ id: "MSG-1", status: "queued" });
  });

  it("blocks queueing when channel consent is absent", () => {
    expect(() =>
      queueSyntheticMessage(
        [],
        ready,
        { sms: false, email: true },
        "MSG-1",
        "now",
      ),
    ).toThrow("No SMS consent on file");
  });
});
