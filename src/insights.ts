export type VisitSignal = {
  id: string;
  clientId: string;
  service: string;
  status: "completed" | "cancelled" | "scheduled";
  revenueCents: number;
};

export type PracticeSummary = {
  completed: number;
  scheduled: number;
  cancelled: number;
  revenueCents: number;
  uniqueClients: number;
  returningClients: number;
  utilizationPercent: number;
  serviceMix: { service: string; visits: number; percent: number }[];
};

export function summarizePractice(
  visits: VisitSignal[],
  availableSlots: number,
): PracticeSummary {
  const completed = visits.filter((visit) => visit.status === "completed");
  const scheduled = visits.filter((visit) => visit.status === "scheduled").length;
  const cancelled = visits.filter((visit) => visit.status === "cancelled").length;
  const clientCounts = completed.reduce<Record<string, number>>((counts, visit) => {
    counts[visit.clientId] = (counts[visit.clientId] ?? 0) + 1;
    return counts;
  }, {});
  const services = completed.reduce<Record<string, number>>((counts, visit) => {
    counts[visit.service] = (counts[visit.service] ?? 0) + 1;
    return counts;
  }, {});
  const serviceMix = Object.entries(services)
    .map(([service, count]) => ({
      service,
      visits: count,
      percent: completed.length ? Math.round((count / completed.length) * 100) : 0,
    }))
    .sort((a, b) => b.visits - a.visits || a.service.localeCompare(b.service));
  return {
    completed: completed.length,
    scheduled,
    cancelled,
    revenueCents: completed.reduce((sum, visit) => sum + visit.revenueCents, 0),
    uniqueClients: Object.keys(clientCounts).length,
    returningClients: Object.values(clientCounts).filter((count) => count > 1).length,
    utilizationPercent: availableSlots
      ? Math.min(100, Math.round((completed.length / availableSlots) * 100))
      : 0,
    serviceMix,
  };
}

export function percentageChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}
