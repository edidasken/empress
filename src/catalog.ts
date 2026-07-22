export type ServiceChannel = "studio" | "mobile" | "both";

export type ServiceOffering = {
  id: string;
  name: string;
  durationMinutes: number;
  bufferMinutes: number;
  priceCents: number;
  channel: ServiceChannel;
  active: boolean;
};

export function serviceReadiness(service: ServiceOffering): string[] {
  const issues: string[] = [];
  if (!service.name.trim()) issues.push("Add a service name");
  if (service.durationMinutes < 15 || service.durationMinutes > 240)
    issues.push("Duration must be between 15 and 240 minutes");
  if (service.bufferMinutes < 0 || service.bufferMinutes > 90)
    issues.push("Buffer must be between 0 and 90 minutes");
  if (service.priceCents < 0) issues.push("Price cannot be negative");
  return issues;
}

export function serviceWindowMinutes(service: ServiceOffering): number {
  return service.durationMinutes + service.bufferMinutes;
}

export function updateService(
  services: ServiceOffering[],
  service: ServiceOffering,
): ServiceOffering[] {
  if (serviceReadiness(service).length) throw new Error(serviceReadiness(service).join("; "));
  if (!services.some((item) => item.id === service.id)) return [...services, service];
  return services.map((item) => (item.id === service.id ? service : item));
}

export function bookableStarts(
  openMinutes: number,
  closeMinutes: number,
  service: ServiceOffering,
): number {
  const window = serviceWindowMinutes(service);
  return window > 0 ? Math.max(0, Math.floor((closeMinutes - openMinutes) / window)) : 0;
}
