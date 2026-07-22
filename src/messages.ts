export type MessageChannel = "sms" | "email";
export type MessageStatus = "draft" | "queued";

export type MessageConsent = Record<MessageChannel, boolean>;

export type MessageDraft = {
  clientId: string;
  channel: MessageChannel;
  body: string;
};

export type OutboxMessage = MessageDraft & {
  id: string;
  createdAt: string;
  status: MessageStatus;
};

export function messageReadiness(
  draft: MessageDraft,
  consent: MessageConsent,
): string[] {
  const issues: string[] = [];
  if (!draft.clientId.trim()) issues.push("Choose a client");
  if (!draft.body.trim()) issues.push("Write a message");
  if (draft.body.trim().length > 320)
    issues.push("Keep the message under 320 characters");
  if (!consent[draft.channel])
    issues.push(`No ${draft.channel.toUpperCase()} consent on file`);
  return issues;
}

export function applyMessageTemplate(
  template: string,
  values: Record<string, string>,
): string {
  return template.replace(
    /\{(\w+)\}/g,
    (token, key: string) => values[key] ?? token,
  );
}

export function queueSyntheticMessage(
  outbox: OutboxMessage[],
  draft: MessageDraft,
  consent: MessageConsent,
  id: string,
  createdAt: string,
): OutboxMessage[] {
  const issues = messageReadiness(draft, consent);
  if (issues.length) throw new Error(issues.join("; "));
  return [...outbox, { ...draft, id, createdAt, status: "queued" }];
}
