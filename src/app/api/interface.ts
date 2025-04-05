export interface CIEvent {
  id: string;
  short_id: string;
  title: string;
  description: string;
  address: IAddress;
  hide: boolean;
  start_date: string;
  end_date: string;
  district: string;
  type: string;
  segments: CIEventSegments[];
  is_multi_day: boolean;
  cancelled: boolean;
  cancelled_text: string;
}
export interface IAddress {
  place_id: string;
  label: string;
  en_label?: string;
}
export interface CIEventSegments {
  endTime: string;
  type: string;
  startTime: string;
  teachers: UserOption[];
  tags: string[];
}
export interface UserOption {
  value: string;
  label: string;
}
export interface CIEventList {
  title: string;
  start_date: string;
}
