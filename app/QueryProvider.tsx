'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

// Create a singleton QueryClient instance outside the component
// This ensures the same instance is used across all renders
let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh for 5 minutes
          gcTime: 5 * 60 * 1000, // 5 minutes - cache is kept for 5 minutes
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
          retry: 1,
        },
      },
    });
  }
  // Browser: use singleton pattern to keep the same query client
  if (!browserQueryClient) {
    browserQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh for 5 minutes
          gcTime: 5 * 60 * 1000, // 5 minutes - cache is kept for 5 minutes
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
          retry: 1,
        },
      },
    });
  }
  return browserQueryClient;
}

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  // Use getQueryClient to ensure singleton pattern
  const queryClient = useState(() => getQueryClient())[0];

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

