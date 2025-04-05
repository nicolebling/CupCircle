
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import NetInfo from '@react-native-community/netinfo';

interface NetworkContextType {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  lastSync: Date | null;
  updateLastSync: () => void;
}

const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
  isInternetReachable: true,
  lastSync: null,
  updateLastSync: () => {},
});

export function useNetwork() {
  return useContext(NetworkContext);
}

interface NetworkProviderProps {
  children: ReactNode;
}

export function NetworkProvider({ children }: NetworkProviderProps) {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? false);
      setIsInternetReachable(state.isInternetReachable);
    });

    return () => unsubscribe();
  }, []);

  const updateLastSync = () => {
    setLastSync(new Date());
  };

  return (
    <NetworkContext.Provider
      value={{
        isConnected,
        isInternetReachable,
        lastSync,
        updateLastSync,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}
