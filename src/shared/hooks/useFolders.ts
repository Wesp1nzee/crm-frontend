// src/shared/hooks/useFolders.ts
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { foldersApi } from "../../entities/folder/api";
import type { FolderListItem, FolderListParams } from "../../entities/folder/types";

export const useFolders = (params: FolderListParams, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["folders", params],
    queryFn: () => foldersApi.getFolders(params),
    enabled,
    placeholderData: (prevData) => prevData,
  });
};
