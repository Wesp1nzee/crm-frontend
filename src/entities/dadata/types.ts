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

// -- Address Suggestions --

export interface AddressSuggestionData {
  postal_code?: string | null;
  region?: string | null;
  region_type?: string | null;
  area?: string | null;
  area_type?: string | null;
  city?: string | null;
  city_type?: string | null;
  city_area?: string | null;
  city_area_type?: string | null;
  settlement?: string | null;
  settlement_type?: string | null;
  street?: string | null;
  street_type?: string | null;
  house?: string | null;
  block_type?: string | null;
  block?: string | null;
  flat?: string | null;
  flat_type?: string | null;
  postal_box?: string | null;
  fias_id?: string | null;
  fias_code?: string | null;
  fias_level?: string | null;
  kladr_id?: string | null;
  geoname_id?: string | null;
  capital_marker?: string | null;
  okato?: string | null;
  oktmo?: string | null;
  tax_office?: string | null;
  tax_office_legal?: string | null;
  timezone?: string | null;
  geo_lat?: string | null;
  geo_lon?: string | null;
  beltway_hit?: string | null;
  beltway_distance?: string | null;
  [key: string]: any;
}

export interface AddressSuggestion {
  value: string;
  unrestricted_value: string;
  data?: AddressSuggestionData;
}

export interface AddressLookupResult {
  suggestions: AddressSuggestion[];
}

export interface AddressSuggestParams {
  query: string;
  count?: number;
  from_bound?: string;
  to_bound?: string;
}

export type AddressBound =
  | "country"
  | "region"
  | "area"
  | "city"
  | "settlement"
  | "street"
  | "house";

// -- Court Suggestions --

export type CourtType =
  | "AV"
  | "AJ"
  | "VS"
  | "GV"
  | "KV"
  | "KJ"
  | "OS"
  | "OV"
  | "RS"
  | "AA"
  | "AO"
  | "AI"
  | "AS"
  | "MS";

export interface CourtSuggestion {
  value: string;
  unrestricted_value: string;
  code: string;
  name: string;
  inn?: string | null;
  court_type: CourtType;
  court_type_name: string;
  address: string;
  legal_address: string;
  website?: string | null;
}

export interface CourtLookupResult {
  suggestions: CourtSuggestion[];
}

export interface CourtSuggestParams {
  query: string;
  count?: number;
}

// -- Party (Organization) Suggestions --

export type PartyType = "LEGAL" | "INDIVIDUAL";
export type PartyStatus =
  | "ACTIVE"
  | "LIQUIDATING"
  | "LIQUIDATED"
  | "BANKRUPT"
  | "REORGANIZING";
export type BranchType = "MAIN" | "BRANCH";

export interface PartyManagement {
  management_name?: string | null;
  management_post?: string | null;
  management_start_date?: number | null;
}

export interface PartyAddress {
  address_value: string;
  address_unrestricted_value: string;
  address_source: string;
  address_qc?: number | null;
}

export interface PartyState {
  state_status: PartyStatus;
  state_code?: number | null;
  state_status_description?: string | null;
  state_registration_date?: number | null;
  state_liquidation_date?: number | null;
  state_actualty_date?: number | null;
}

export interface PartySuggestion {
  value: string;
  unrestricted_value: string;
  inn: string;
  kpp?: string | null;
  kpp_largest?: string | null;
  ogrn?: string | null;
  ogrn_date?: number | null;
  hid: string;
  type: PartyType;
  name_full_with_opf: string;
  name_short_with_opf: string;
  name_full: string;
  name_short: string;
  okved?: string | null;
  okved_type?: string | null;
  opf_code?: string | null;
  opf_full?: string | null;
  opf_short?: string | null;
  opf_type?: string | null;
  management_name?: string | null;
  management_post?: string | null;
  management_start_date?: number | null;
  branch_count?: number | null;
  branch_type?: BranchType | null;
  address_value: string;
  address_unrestricted_value: string;
  address_source: string;
  address_qc?: number | null;
  state_status: PartyStatus;
  state_code?: number | null;
  state_status_description?: string | null;
  state_registration_date?: number | null;
  state_actualty_date?: number | null;
  state_liquidation_date?: number | null;
}

export interface PartyLookupResult {
  suggestions: PartySuggestion[];
}

export interface PartySuggestParams {
  query: string;
  count?: number;
  party_type?: PartyType;
  status?: PartyStatus[];
  okved?: string[];
}
