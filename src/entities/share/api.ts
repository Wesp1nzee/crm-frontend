import axios from "axios";
import { api } from "../../shared/api/axios";
import type {
  ShareAccessResponse,
  ShareBatchDetails,
  ShareInboxItem,
  ShareLinkPayload,
  ShareResourceResponse,
  ShareWithUsersPayload,
} from "./types";

const publicApi = axios.create({
  baseURL: "/api",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

export const shareApi = {
  createUserShare: async (payload: ShareWithUsersPayload) => {
    const { data } = await api.post("/share/user", payload);
    return data;
  },

  createLinkShare: async (payload: ShareLinkPayload) => {
    const { data } = await api.post("/share/link", payload);
    return data;
  },

  getResourceShares: async (params: { document_id?: string; folder_id?: string }) => {
    const { data } = await api.get<ShareResourceResponse>("/share/resource", {
      params,
    });
    return data;
  },

  revokeShare: async (batchId: string) => {
    await api.delete(`/share/${batchId}`);
  },

  getInbox: async (onlyActive = true) => {
    const { data } = await api.get<ShareInboxItem[]>("/share/inbox", {
      params: { only_active: onlyActive },
    });
    return data;
  },

  getBatchDetails: async (batchId: string) => {
    const { data } = await api.get<ShareBatchDetails>(`/share/${batchId}`);
    return data;
  },

  accessPublicLink: async (token: string, password?: string) => {
    const { data } = await publicApi.post<ShareAccessResponse>(
      `/share/access/${token}`,
      undefined,
      { params: password ? { password } : undefined },
    );
    return data;
  },

  registerDownload: async (token: string) => {
    const { data } = await publicApi.post(`/share/access/${token}/download`);
    return data;
  },
};
