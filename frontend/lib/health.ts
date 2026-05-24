import { api } from "@/lib/api";

export type HealthResponse = {
  status: string;
  service: string;
  database: string;
  timestamp: string;
};

export async function fetchHealth(): Promise<HealthResponse> {
  const { data } = await api.get<HealthResponse>("/api/health");
  return data;
}
