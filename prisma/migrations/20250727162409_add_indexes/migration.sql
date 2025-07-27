-- CreateIndex
CREATE INDEX "Event_timestamp_idx" ON "Event"("timestamp");

-- CreateIndex
CREATE INDEX "Event_source_idx" ON "Event"("source");

-- CreateIndex
CREATE INDEX "Event_funnelStage_idx" ON "Event"("funnelStage");

-- CreateIndex
CREATE INDEX "Event_eventType_idx" ON "Event"("eventType");

-- CreateIndex
CREATE INDEX "Event_source_timestamp_idx" ON "Event"("source", "timestamp");

-- CreateIndex
CREATE INDEX "Event_timestamp_funnelStage_idx" ON "Event"("timestamp", "funnelStage");

-- CreateIndex
CREATE INDEX "FacebookEvent_engagementType_idx" ON "FacebookEvent"("engagementType");

-- CreateIndex
CREATE INDEX "FacebookEvent_campaignId_idx" ON "FacebookEvent"("campaignId");

-- CreateIndex
CREATE INDEX "FacebookEvent_purchaseAmount_idx" ON "FacebookEvent"("purchaseAmount");

-- CreateIndex
CREATE INDEX "FacebookEvent_engagementType_campaignId_idx" ON "FacebookEvent"("engagementType", "campaignId");

-- CreateIndex
CREATE INDEX "FacebookEvent_engagementType_purchaseAmount_idx" ON "FacebookEvent"("engagementType", "purchaseAmount");

-- CreateIndex
CREATE INDEX "TiktokEvent_engagementType_idx" ON "TiktokEvent"("engagementType");

-- CreateIndex
CREATE INDEX "TiktokEvent_purchaseAmount_idx" ON "TiktokEvent"("purchaseAmount");

-- CreateIndex
CREATE INDEX "TiktokEvent_engagementType_purchaseAmount_idx" ON "TiktokEvent"("engagementType", "purchaseAmount");
