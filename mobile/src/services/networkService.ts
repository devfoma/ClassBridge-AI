import NetInfo from '@react-native-community/netinfo';
import { api } from './apiClient';

export interface NetworkState {
  connected: boolean; // device has some network (Wi-Fi/cellular/LAN)
  type: string;
}

/**
 * Read raw device connectivity. Note: LAN/hotspot may work even when the
 * internet is unreachable, so we do NOT gate hub access on internet
 * reachability. The real test of hub availability is a /health check.
 */
export async function getNetworkState(): Promise<NetworkState> {
  try {
    const state = await NetInfo.fetch();
    return { connected: !!state.isConnected, type: state.type ?? 'unknown' };
  } catch {
    return { connected: false, type: 'unknown' };
  }
}

export function subscribeNetwork(cb: (state: NetworkState) => void): () => void {
  const unsub = NetInfo.addEventListener((state) => {
    cb({ connected: !!state.isConnected, type: state.type ?? 'unknown' });
  });
  return unsub;
}

/** The authoritative "can I reach the hub?" check. */
export async function checkHub(hubUrl: string | null): Promise<{ ok: boolean; detail: string }> {
  if (!hubUrl) return { ok: false, detail: 'No hub URL set' };
  try {
    const health = await api.health(hubUrl);
    return { ok: health.status === 'ok', detail: `${health.hubName} v${health.version}` };
  } catch (err) {
    return { ok: false, detail: (err as Error).message };
  }
}
