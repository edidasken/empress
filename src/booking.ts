export type BookingDraft = {
  serviceId: string;
  date: string;
  startMinutes: number | null;
  firstName: string;
  email: string;
  acceptsPolicy: boolean;
};

export type BookingRequest = BookingDraft & {
  id: string;
  createdAt: string;
  status: "requested" | "confirmed";
};

export function bookingReadiness(draft: BookingDraft): string[] {
  const issues: string[] = [];
  if (!draft.serviceId) issues.push("Choose a service");
  if (!draft.date) issues.push("Choose a date");
  if (draft.startMinutes === null) issues.push("Choose a time");
  if (!draft.firstName.trim()) issues.push("Add a first name");
  if (!/^\S+@\S+\.\S+$/.test(draft.email)) issues.push("Add a valid email");
  if (!draft.acceptsPolicy) issues.push("Accept the booking policy");
  return issues;
}

export function createBookingRequest(
  existing: BookingRequest[],
  draft: BookingDraft,
  id: string,
  createdAt: string,
): BookingRequest[] {
  const issues = bookingReadiness(draft);
  if (issues.length) throw new Error(issues.join("; "));
  return [...existing, { ...draft, id, createdAt, status: "requested" }];
}

export function confirmBookingRequest(
  existing: BookingRequest[],
  id: string,
): BookingRequest[] {
  if (!existing.some((request) => request.id === id))
    throw new Error("Booking request not found");
  return existing.map((request) =>
    request.id === id ? { ...request, status: "confirmed" } : request,
  );
}

export function formatBookingTime(minutes: number): string {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
}
