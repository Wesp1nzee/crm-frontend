// src/entities/dadata/types.ts

export interface DadataLookupResponse {
  inn: string;
  kpp?: string | null;
  ogrn?: string | null;
  full_name: string;
  short_name?: string | null;
  legal_form?: string | null;
  is_individual: boolean;
  status: string;
  status_code?: number | null;
  status_description?: string | null;
  is_warning: boolean;
  warning_message?: string | null;
  registration_date?: number | null;
  liquidation_date?: number | null;
  address?: string | null;
  city?: string | null;
  ceo_name?: string | null;
  ceo_post?: string | null;
  okved?: string | null;
  phones?: string[];
  emails?: string[];
}

export interface DadataError {
  message: string;
  status: number;
}
