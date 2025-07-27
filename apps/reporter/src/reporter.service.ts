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
      return await this.prisma.facebookEvent.groupBy({
        by: ["userAge", "userGender", "userCity", "userCountry"],
        where: {
          event: {
            timestamp: timestampFilter,
            source: "facebook",
          },
        },
        _count: true,
      });
    }

    return await this.prisma.tiktokEvent.groupBy({
      by: ["followers", "watchTime", "percentageWatched", "device", "country"],
      where: {
        event: {
          timestamp: timestampFilter,
          source: "tiktok",
        },
      },
      _count: true,
    });
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
    const formattedErrors = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    throw new BadRequestException({
      message: "Validation failed",
      errors: formattedErrors,
    });
  }
}
