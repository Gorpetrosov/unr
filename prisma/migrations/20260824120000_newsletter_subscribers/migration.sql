-- CreateEnum
CREATE TYPE "SubscriberStatus" AS ENUM ('pending', 'active', 'unsubscribed');

-- CreateTable
CREATE TABLE "subscribers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "SubscriberStatus" NOT NULL DEFAULT 'pending',
    "confirm_token" TEXT NOT NULL,
    "unsubscribe_token" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "confirmed_at" TIMESTAMP(3),
    "unsubscribed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscribers_email_key" ON "subscribers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "subscribers_confirm_token_key" ON "subscribers"("confirm_token");

-- CreateIndex
CREATE UNIQUE INDEX "subscribers_unsubscribe_token_key" ON "subscribers"("unsubscribe_token");

-- CreateIndex
CREATE INDEX "subscribers_status_created_at_idx" ON "subscribers"("status", "created_at");
