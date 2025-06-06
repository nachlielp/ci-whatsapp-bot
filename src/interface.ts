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
  end_date: string;
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
  jam = "jam", //handle old spelling mistake
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
  pardesHana = "pardes-hana", //handle old spelling mistake
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
  blob: TwilioWhatsappWebhookPayload;
  WaId: string;
  ProfileName: string;
  Body: string;
  MessageType: string;
  user_id: string;
  processing_time_ms?: string;
}

export interface WAUser {
  id: string;
  created_at: string;
  phone: string;
  name: string;
  is_subscribed: boolean;
  filter: Region[];
  message_count: number;
  is_blocked: boolean;
  received_block_notice: boolean;
  updated_at: string;
}

export interface TwilioWhatsappWebhookPayload {
  To: string;
  Body: string;
  From: string;
  WaId: string;
  SmsSid: string;
  NumMedia: string;
  SmsStatus: string;
  AccountSid: string;
  ApiVersion: string;
  ButtonText: string;
  MessageSid: string;
  MessageType: string;
  NumSegments: string;
  ProfileName: string;
  ButtonPayload?: string;
  ListId?: string;
  SmsMessageSid: string;
  ReferralNumMedia: string;
  MessagingServiceSid: string;
  OriginalRepliedMessageSid: string;
  OriginalRepliedMessageSender: string;
}

export enum MessageType {
  text = "text",
  button = "button",
  interactive = "interactive",
}

export enum InteractiveButtonPayload {
  first_message_reminder = "first_message_reminder",
  first_message_events = "first_message_events",
  event_types_james = "event_types_james",
  event_types_courses = "event_types_courses",
  set_weekly_filter = "set_weekly_filter",
  weekly_schedule_events = "weekly_schedule_events",
  weekend_schedule_events = "weekend_schedule_events",
  remove_weekly_filter = "remove_weekly_filter",
  confirm_remove_yes = "confirm_remove_yes",
  confirm_remove_no = "confirm_remove_no",
}

export enum SelectRegionListId {
  select_regions_jerusalem = "select_regions_jerusalem",
  select_regions_center = "select_regions_center",
  select_regions_south = "select_regions_south",
  select_regions_north = "select_regions_north",
}
