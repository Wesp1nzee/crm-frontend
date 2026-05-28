// src/entities/folder/types.ts
export interface FolderListItem {
  id: string;
  name: string;
  parent_id: string | null;
  case_id: string | null;
  case_number: string | null;
  created_at: string;
  created_by_id: string;
  created_by_name: string | null;
  is_case_root: boolean;
  children_count: number;
}

export interface FolderListPaginationMeta {
  total_items: number;
  total_pages: number;
  current_page: number;
  per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface FolderListResponse {
  items: FolderListItem[];
  meta: FolderListPaginationMeta;
}

export interface FolderListParams {
  parent_id?: string | null;
  include_case_folders?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}
