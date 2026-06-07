import * as signalR from "@microsoft/signalr";

import { getApiBaseUrl } from "@/lib/api";
import { getStoredToken } from "@/lib/auth-storage";

export type RealtimeEnvelope = {
  event: string;
  payload: unknown;
  actorId: string;
};

export async function connectProjectRealtime(
  projectId: string,
  onEvent: (envelope: RealtimeEnvelope) => void,
): Promise<() => Promise<void>> {
  const connection = new signalR.HubConnectionBuilder()
    .withUrl(`${getApiBaseUrl()}/hubs/project`, {
      accessTokenFactory: () => getStoredToken() ?? "",
    })
    .withAutomaticReconnect()
    .build();

  connection.on("ProjectEvent", (envelope: RealtimeEnvelope) => {
    onEvent(envelope);
  });

  await connection.start();
  await connection.invoke("JoinProject", projectId);

  return async () => {
    try {
      if (connection.state === signalR.HubConnectionState.Connected) {
        await connection.invoke("LeaveProject", projectId);
      }
    } catch {
      // Ignore cleanup errors when the socket is already closed.
    } finally {
      await connection.stop();
    }
  };
}
