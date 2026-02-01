export type EntryType = 'folder' | 'file';

export interface FolderBase {
  name: string;
  parent_id: string | null;
}

export interface FolderCreate {
  name: string;
  parent_id: string | null;
}

export interface FolderResponse {
  id: string;
  name: string;
  parent_id: string | null;
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
}

export interface DocumentDownloadUrl {
  download_url: string;
}

export interface DocumentsListParams {
  folder_id?: string | null;
  case_id?: string | null;
  search?: string;
  sort_by?: string;
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface DocumentUploadData {
  file: File;
  case_id?: string | null;
  folder_id?: string | null;
  title?: string | null;
}

export interface AssetUpdateRequest {
  asset_id: string;
  asset_type: 'file' | 'folder';
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