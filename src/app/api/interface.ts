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
  segments: CIEventSegments[];
  is_multi_day: boolean;
  cancelled: boolean;
  cancelled_text: string;
  type: EventlyType;
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
  district: Region;
  short_id: string;
  segments: CIEventSegments[];
  address: IAddress;
  type: EventlyType;
  is_multi_day: boolean;
}
export enum EventlyType {
  class = "class",
  jame = "jame",
  workshop = "workshop",
  conference = "conference",
  underscore = "underscore",
  retreat = "retreat",
  course = "course",
  score = "score",
}

export enum Region {
  center = "center",
  jerusalem = "jerusalem",
  galilee = "galilee",
  haifa = "haifa",
  carmel = "carmel",
  pardesHanna = "pardesHanna",
  south = "south",
  north = "north",
}

export const districtOptions: SelectOption[] = [
  { value: "center", label: "מרכז" },
  { value: "jerusalem", label: "ירושלים" },
  { value: "galilee", label: "גליל" },
  { value: "haifa", label: "חיפה" },
  { value: "carmel", label: "חוף כרמל" },
  { value: "pardesHanna", label: "פרדס חנה" },
  { value: "south", label: "דרום" },
  { value: "north", label: "צפון" },
];
export const eventOptions: SelectOption[] = [
  { value: "class", label: "שיעור" },
  { value: "jam", label: "ג'אם" },
  { value: "underscore", label: "אנדרסקור" },
  { value: "workshop", label: "סדנה" },
  { value: "retreat", label: "ריטריט" },
  { value: "warmup", label: "חימום" },
  { value: "course", label: "קורס" },
  { value: "score", label: "סקור" },
  // { value: "conference", label: "כנס" },
];
export interface SelectOption {
  value: string;
  label: string;
}

export enum EventListType {
  james = "james",
  courses = "courses",
}
export interface WAMessage {
  id: string;
  blob: Record<string, unknown>;
  WaId: string;
  ProfileName: string;
  Body: string;
  MessageType: string;
  user_id: string;
  processing_time_ms?: string;
}

export interface WAUser {
  name: string;
  phone: string;
  created_at: string;
  id: string;
  filter: Region[];
}
