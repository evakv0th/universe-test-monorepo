/* eslint-disable @typescript-eslint/unbound-method */
import { PrismaService } from "@app/prisma";
import { Logger } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { JetStreamSubscription } from "nats";
import { SharedCollectorService } from "./shared-collector.service";

describe("SharedCollectorService", () => {
  let service: SharedCollectorService;
  let prisma: PrismaService;

  beforeEach(() => {
    prisma = {
      event: {
        create: jest.fn(),
      },
    } as any;
    const labelsMock = jest.fn(() => ({ inc: jest.fn() }));
    service = new SharedCollectorService(prisma, "facebook");
    service["logger"] = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    } as unknown as Logger;
    service["successfulEventsCounter"] = { labels: labelsMock } as any;
    service["failedEventsCounter"] = { labels: labelsMock } as any;
    service["__labelsMock"] = labelsMock;
  });

  describe("saveEventToDB", () => {
    it("should save facebook event to DB", async () => {
      const event = {
        eventId: "1",
        timestamp: new Date().toISOString(),
        source: "facebook",
        funnelStage: "top",
        eventType: "click",
        data: {
          user: {
            userId: "fb1",
            name: "John",
            age: 30,
            gender: "male",
            location: { city: "London", country: "UK" },
          },
          engagement: {
            referrer: "google",
            videoId: "vid1",
            adId: "ad1",
            campaignId: "camp1",
            clickPosition: "top",
            device: "mobile",
            browser: "chrome",
            purchaseAmount: "100",
          },
        },
      };
      const spy = jest.spyOn(service as any, "mapFacebookEvent");
      await service.saveEventToDB(event as any);
      expect(prisma.event.create).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith(event);
    });

    it("should save tiktok event to DB", async () => {
      service = new SharedCollectorService(prisma, "tiktok");
      service["logger"] = {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
      } as unknown as Logger;
      service["successfulEventsCounter"] = {
        labels: () => ({ inc: jest.fn() }),
      } as any;
      service["failedEventsCounter"] = {
        labels: () => ({ inc: jest.fn() }),
      } as any;

      const event = {
        eventId: "2",
        timestamp: new Date().toISOString(),
        source: "tiktok",
        funnelStage: "engaged",
        eventType: "view",
        data: {
          user: {
            userId: "tk1",
            username: "tiktokuser",
            followers: 1000,
          },
          engagement: {
            watchTime: 120,
            percentageWatched: 80,
            device: "android",
            country: "US",
            videoId: "vid2",
            actionTime: new Date().toISOString(),
            profileId: "profile1",
            purchasedItem: "item1",
            purchaseAmount: "50",
          },
        },
      };
      const spy = jest.spyOn(service as any, "mapTiktokEvent");
      await service.saveEventToDB(event as any);
      expect(prisma.event.create).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith(event);
    });
  });

  describe("processMessages", () => {
    it("should log error if sub is not initialized", async () => {
      service["sub"] = undefined;
      await service.processMessages();
      expect(service["logger"].error).toHaveBeenCalledWith(
        "Subscription not initialized",
      );
    });

    it("should process messages and ack on success", async () => {
      const fakeMsg = {
        data: {},
        ack: jest.fn(),
      };
      const fakeDecoded = {
        data: {
          eventId: "1",
          timestamp: new Date().toISOString(),
          source: "facebook",
          funnelStage: "top",
          eventType: "click",
          data: {
            user: {
              userId: "fb1",
              name: "John",
              age: 30,
              gender: "male",
              location: { city: "London", country: "UK" },
            },
            engagement: {},
          },
        },
      };
      service["sub"] = {
        [Symbol.asyncIterator]: function* () {
          yield fakeMsg;
        },
      } as any;
      service["jsc"] = {
        decode: jest.fn().mockReturnValue(fakeDecoded),
      } as any;
      jest.spyOn(service, "saveEventToDB").mockResolvedValue(undefined);

      await service.processMessages();

      expect(service["logger"].log).toHaveBeenCalledWith(
        "Received click from facebook",
      );
      expect(service.saveEventToDB).toHaveBeenCalledWith(fakeDecoded.data);
      expect(fakeMsg.ack).toHaveBeenCalled();
      expect(service["successfulEventsCounter"].labels).toHaveBeenCalledWith(
        "facebook",
      );
    });

    it("should log error and increment failed counter on exception", async () => {
      const fakeMsg = {
        data: {},
        ack: jest.fn(),
      };
      service["sub"] = {
        [Symbol.asyncIterator]: function* () {
          yield fakeMsg;
        },
      } as any;
      service["jsc"] = {
        decode: jest.fn().mockImplementation(() => {
          throw new Error("decode error");
        }),
      } as any;

      await service.processMessages();

      expect(service["failedEventsCounter"].labels).toHaveBeenCalledWith(
        "facebook",
      );
      expect(service["logger"].error).toHaveBeenCalledWith(
        "Failed to process message: decode error",
      );
    });
  });
});

describe("SharedCollectorService (integration)", () => {
  let service: SharedCollectorService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SharedCollectorService,
        {
          provide: PrismaService,
          useValue: {
            event: {
              create: jest.fn().mockResolvedValue({}),
            },
          },
        },
        {
          provide: "SOURCE_NAME",
          useValue: "facebook",
        },
      ],
    }).compile();

    service = module.get(SharedCollectorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should increment failed counter and log error on decode failure", async () => {
    const fakeMsg = {
      data: Buffer.from("invalid"),
      ack: jest.fn(),
    };

    service["jsc"] = {
      decode: jest.fn(() => {
        throw new Error("decode error");
      }),
    } as any;

    service["sub"] = {
      [Symbol.asyncIterator]: function* () {
        yield fakeMsg;
      },
    } as unknown as JetStreamSubscription;

    const failedCounter = { inc: jest.fn() };
    service["failedEventsCounter"] = { labels: () => failedCounter } as any;
    service["logger"] = {
      error: jest.fn(),
      log: jest.fn(),
      warn: jest.fn(),
    } as any;

    await service.processMessages();

    expect(failedCounter.inc).toHaveBeenCalled();
    expect(service["logger"].error).toHaveBeenCalledWith(
      "Failed to process message: decode error",
    );
  });
});
