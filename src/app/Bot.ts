import type { MessageInstance } from "twilio/lib/rest/api/v2010/account/message";
import {
  TwilioWhatsappWebhookPayload,
  MessageType,
  InteractiveButtonPayload,
  EventlyType,
  Region,
  districtOptions,
  SelectRegionListId,
  SelectOption,
  WAUser,
} from "@/interface";
import {
  emptyRegionMessage,
  filterCIEventsByType,
  filterEventsByRegions,
  formatCIEventsList,
  formatSubscribedRegions,
  northRegions,
  validateTwilioPayload,
} from "@/util/utilService";
import { twilio } from "./Twilio";
import { supabase } from "./Supabase";
import dayjs from "dayjs";

class Bot {
  async handleTwilioWebhook(
    message: Record<string, string>,
    startTime: number
  ) {
    const isValid = validateTwilioPayload(message);

    if (!isValid) {
      throw new Error("Invalid Twilio webhook payload");
    }

    const payload = message as unknown as TwilioWhatsappWebhookPayload;

    let twilioResult;
    switch (payload.MessageType) {
      case MessageType.text:
        twilioResult = await this.handleTextMessage(payload);
        break;
      case MessageType.button:
      case MessageType.interactive:
        twilioResult = await this.handleInteractiveMessage(payload);
        break;
      default:
        throw new Error(`Unsupported message type: ${payload.MessageType}`);
    }

    await this.handleUpdateUserAndLogMessage(twilioResult, payload, startTime);
  }

  async handleWeeklyUpdate() {
    const start = dayjs();
    const ci_users = await supabase.getSubscribedUsers();
    const ci_events = await supabase.getCIEvents(
      dayjs().format("YYYY-MM-DD"),
      dayjs().add(7, "day").format("YYYY-MM-DD")
    );

    // console.log("ci_events", ci_events);

    const disctictEventsCount: Record<string, number> = {};

    ci_events.forEach((event: { district: string }) => {
      disctictEventsCount[event.district] =
        (disctictEventsCount[event.district] || 0) + 1;
    });

    disctictEventsCount["north"] = Object.keys(disctictEventsCount)
      .filter((key) => northRegions(key as Region))
      .reduce((acc, key) => acc + disctictEventsCount[key], 0);

    const formattedMessages: {
      phone: string;
      name: string;
      filters: string;
      eventsCount: number;
    }[] = ci_users.map((user: WAUser) => {
      const eventsCount = user.filter.reduce((acc, filter) => {
        return acc + disctictEventsCount[filter];
      }, 0);

      return {
        phone: user.phone,
        name: user.name,
        filters: user.filter
          .map((filter: string) => {
            const option = districtOptions.find(
              (option: SelectOption) => option.value === filter
            );
            return option?.label;
          })
          .join(", "),
        eventsCount,
      };
    });

    const temp = formattedMessages.filter(
      (message) => message.phone === "972584994306"
    );

    const results = await Promise.allSettled(
      temp.map((message) => {
        return twilio.sendTemplate(
          `whatsapp:+${message.phone}`,
          process.env.TWILIO_TEMPLATE_WEEKLY_SCHEDULE!,
          {
            "1": message.name,
            "2": message.filters,
            "3": message.eventsCount.toString(),
          }
        );
      })
    );

    const formattedLogResults = results.map((result) => {
      const user = ci_users.find(
        (user: WAUser) =>
          result.status === "fulfilled" && result.value.to.includes(user.phone)
      );

      if (!user) {
        console.warn(
          "Bot.handleWeeklyUpdate: User not found for log result",
          result
        );
        return null;
      }

      return {
        result,
        wa_user_id: user?.id || "",
        from: process.env.TWILIO_FROM_NUMBER!,
        to: user?.phone,
      };
    });

    await Promise.allSettled(
      formattedLogResults
        .filter((logResult) => logResult !== null)
        .map((logResult) => {
          return supabase.logTwilioResult(
            logResult.result,
            null,
            logResult.wa_user_id,
            logResult.from,
            logResult.to,
            "cron_job"
          );
        })
    );

    const end = dayjs();
    console.log(`Time taken: ${end.diff(start, "seconds")} seconds`);
  }

