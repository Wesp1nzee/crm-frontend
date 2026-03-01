export type PermissionLevel = "view" | "edit";

export interface ShareResourceItem {
  document_id?: string;
  folder_id?: string;
  permission_level?: PermissionLevel;
  can_download: boolean;
}

export interface ShareWithUsersPayload {
  shared_with_user_ids: string[];
  resources: ShareResourceItem[];
  expires_at?: string | null;
  message?: string | null;
}

export interface ShareLinkPayload {
  resources: ShareResourceItem[];
  password?: string | null;
  expires_at?: string | null;
  message?: string | null;
}

export interface ShareBatch {
  id?: string;
  batch_id?: string;
  recipient_name?: string | null;
  recipient_email?: string | null;
  full_name?: string | null;
  email?: string | null;
  user_id?: string | null;
  permission_level?: PermissionLevel;
  can_download: boolean;
  created_at: string;
  expires_at?: string | null;
  is_public_link?: boolean;
  has_password?: boolean;
  link_url?: string;
  url?: string;
  share_token?: string | null;
  current_views?: number;
  current_downloads?: number;
}

export interface ShareResourceResponse {
  recipients: ShareBatch[];
  public_links: ShareBatch[];
}

export interface ShareInboxItem {
  batch_id: string;
  sender_name: string;
  permission_level: PermissionLevel;
  can_download: boolean;
  created_at: string;
  expires_at?: string | null;
  message?: string | null;
  resource: {
    document_id?: string;
    folder_id?: string;
    name: string;
    type: "file" | "folder";
  };
}

export interface ShareAccessResponse {
  batch_id: string;
  can_download: boolean;
  resources: Array<{
    document_id?: string;
    folder_id?: string;
    name: string;
    type: "file" | "folder";
  }>;
}

export interface ShareBatchDetails extends ShareBatch {}
