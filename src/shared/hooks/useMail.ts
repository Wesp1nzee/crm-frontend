import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mailApi } from '../../entities/mail/api';
import type { MailDraft } from '../../entities/mail/types';

// Folders
export const useMailFolders = () => {
  return useQuery({
    queryKey: ['mail-folders'],
    queryFn: () => mailApi.getFolders().then(res => res.data),
  });
};

// Threads
export const useMailThreads = (folderId?: string) => {
  return useQuery({
    queryKey: ['mail-threads', folderId],
    queryFn: () => mailApi.getThreads(folderId).then(res => res.data),
    enabled: !!folderId,
  });
};

export const useMailThread = (id: string) => {
  return useQuery({
    queryKey: ['mail-thread', id],
    queryFn: () => mailApi.getThread(id).then(res => res.data),
    enabled: !!id,
  });
};

// Mail actions with optimistic updates
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (ids: string[]) => mailApi.markAsRead(ids),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: ['mail-threads'] });
      
      const previousThreads = queryClient.getQueryData(['mail-threads']);
      
      queryClient.setQueriesData(
        { queryKey: ['mail-threads'] },
        (old: any) => {
          if (!old) return old;
          return old.map((thread: any) => 
            ids.includes(thread.id) ? { ...thread, isRead: true } : thread
          );
        }
      );
      
      return { previousThreads };
    },
    onError: (err, ids, context) => {
      queryClient.setQueryData(['mail-threads'], context?.previousThreads);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['mail-threads'] });
      queryClient.invalidateQueries({ queryKey: ['mail-folders'] });
    },
  });
};

export const useArchiveMail = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (ids: string[]) => mailApi.archive(ids),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: ['mail-threads'] });
      
      const previousThreads = queryClient.getQueryData(['mail-threads']);
      
      queryClient.setQueriesData(
        { queryKey: ['mail-threads'] },
        (old: any) => {
          if (!old) return old;
          return old.filter((thread: any) => !ids.includes(thread.id));
        }
      );
      
      return { previousThreads };
    },
    onError: (err, ids, context) => {
      queryClient.setQueryData(['mail-threads'], context?.previousThreads);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['mail-threads'] });
      queryClient.invalidateQueries({ queryKey: ['mail-folders'] });
    },
  });
};

export const useSendMail = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (draft: MailDraft) => mailApi.sendMail(draft).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mail-threads'] });
      queryClient.invalidateQueries({ queryKey: ['mail-folders'] });
    },
  });
};