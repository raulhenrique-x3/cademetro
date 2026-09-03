import { QueryClient, MutationCache } from '@tanstack/react-query';
import { toast } from '@/context/toast-context';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 20, // 20 seconds
      gcTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      // Allow individual mutations to suppress global error toast if they handle it custom
      if ((mutation.meta as any)?.suppressToast) {
        return;
      }
      toast.error(error);
    },
  }),
});
