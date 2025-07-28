import {
  DemographicsQuery,
  demographicsQuerySchema,
  EventStatsQuery,
  eventStatsQuerySchema,
  RevenueStatsQuery,
  revenueStatsQuerySchema,
} from "@app/constants";
import { PrismaService } from "@app/prisma";
import { BadRequestException, Injectable } from "@nestjs/common";
import { ZodError } from "zod";

type RevenueArray = Array<{
  purchaseAmount: number | null;
  event: { eventType: string; funnelStage: string };
}>;

@Injectable()
export class ReporterService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return "Reporter is up";
  }

  async getEventStats(rawQuery: any) {
    let query: EventStatsQuery;

    try {
      query = eventStatsQuerySchema.parse(rawQuery);
    } catch (err: any) {
      this.handleZodError(err);
    }

    const where = {
      ...(query.from &&
        query.to && {
          timestamp: this._getTimestampRange(query.from, query.to),
        }),
      ...(query.source && { source: query.source }),
      ...(query.funnelStage && { funnelStage: query.funnelStage }),
      ...(query.eventType && { eventType: query.eventType }),
    };

    return this.prisma.event.groupBy({
      by: ["eventType", "funnelStage", "source"],
      where,
      _count: {
        _all: true,
      },
    });
  }

  async getRevenueStats(rawQuery: any) {
    let query: RevenueStatsQuery;
    try {
      query = revenueStatsQuerySchema.parse(rawQuery);
    } catch (err) {
      this.handleZodError(err);
    }

    const timestampFilter = this._getTimestampRange(query.from, query.to);

    const source = query.source;
    return this._aggregateRevenueStats(
      source,
      timestampFilter,
      query.campaignId,
    );
  }

  async getDemographics(rawQuery: any) {
    let query: DemographicsQuery;
    try {
      query = demographicsQuerySchema.parse(rawQuery);
    } catch (err) {
      this.handleZodError(err);
    }

    const timestampFilter = this._getTimestampRange(query.from, query.to);

    if (query.source === "facebook") {
      const totalUsers = await this.prisma.facebookEvent.count({
        where: {
          event: {
            timestamp: timestampFilter,
            source: "facebook",
          },
        },
      });

      const rawAges = await this.prisma.facebookEvent.findMany({
        where: {
          event: {
            timestamp: timestampFilter,
            source: "facebook",
          },
        },
        select: {
          userAge: true,
        },
      });

      const ageGroupsCount: Record<string, number> = {};

      for (const { userAge } of rawAges) {
        const group = this.getAgeRange(userAge);
        ageGroupsCount[group] = (ageGroupsCount[group] || 0) + 1;
      }

      const avgCountByGroup = Object.entries(ageGroupsCount).map(
        ([range, count]) => ({
          range,
          count,
        }),
      );

      const userGenderDistribution = await this.prisma.facebookEvent.groupBy({
        by: ["userGender"],
        where: {
          event: {
            timestamp: timestampFilter,
            source: "facebook",
          },
        },
        _count: {
          userGender: true,
        },
        orderBy: {
          _count: {
            userGender: "desc",
          },
        },
      });

      const userCountryDistribution = await this.prisma.facebookEvent.groupBy({
        by: ["userCountry"],
        where: {
          event: {
            timestamp: timestampFilter,
            source: "facebook",
          },
        },
        _count: {
          userCountry: true,
        },
        orderBy: {
          _count: {
            userCountry: "desc",
          },
        },
      });

      return {
        totalUsers,
        userGenderDistribution,
        avgCountByGroup,
        userCountryDistribution,
      };
    }

    return {
      totalUsers: await this.prisma.tiktokEvent.count({
        where: {
          event: {
            timestamp: timestampFilter,
            source: "tiktok",
          },
        },
      }),
      avgFollowers: await this.prisma.tiktokEvent.aggregate({
        where: {
          event: {
            timestamp: timestampFilter,
            source: "tiktok",
          },
        },
        _sum: {
          followers: true,
        },
      }),
      countryDistribution: await this.prisma.tiktokEvent.groupBy({
        by: ["country"],
        where: {
          event: {
            timestamp: timestampFilter,
            source: "tiktok",
          },
          country: {
            not: null,
          },
        },
        _count: {
          country: true,
        },
        orderBy: {
          _count: {
            country: "desc",
          },
        },
      }),
      deviceDistribution: await this.prisma.tiktokEvent.groupBy({
        by: ["device"],
        where: {
          event: {
            timestamp: timestampFilter,
            source: "tiktok",
          },
          device: {
            not: null,
          },
        },
        _count: {
          device: true,
        },
        orderBy: {
          _count: {
            device: "desc",
          },
        },
      }),
    };
  }

  private _getTimestampRange(from: Date, to: Date) {
    return {
      gte: new Date(`${from.toISOString().slice(0, 10)}T00:00:00.000Z`),
      lte: new Date(`${to.toISOString().slice(0, 10)}T23:59:59.999Z`),
    };
  }

  private async _aggregateRevenueStats(
    source: "facebook" | "tiktok",
    timestampFilter: any,
    campaignId?: string,
  ) {
    if (source === "facebook") {
      const results = await this.prisma.facebookEvent.findMany({
        where: {
          engagementType: "bottom",
          purchaseAmount: { not: null },
          ...(campaignId && { campaignId }),
          event: {
            timestamp: timestampFilter,
            source,
          },
        },
        include: {
          event: {
            select: {
              eventType: true,
              funnelStage: true,
            },
          },
        },
      });

      return this._reduceRevenue(results as RevenueArray);
    }

    const results = await this.prisma.tiktokEvent.findMany({
      where: {
        engagementType: "bottom",
        purchaseAmount: { not: null },
        event: {
          timestamp: timestampFilter,
          source,
        },
      },
      include: {
        event: {
          select: {
            eventType: true,
            funnelStage: true,
          },
        },
      },
    });

    return this._reduceRevenue(results as RevenueArray);
  }

  private _reduceRevenue(rows: RevenueArray) {
    const aggregated = rows.reduce(
      (acc, row) => {
        const key = `${row.event.eventType}-${row.event.funnelStage}`;
        if (!acc[key]) {
          acc[key] = {
            eventType: row.event.eventType,
            funnelStage: row.event.funnelStage,
            purchaseAmount: 0,
          };
        }
        acc[key].purchaseAmount += row.purchaseAmount || 0;
        return acc;
      },
      {} as Record<
        string,
        { eventType: string; funnelStage: string; purchaseAmount: number }
      >,
    );

    return Object.values(aggregated);
  }

  private handleZodError(err: any): never {
    if (err instanceof ZodError) {
      const formattedErrors = err.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      throw new BadRequestException({
        message: "Validation failed",
        errors: formattedErrors,
      });
    } else {
      throw new BadRequestException({
        message: "Invalid query parameters",
        error: err.message,
      });
    }
  }

  private getAgeRange(age: number): string {
    if (age >= 13 && age <= 17) return "13–17";
    if (age >= 18 && age <= 24) return "18–24";
    if (age >= 25 && age <= 34) return "25–34";
    if (age >= 35 && age <= 44) return "35–44";
    if (age >= 45 && age <= 54) return "45–54";
    if (age >= 55 && age <= 64) return "55–64";
    if (age >= 65) return "65+";
    return "Unknown";
  }
}
