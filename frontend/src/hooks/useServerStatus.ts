import { useServerStatusContext } from '../context/ServerStatusContext';

export function useServerStatus() {
  return useServerStatusContext();
}
