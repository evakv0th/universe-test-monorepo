-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,
    "funnelStage" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacebookEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userAge" INTEGER NOT NULL,
    "userGender" TEXT NOT NULL,
    "userCity" TEXT NOT NULL,
    "userCountry" TEXT NOT NULL,
    "engagementType" TEXT NOT NULL,
    "referrer" TEXT,
    "videoId" TEXT,
    "adId" TEXT,
    "campaignId" TEXT,
    "clickPosition" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "purchaseAmount" TEXT,

    CONSTRAINT "FacebookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TiktokEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "followers" INTEGER NOT NULL,
    "engagementType" TEXT NOT NULL,
    "watchTime" INTEGER,
    "percentageWatched" INTEGER,
    "device" TEXT,
    "country" TEXT,
    "videoId" TEXT,
    "actionTime" TIMESTAMP(3),
    "profileId" TEXT,
    "purchasedItem" TEXT,
    "purchaseAmount" TEXT,

    CONSTRAINT "TiktokEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FacebookEvent_eventId_key" ON "FacebookEvent"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "TiktokEvent_eventId_key" ON "TiktokEvent"("eventId");

-- AddForeignKey
ALTER TABLE "FacebookEvent" ADD CONSTRAINT "FacebookEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TiktokEvent" ADD CONSTRAINT "TiktokEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
