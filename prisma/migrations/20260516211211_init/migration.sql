-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "notes" TEXT,
    "interestTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "anniversary" TEXT,
    "partnerName" TEXT,
    "origin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaceMaker" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "property" TEXT NOT NULL,
    "title" TEXT,
    "voiceStyle" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlaceMaker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelationshipRecord" (
    "id" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "placeMakerId" TEXT NOT NULL,
    "visits" INTEGER NOT NULL DEFAULT 0,
    "themes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RelationshipRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawNote" (
    "id" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "sourcePlaceMakerId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sensitivity" TEXT NOT NULL DEFAULT 'medium',
    "themes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "suggestedRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RawNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brief" (
    "id" TEXT NOT NULL,
    "recipientPlaceMakerId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sensitivity" TEXT NOT NULL DEFAULT 'medium',
    "redactionNote" TEXT,
    "sourceRawNoteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Brief_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageDraft" (
    "id" TEXT NOT NULL,
    "fromPlaceMakerId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "intent" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "draftId" TEXT,
    "fromPlaceMakerId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "twilioSid" TEXT,
    "deliveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestReply" (
    "id" TEXT NOT NULL,
    "fromGuestId" TEXT NOT NULL,
    "toPlaceMakerId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestReply_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Guest_phone_key" ON "Guest"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "PlaceMaker_slug_key" ON "PlaceMaker"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "RelationshipRecord_guestId_placeMakerId_key" ON "RelationshipRecord"("guestId", "placeMakerId");

-- CreateIndex
CREATE UNIQUE INDEX "Message_draftId_key" ON "Message"("draftId");

-- AddForeignKey
ALTER TABLE "RelationshipRecord" ADD CONSTRAINT "RelationshipRecord_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationshipRecord" ADD CONSTRAINT "RelationshipRecord_placeMakerId_fkey" FOREIGN KEY ("placeMakerId") REFERENCES "PlaceMaker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RawNote" ADD CONSTRAINT "RawNote_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RawNote" ADD CONSTRAINT "RawNote_sourcePlaceMakerId_fkey" FOREIGN KEY ("sourcePlaceMakerId") REFERENCES "PlaceMaker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Brief" ADD CONSTRAINT "Brief_recipientPlaceMakerId_fkey" FOREIGN KEY ("recipientPlaceMakerId") REFERENCES "PlaceMaker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Brief" ADD CONSTRAINT "Brief_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Brief" ADD CONSTRAINT "Brief_sourceRawNoteId_fkey" FOREIGN KEY ("sourceRawNoteId") REFERENCES "RawNote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageDraft" ADD CONSTRAINT "MessageDraft_fromPlaceMakerId_fkey" FOREIGN KEY ("fromPlaceMakerId") REFERENCES "PlaceMaker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageDraft" ADD CONSTRAINT "MessageDraft_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_fromPlaceMakerId_fkey" FOREIGN KEY ("fromPlaceMakerId") REFERENCES "PlaceMaker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "MessageDraft"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestReply" ADD CONSTRAINT "GuestReply_fromGuestId_fkey" FOREIGN KEY ("fromGuestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestReply" ADD CONSTRAINT "GuestReply_toPlaceMakerId_fkey" FOREIGN KEY ("toPlaceMakerId") REFERENCES "PlaceMaker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
