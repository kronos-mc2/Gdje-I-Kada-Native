import { queryClient } from '@/core/query/query-client';

export const resetSessionQueryState = async () => {
  await queryClient.cancelQueries();
  queryClient.clear();
};