  private async handleTextMessage(
    payload: TwilioWhatsappWebhookPayload
  ): Promise<MessageInstance> {
    const { Body, From, WaId, ProfileName } = payload;

    let twilioResult;

    try {
      if (Body.includes("הסר")) {
        twilioResult = await twilio.sendTemplate(
          From,
          process.env.TWILIO_TEMPLATE_CONFIRM_REMOVE!
        );
      } else if (Body.includes("שבועי")) {
        const user = await supabase.setWeeklyFilter(ProfileName, WaId, Body);

        if (!user) {
          throw new Error("Bot.handleTextMessage: User not found");
        }

        twilioResult = await twilio.sendText(
          `whatsapp:${user.phone}`,
          formatSubscribedRegions(user.filter)
        );
      } else {
        twilioResult = await twilio.sendTemplate(
          From,
          process.env.TWILIO_TEMPLATE_FIRST_MESSAGE!
        );
      }
    } catch (error) {
      console.error("Bot.handleTextMessage: Error", error);
      throw error;
    }
    return twilioResult;
  }

  private async handleInteractiveMessage(
    payload: TwilioWhatsappWebhookPayload
  ): Promise<MessageInstance> {
    const { From, WaId, ButtonPayload } = payload;

    let twilioResult;

    if (ButtonPayload) {
      twilioResult = await this.handleButtonPayload({
        From,
        WaId,
        ButtonPayload,
      });
    } else {
      twilioResult = await this.handleListMessage(payload);
    }

    return twilioResult;
  }

  private async handleButtonPayload({
    From,
    WaId,
    ButtonPayload,
  }: {
    From: string;
    WaId: string;
    ButtonPayload: string;
  }): Promise<MessageInstance> {
    let twilioResult;

    switch (ButtonPayload) {
      case InteractiveButtonPayload.first_message_reminder:
        twilioResult = await twilio.sendTemplate(
          From,
          process.env.TWILIO_TEMPLATE_SETUP_WEEKLY_REMINDER!
        );
        break;

      case InteractiveButtonPayload.first_message_events:
        twilioResult = await twilio.sendTemplate(
          From,
          process.env.TWILIO_TEMPLATE_SELECT_EVENT_TYPES!
        );
        break;

      case InteractiveButtonPayload.event_types_james:
        twilioResult = await twilio.sendTemplate(
          From,
          process.env.TWILIO_TEMPLATE_SELECT_REGION!
        );
        break;

      case InteractiveButtonPayload.event_types_courses:
        const ci_events = await supabase.getCIEvents();
        const filteredEvents = filterCIEventsByType(ci_events, [
          EventlyType.course,
          EventlyType.retreat,
          EventlyType.workshop,
        ]);
        const formattedCourseEvents = formatCIEventsList(filteredEvents);
        const coursesTitle = `*קורסים סדנאות וריטריטים בחודשיים הקרובים*`;

        twilioResult = await twilio.sendText(
          From,
          coursesTitle + "\n\n" + formattedCourseEvents
        );
        break;

      case InteractiveButtonPayload.weekly_schedule_events:
        const userAndWeeklyEvents = await supabase.getUserAndThisWeekEvents(
          WaId
        );

        if (!userAndWeeklyEvents) {
          twilioResult = await twilio.sendText(From, "לא נמצאו אירועים/ משתמש");
          break;
        }

        const { user: weeklyScheduleUser, events: weeklyScheduleEvents } =
          userAndWeeklyEvents;

        if (!weeklyScheduleUser || weeklyScheduleUser.filter.length === 0) {
          twilioResult = await twilio.sendTemplate(
            From,
            process.env.TWILIO_TEMPLATE_SETUP_WEEKLY_REMINDER!
          );
          break;
        }

        const weeklyScheduleTitle = `*אירועים בשבוע הקרוב ב${weeklyScheduleUser?.filter
          .map((r: Region) => districtOptions.find((d) => d.value === r)?.label)
          .join(", ")}.*`;

        const weeklyScheduleFilteredEvents = filterEventsByRegions(
          weeklyScheduleEvents,
          weeklyScheduleUser?.filter
        );
        const formattedWeeklyScheduleEvents = formatCIEventsList(
          weeklyScheduleFilteredEvents
        );
        twilioResult = await twilio.sendText(
          From,
          weeklyScheduleTitle + "\n\n" + formattedWeeklyScheduleEvents
        );
        break;

      case InteractiveButtonPayload.weekend_schedule_events:
        const userAndWeekendEvents = await supabase.getUserAndThisWeekEvents(
          WaId
        );
        if (!userAndWeekendEvents) {
          twilioResult = await twilio.sendText(From, "לא נמצאו אירועים/ משתמש");
          break;
        }
        const { user: weekendScheduleUser, events: weekendScheduleEvents } =
          userAndWeekendEvents;

        if (!weekendScheduleUser || weekendScheduleUser.filter.length === 0) {
          twilioResult = await twilio.sendTemplate(
            From,
            process.env.TWILIO_TEMPLATE_SETUP_WEEKLY_REMINDER!
          );
          break;
        }

        const weekendScheduleTitle = `*אירועים בסופ״ש הקרוב ב${weekendScheduleUser?.filter
          .map((r: Region) => districtOptions.find((d) => d.value === r)?.label)
          .join(", ")}*`;

        const weekendScheduleFilteredEvents = filterEventsByRegions(
          weekendScheduleEvents,
          weekendScheduleUser?.filter
        );
        const formattedWeekendScheduleEvents = formatCIEventsList(
          weekendScheduleFilteredEvents
        );
        twilioResult = await twilio.sendText(
          From,
          weekendScheduleTitle + "\n\n" + formattedWeekendScheduleEvents
        );
        break;

      case InteractiveButtonPayload.remove_weekly_filter:
        twilioResult = await twilio.sendTemplate(
          From,
          process.env.TWILIO_TEMPLATE_CONFIRM_REMOVE!
        );
        break;

      case InteractiveButtonPayload.confirm_remove_yes:
        const phoneNumberToUnsubscribe = WaId;
        const unsubscribed = await supabase.unsubscribeFromWeeklyFilter(
          phoneNumberToUnsubscribe
        );

        if (unsubscribed === false) {
          twilioResult = await twilio.sendText(From, `*הוסרתם בצלחה*`);
        } else {
          twilioResult = await twilio.sendText(
            `${From}`,
            `*ישנה תקלה בהסרה, אנא צרו איתנו קשר במייל* info@ci-events.org`
          );
        }
        break;

      case InteractiveButtonPayload.confirm_remove_no:
        twilioResult = await twilio.sendTemplate(
          From,
          process.env.TWILIO_TEMPLATE_FIRST_MESSAGE!
        );
        break;
      default:
        throw new Error(
          `Bot.handleInteractiveMessage: Unsupported button payload: ${ButtonPayload}`
        );
    }

    return twilioResult;
  }

