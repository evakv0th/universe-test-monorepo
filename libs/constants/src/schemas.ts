import { z } from "zod";

export const FunnelStageSchema = z.union([
  z.literal("top"),
  z.literal("bottom"),
]);

export const FacebookTopEventTypeSchema = z.union([
  z.literal("ad.view"),
  z.literal("page.like"),
  z.literal("comment"),
  z.literal("video.view"),
]);
export const FacebookBottomEventTypeSchema = z.union([
  z.literal("ad.click"),
  z.literal("form.submission"),
  z.literal("checkout.complete"),
]);
export const FacebookEventTypeSchema = z.union([
  FacebookTopEventTypeSchema,
  FacebookBottomEventTypeSchema,
]);

export const FacebookUserLocationSchema = z.object({
  country: z.string().min(1, "Country cannot be empty"),
  city: z.string().min(1, "City cannot be empty"),
});

export const FacebookUserSchema = z.object({
  userId: z.string().uuid("Invalid user ID format"),
  name: z.string().min(1, "Name cannot be empty"),
  age: z.number().int().positive("Age must be a positive integer"),
  gender: z.union([
    z.literal("male"),
    z.literal("female"),
    z.literal("non-binary"),
  ]),
  location: FacebookUserLocationSchema,
});

export const FacebookEngagementTopSchema = z.object({
  actionTime: z.string(),
  referrer: z.union([
    z.literal("newsfeed"),
    z.literal("marketplace"),
    z.literal("groups"),
  ]),
  videoId: z.string().nullable(),
});
export const FacebookEngagementBottomSchema = z.object({
  adId: z.string().min(1, "Ad ID cannot be empty"),
  campaignId: z.string().min(1, "Campaign ID cannot be empty"),
  clickPosition: z.union([
    z.literal("top_left"),
    z.literal("bottom_right"),
    z.literal("center"),
  ]),
  device: z.union([z.literal("mobile"), z.literal("desktop")]),
  browser: z.union([
    z.literal("Chrome"),
    z.literal("Firefox"),
    z.literal("Safari"),
  ]),
  purchaseAmount: z.string().nullable(),
});
export const FacebookEngagementSchema = z.union([
  FacebookEngagementTopSchema,
  FacebookEngagementBottomSchema,
]);

export const FacebookEventSchema = z.object({
  eventId: z.string(),
  timestamp: z.string(),
  source: z.literal("facebook"),
  funnelStage: FunnelStageSchema,
  eventType: FacebookEventTypeSchema,
  data: z.object({
    user: FacebookUserSchema,
    engagement: FacebookEngagementSchema,
  }),
});

export const TiktokTopEventTypeSchema = z.union([
  z.literal("video.view"),
  z.literal("like"),
  z.literal("share"),
  z.literal("comment"),
]);
export const TiktokBottomEventTypeSchema = z.union([
  z.literal("profile.visit"),
  z.literal("purchase"),
  z.literal("follow"),
]);
export const TiktokEventTypeSchema = z.union([
  TiktokTopEventTypeSchema,
  TiktokBottomEventTypeSchema,
]);

export const TiktokUserSchema = z.object({
  userId: z.string(),
  username: z.string().min(1, "Username cannot be empty"),
  followers: z
    .number()
    .int()
    .nonnegative("Followers must be a non-negative integer"),
});

export const TiktokEngagementTopSchema = z.object({
  watchTime: z.number().positive("Watch time must be positive"),
  percentageWatched: z
    .number()
    .min(0)
    .max(100, "Percentage watched must be between 0 and 100"),
  device: z.union([
    z.literal("Android"),
    z.literal("iOS"),
    z.literal("Desktop"),
  ]),
  country: z.string().min(1, "Country cannot be empty"),
  videoId: z.string().min(1, "Video ID cannot be empty"),
});
export const TiktokEngagementBottomSchema = z.object({
  actionTime: z.string(),
  profileId: z.string().nullable(),
  purchasedItem: z.string().nullable(),
  purchaseAmount: z.string().nullable(),
});
export const TiktokEngagementSchema = z.union([
  TiktokEngagementTopSchema,
  TiktokEngagementBottomSchema,
]);

// 10. Tiktok Event
export const TiktokEventSchema = z.object({
  eventId: z.string(),
  timestamp: z.string(),
  source: z.literal("tiktok"),
  funnelStage: FunnelStageSchema,
  eventType: TiktokEventTypeSchema,
  data: z.object({
    user: TiktokUserSchema,
    engagement: TiktokEngagementSchema,
  }),
});

export const EventSchema = z.union([FacebookEventSchema, TiktokEventSchema]);

export const EventsArraySchema = z.array(EventSchema);

export const EventMessageSchema = z.object({
  eventsChunkId: z.string(),
  id: z.string(),
  source: z.string(),
  data: z.any(),
});

export const commonDateRangeSchema = z
  .object({
    from: z.preprocess(
      (val) =>
        typeof val === "string" || val instanceof Date ? new Date(val) : val,
      z.date(),
    ),
    to: z.preprocess(
      (val) =>
        typeof val === "string" || val instanceof Date ? new Date(val) : val,
      z.date(),
    ),
  })
  .refine((data) => data.from <= data.to, {
    message: "`from` must be earlier than or equal to `to`",
    path: ["to"],
  });

export const eventStatsQuerySchema = commonDateRangeSchema.extend({
  source: z.enum(["facebook", "tiktok"]).optional(),
  funnelStage: z.enum(["top", "bottom"]).optional(),
  eventType: z.string().optional(),
});

export const revenueStatsQuerySchema = commonDateRangeSchema.extend({
  source: z.enum(["facebook", "tiktok"]),
  campaignId: z.string().optional(),
});

export const demographicsQuerySchema = commonDateRangeSchema.extend({
  source: z.enum(["facebook", "tiktok"]),
});

export type EventStatsQuery = z.infer<typeof eventStatsQuerySchema>;
export type RevenueStatsQuery = z.infer<typeof revenueStatsQuerySchema>;
export type DemographicsQuery = z.infer<typeof demographicsQuerySchema>;
