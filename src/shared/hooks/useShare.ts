import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { shareApi } from "../../entities/share/api";
import type { ShareLinkPayload, ShareWithUsersPayload } from "../../entities/share/types";

export const useShareResource = (params: { document_id?: string; folder_id?: string }, enabled = true) =>
  useQuery({
    queryKey: ["share-resource", params],
    queryFn: () => shareApi.getResourceShares(params),
    enabled: enabled && Boolean(params.document_id || params.folder_id),
    staleTime: 60000,
  });

export const useCreateUserShare = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ShareWithUsersPayload) => shareApi.createUserShare(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["share-resource"] });
    },
  });
};

export const useCreateLinkShare = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ShareLinkPayload) => shareApi.createLinkShare(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["share-resource"] });
    },
  });
};

export const useRevokeShare = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (batchId: string) => shareApi.revokeShare(batchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["share-resource"] });
      queryClient.invalidateQueries({ queryKey: ["share-inbox"] });
    },
  });
};

export const useShareInbox = () =>
  useQuery({
    queryKey: ["share-inbox"],
    queryFn: () => shareApi.getInbox(true),
  });

export const useShareBatchDetails = (batchId?: string) =>
  useQuery({
    queryKey: ["share-batch", batchId],
    queryFn: () => shareApi.getBatchDetails(batchId as string),
    enabled: Boolean(batchId),
  });
