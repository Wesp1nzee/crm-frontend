export type EntryType = "folder" | "file";

export interface FolderBase {
  name: string;
  parent_id: string | null;
}

export interface FolderCreate {
  name: string;
  parent_id: string | null;
  case_id?: string | null;
}

export interface FolderResponse {
  id: string;
  name: string;
  parent_id: string | null;
  case_id: string | null;
  created_by_id: string | null;
  created_at: string;
}

export interface DocumentResponse {
  id: string;
  case_id: string | null;
  folder_id: string | null;
  title: string;
  file_size: number;
  file_extension: string;
  uploaded_by_id: string | null;
  created_at: string;
}

export interface FileSystemEntry {
  id: string;
  name: string;
  type: EntryType;
  size: number | null;
  extension: string | null;
  created_at: string;
  created_by_id: string | null;
  created_by_name?: string | null;
  created_by?: {
    full_name?: string;
    email?: string;
  } | null;
  parent_id: string | null;
  case_id: string | null;
  case_number?: string | null;
  share_info: {
    recipient_count: number;
    public_link_count: number;
  } | null;
}

export interface DocumentDownloadUrl {
  download_url: string;
}

export interface PaginationMeta {
  total_items: number;
  total_pages: number;
  current_page: number;
  per_page: number;
  has_next: boolean;
  has_prev: boolean;
  next_page_url: string | null;
  prev_page_url: string | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface DocumentsListParams {
  folder_id?: string | null;
  case_id?: string | null;
  search?: string;
  sort_by?: string;
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface DocumentUploadData {
  file: File;
  case_id?: string | null;
  folder_id?: string | null;
  title?: string | null;
  onUploadProgress?: (progress: number) => void;
}

export interface DownloadProgressOptions {
  onDownloadProgress?: (progress: number) => void;
}

export interface DocumentDownloadRequest extends DownloadProgressOptions {
  documentId: string;
}

export interface FolderDownloadRequest extends DownloadProgressOptions {
  folderId: string;
}

export interface BulkAssetsDownloadRequest
  extends BulkAssetsRequest, DownloadProgressOptions {}

export interface AssetUpdateRequest {
  asset_id: string;
  asset_type: "file" | "folder";
  data: {
    // Для файлов:
    title?: string;
    case_id?: string | null;
    folder_id?: string | null;

    // Для папок:
    name?: string;
    parent_id?: string | null;
  };
}

export interface BulkAssetsRequest {
  folder_ids: string[];
  document_ids: string[];
}
