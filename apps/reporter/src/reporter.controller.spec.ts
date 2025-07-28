/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { PrismaService } from "@app/prisma";
import { BadRequestException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { ReporterService } from "./reporter.service";

describe("ReporterService", () => {
  let service: ReporterService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReporterService,
        {
          provide: PrismaService,
          useValue: {
            event: {
              groupBy: jest.fn(),
            },
            facebookEvent: {
              findMany: jest.fn(),
              groupBy: jest.fn(),
              count: jest.fn(),
              aggregate: jest.fn(),
            },
            tiktokEvent: {
              findMany: jest.fn(),
              groupBy: jest.fn(),
              count: jest.fn(),
              aggregate: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ReporterService>(ReporterService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it("should return grouped event stats for valid query", async () => {
    const rawQuery = {
      from: new Date("2024-01-01"),
      to: new Date("2024-01-31"),
      source: "facebook",
      funnelStage: "top",
      eventType: "click",
    };

    const expectedResult = [
      {
        eventType: "click",
        funnelStage: "top",
        source: "facebook",
        _count: { _all: 10 },
      },
    ];

    (prisma.event.groupBy as jest.Mock).mockResolvedValue(expectedResult);

    const result = await service.getEventStats(rawQuery);
    expect(result).toEqual(expectedResult);

    expect(prisma.event.groupBy).toHaveBeenCalledWith({
      by: ["eventType", "funnelStage", "source"],
      where: {
        timestamp: {
          gte: new Date("2024-01-01T00:00:00.000Z"),
          lte: new Date("2024-01-31T23:59:59.999Z"),
        },
        source: "facebook",
        funnelStage: "top",
        eventType: "click",
      },
      _count: { _all: true },
    });
  });

  describe("getRevenueStats", () => {
    it("should return aggregated revenue stats for facebook", async () => {
      const rawQuery = {
        from: new Date("2024-01-01"),
        to: new Date("2024-01-31"),
        source: "facebook",
        campaignId: "abc123",
      };

      const mockResults = [
        {
          purchaseAmount: 100,
          event: { eventType: "purchase", funnelStage: "bottom" },
        },
        {
          purchaseAmount: 200,
          event: { eventType: "purchase", funnelStage: "bottom" },
        },
      ];

      jest
        .spyOn(prisma.facebookEvent, "findMany")
        .mockResolvedValue(mockResults as any);

      const result = await service.getRevenueStats(rawQuery);

      expect(result).toEqual([
        {
          eventType: "purchase",
          funnelStage: "bottom",
          purchaseAmount: 300,
        },
      ]);
      expect(prisma.facebookEvent.findMany).toHaveBeenCalled();
    });

    it("should return aggregated revenue stats for tiktok", async () => {
      const rawQuery = {
        from: new Date("2024-01-01"),
        to: new Date("2024-01-31"),
        source: "tiktok",
      };

      const mockResults = [
        {
          purchaseAmount: 50,
          event: { eventType: "purchase", funnelStage: "bottom" },
        },
        {
          purchaseAmount: 70,
          event: { eventType: "purchase", funnelStage: "bottom" },
        },
      ];

      jest
        .spyOn(prisma.tiktokEvent, "findMany")
        .mockResolvedValue(mockResults as any);

      const result = await service.getRevenueStats(rawQuery);

      expect(result).toEqual([
        {
          eventType: "purchase",
          funnelStage: "bottom",
          purchaseAmount: 120,
        },
      ]);
      expect(prisma.tiktokEvent.findMany).toHaveBeenCalled();
    });

    it("should throw BadRequestException for invalid query", async () => {
      const rawQuery = { invalid: "data" };

      await expect(service.getRevenueStats(rawQuery)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("getDemographics", () => {
    it("should return facebook demographics when source is facebook", async () => {
      const rawQuery = {
        from: new Date("2024-01-01"),
        to: new Date("2024-01-31"),
        source: "facebook",
      };

      const mockTotalUsers = 100;
      const mockAgeGroups = [{ userAge: 25 }, { userAge: 32 }, { userAge: 25 }];
      const mockGenderDistribution = [
        { userGender: "male", _count: { userGender: 70 } },
        { userGender: "female", _count: { userGender: 30 } },
      ];
      const mockCountryDistribution = [
        { userCountry: "UK", _count: { userCountry: 80 } },
        { userCountry: "US", _count: { userCountry: 20 } },
      ];

      (prisma.facebookEvent.count as jest.Mock).mockResolvedValue(
        mockTotalUsers,
      );
      (prisma.facebookEvent.findMany as jest.Mock).mockResolvedValue(
        mockAgeGroups,
      );
      (prisma.facebookEvent.groupBy as jest.Mock)
        .mockResolvedValueOnce(mockGenderDistribution)
        .mockResolvedValueOnce(mockCountryDistribution);

      const result = await service.getDemographics(rawQuery);

      expect(result.totalUsers).toBe(mockTotalUsers);
      expect(result.userGenderDistribution).toEqual(mockGenderDistribution);
      expect(result.userCountryDistribution).toEqual(mockCountryDistribution);
      expect(result.avgCountByGroup).toEqual([{ range: "25–34", count: 3 }]);
    });

    it("should return tiktok demographics when source is tiktok", async () => {
      const rawQuery = {
        from: new Date("2024-01-01"),
        to: new Date("2024-01-31"),
        source: "tiktok",
      };

      const mockTotalUsers = 42;
      const mockFollowers = { _sum: { followers: 42000 } };
      const mockCountryDist = [
        { country: "US", _count: { country: 20 } },
        { country: "UK", _count: { country: 22 } },
      ];
      const mockDeviceDist = [
        { device: "android", _count: { device: 30 } },
        { device: "ios", _count: { device: 12 } },
      ];

      (prisma.tiktokEvent.count as jest.Mock).mockResolvedValue(mockTotalUsers);
      (prisma.tiktokEvent.aggregate as jest.Mock).mockResolvedValue(
        mockFollowers,
      );
      (prisma.tiktokEvent.groupBy as jest.Mock)
        .mockResolvedValueOnce(mockCountryDist)
        .mockResolvedValueOnce(mockDeviceDist);

      const result = await service.getDemographics(rawQuery);

      expect(result.totalUsers).toBe(mockTotalUsers);
      expect(result.avgFollowers).toEqual(mockFollowers);
      expect(result.countryDistribution).toEqual(mockCountryDist);
      expect(result.deviceDistribution).toEqual(mockDeviceDist);
    });
  });
});