  private async handleListMessage(
    payload: TwilioWhatsappWebhookPayload
  ): Promise<MessageInstance> {
    const { From, ListId } = payload;

    let twilioResult;

    let region;
    switch (ListId) {
      case SelectRegionListId.select_regions_jerusalem:
        region = "jerusalem";
        break;
      case SelectRegionListId.select_regions_center:
        region = "center";
        break;
      case SelectRegionListId.select_regions_south:
        region = "south";
        break;
      case SelectRegionListId.select_regions_north:
        region = "north";
        break;
    }

    if (!region) {
      throw new Error(`Bot.handleListMessage: Unsupported ListId: ${ListId}`);
    }

    const ci_events = await supabase.getCIEventsByRegion(region);
    const filteredEvents = filterCIEventsByType(ci_events, [
      EventlyType.class,
      EventlyType.jam,
      EventlyType.jame, //handle old spelling mistake
      EventlyType.underscore,
      EventlyType.score,
    ]);
    const formattedEvents = formatCIEventsList(filteredEvents);
    if (formattedEvents) {
      const regionHebrew = districtOptions.find(
        (r) => r.value === region
      )?.label;
      const jamesTitle = `*ג׳אמים ושיעורים ב${regionHebrew} בשבוע הקרוב*`;
      twilioResult = await twilio.sendText(
        From,
        jamesTitle + "\n\n" + formattedEvents
      );
    } else {
      twilioResult = await twilio.sendText(
        From,
        emptyRegionMessage(region as Region)
      );
    }

    return twilioResult;
  }

  private async handleUpdateUserAndLogMessage(
    twilioResult: MessageInstance,
    payload: TwilioWhatsappWebhookPayload,
    startTime: number
  ): Promise<void> {
    const { WaId, ProfileName, Body, MessageType } = payload;

    const processingTime = Date.now();

    const user = await supabase.upsertUser({
      name: ProfileName,
      phoneNumber: WaId,
    });

    if (user) {
      await supabase.incrementMessageCount(WaId, +user.message_count);
    }

    const message = await supabase.receiveMessage({
      blob: payload,
      WaId: WaId,
      ProfileName: ProfileName,
      Body: Body,
      MessageType: MessageType,
      user_id: user.id,
      processing_time_ms: `${processingTime - startTime} `,
    });

    if (!message) {
      throw new Error(
        "Bot.handleUpdateUserAndLogMessage: Failed to receive message"
      );
    }

    if (twilioResult) {
      await supabase.logTwilioResult(
        twilioResult,
        message.id,
        user.id,
        process.env.TWILIO_PHONE_NUMBER!,
        user.phone,
        "user_message"
      );
    }
  }
}

export const bot = new Bot();
