import { QueryClient } from "@tanstack/react-query";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  });
}

export const queryClient = createQueryClient();
