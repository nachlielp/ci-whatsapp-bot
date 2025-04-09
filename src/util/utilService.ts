import {
  CIEventList,
  districtOptions,
  EventlyType,
  Region,
} from "@/app/api/interface";
import dayjs from "dayjs";
import "dayjs/locale/he";

export function filterEventsByRegions(
  events: CIEventList[],
  regions: Region[]
) {
  return events.filter((event) => regions.includes(event.district));
}
export function filterJamsAndClasses(events: CIEventList[]) {
  const eventTypes = [
    EventlyType.class,
    EventlyType.jame,
    EventlyType.underscore,
    EventlyType.score,
  ];
  return events.filter((event) => {
    if (event.type === EventlyType.class) {
      return (
        eventTypes.includes(event.type) ||
        event.segments.some((segment) =>
          eventTypes.includes(segment.type as EventlyType)
        )
      );
    }
  });
}

export function filterWorkshops(events: CIEventList[]) {
  const eventTypes = [EventlyType.retreat, EventlyType.workshop];
  return events.filter(
    (event) =>
      eventTypes.includes(event.type) ||
      event.segments.some((segment) =>
        eventTypes.includes(segment.type as EventlyType)
      )
  );
}

export function filterCourses(events: CIEventList[]) {
  const eventTypes = [EventlyType.course];
  return events.filter(
    (event) =>
      eventTypes.includes(event.type) ||
      event.segments.some((segment) =>
        eventTypes.includes(segment.type as EventlyType)
      )
  );
}

export function filterCIEventsByType(
  events: CIEventList[],
  types: EventlyType[]
) {
  return events.filter(
    (event) =>
      types.includes(event.type) ||
      event.segments.some((segment) =>
        types.includes(segment.type as EventlyType)
      )
  );
}

export function formatCIEventsList(events: CIEventList[]) {
  return events
    .sort((a, b) => dayjs(a.start_date).diff(dayjs(b.start_date)))
    .map(
      (event) =>
        `*${event.title}* \n יום ${hebrewDate(event.start_date)} ${formatTime(
          event
        )} ${event.address.label} \n  ${formatEventUrl(event)}`
    )
    .join("\n\n");
}

function hebrewDate(date: string) {
  return (
    dayjs(date).locale("he").format("dddd, D") +
    " ב" +
    dayjs(date).locale("he").format(" MMMM") +
    "\n"
  );
}

function formatTime(event: CIEventList) {
  if (!event.is_multi_day) {
    return `${dayjs(event.segments[event.segments.length - 1].startTime).format(
      "HH:mm"
    )} - ${dayjs(event.segments[0].endTime).format("HH:mm")} \n`;
  }
}

function formatEventUrl(event: CIEventList) {
  return `${process.env.CI_EVENTS_DOMAIN}/event/${event.short_id}`;
}

export function emptyRegionMessage(region: Region) {
  const regionHebrew = districtOptions.find((r) => r.value === region)?.label;
  return `*אין במערכת אירועים השבוע ב${regionHebrew}*`;
}

export function setupWeeklyMessage() {
  return `על מנת להגדיר את הפילטר, שילחו *הודעה אחת* עם המילה *שבועי* והמספרים של האזורים בהם אתם מעוניינים.
1 - ירושלים
2 - מרכז
3 - צפון
4 - דרום

לדוגמה עבור ירושלים ומרכז שילחו:
שבועי 1 2 
`;
}

export function getWeeklyFilterFromBody(body: string) {
  const weeklyFilter: Region[] = [];
  if (body.includes("1")) {
    weeklyFilter.push(Region.jerusalem);
  }
  if (body.includes("2")) {
    weeklyFilter.push(Region.center);
  }
  if (body.includes("3")) {
    weeklyFilter.push(Region.north);
  }
  if (body.includes("4")) {
    weeklyFilter.push(Region.south);
  }

  return weeklyFilter;
}

export function formatSubscribedRegions(regions: Region[]) {
  const regionHebrew = regions
    .map((region) => districtOptions.find((r) => r.value === region)?.label)
    .join(", ");
  return `*נרשמתם בהצלחה לקבל עדכון שבועי על אירועים באיזורים הבאים: ${regionHebrew}*

להסרה שילחו הודעה עם המילה *הסר*`;
}
