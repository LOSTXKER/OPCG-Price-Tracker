-- Cancel Reasons (subscription churn analytics)
CREATE TABLE "CancelReason" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "comment" VARCHAR(1000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CancelReason_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CancelReason_userId_idx" ON "CancelReason"("userId");
CREATE INDEX "CancelReason_createdAt_idx" ON "CancelReason"("createdAt" DESC);

ALTER TABLE "CancelReason" ADD CONSTRAINT "CancelReason_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
