-- CreateIndex
CREATE INDEX "FacebookEvent_userAge_idx" ON "FacebookEvent"("userAge");

-- CreateIndex
CREATE INDEX "FacebookEvent_userGender_idx" ON "FacebookEvent"("userGender");

-- CreateIndex
CREATE INDEX "FacebookEvent_userCity_idx" ON "FacebookEvent"("userCity");

-- CreateIndex
CREATE INDEX "FacebookEvent_userCountry_idx" ON "FacebookEvent"("userCountry");

-- CreateIndex
CREATE INDEX "FacebookEvent_userAge_userGender_userCity_userCountry_idx" ON "FacebookEvent"("userAge", "userGender", "userCity", "userCountry");

-- CreateIndex
CREATE INDEX "TiktokEvent_followers_idx" ON "TiktokEvent"("followers");

-- CreateIndex
CREATE INDEX "TiktokEvent_watchTime_idx" ON "TiktokEvent"("watchTime");

-- CreateIndex
CREATE INDEX "TiktokEvent_percentageWatched_idx" ON "TiktokEvent"("percentageWatched");

-- CreateIndex
CREATE INDEX "TiktokEvent_device_idx" ON "TiktokEvent"("device");

-- CreateIndex
CREATE INDEX "TiktokEvent_country_idx" ON "TiktokEvent"("country");

-- CreateIndex
CREATE INDEX "TiktokEvent_followers_watchTime_percentageWatched_device_co_idx" ON "TiktokEvent"("followers", "watchTime", "percentageWatched", "device", "country");
