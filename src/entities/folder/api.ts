// src/entities/folder/api.ts
import { api } from "../../shared/api/axios";
import type {
  FolderListResponse,
  FolderListParams,
} from "./types";

export const foldersApi = {
  getFolders: async (
    params?: FolderListParams,
  ): Promise<FolderListResponse> => {
    const { data } = await api.get("/documents/folders/list", { params });
    return data;
  },
};
