import { requireAuthUser } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import { apiHandler } from "@/lib/api/api-handler";
import { getDashboardSnapshot } from "@/lib/me/dashboard";
import { buildProfileUpdate } from "@/lib/me/profile";
import { UpdateProfileSchema } from "@/lib/me/schemas";
import {
  getEntitlements,
  getPrivacySettings,
  upsertPrivacySettings,
} from "@/lib/users";
import { NextRequest, NextResponse } from "next/server";

export const GET = apiHandler(async () => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const dbUser = auth.user;

  const [snapshot, privacy, entitlements] = await Promise.all([
    getDashboardSnapshot(dbUser),
    getPrivacySettings(dbUser.id),
    getEntitlements(dbUser.id),
  ]);
  return NextResponse.json({
    user: {
      ...dbUser,
      ...stripSatelliteMeta(privacy),
      ...stripSatelliteMeta(entitlements),
    },
    ...snapshot,
  });
});

export const PATCH = apiHandler(async (request: NextRequest) => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const dbUser = auth.user;

  const parsed = await parseJsonBody(request, UpdateProfileSchema);
  if (!parsed.ok) return parsed.response;

  const result = await buildProfileUpdate(dbUser.id, parsed.body);
  if (!result.ok) return result.response;

  const hasUserUpdate = Object.keys(result.userData).length > 0;
  const hasPrivacyUpdate = Object.keys(result.privacyData).length > 0;

  const [updatedUser, privacy, entitlements] = await Promise.all([
    hasUserUpdate
      ? prisma.user.update({ where: { id: dbUser.id }, data: result.userData })
      : prisma.user.findUniqueOrThrow({ where: { id: dbUser.id } }),
    hasPrivacyUpdate
      ? upsertPrivacySettings(dbUser.id, result.privacyData)
      : getPrivacySettings(dbUser.id),
    getEntitlements(dbUser.id),
  ]);

  return NextResponse.json({
    user: {
      ...updatedUser,
      ...stripSatelliteMeta(privacy),
      ...stripSatelliteMeta(entitlements),
    },
  });
});

/**
 * Project a 1:1 satellite row (privacy / entitlements) into the legacy flat
 * `user` shape that existing clients consume. We strip the relation primary
 * key + audit cols because they would shadow `User.userId` / `User.updatedAt`.
 */
function stripSatelliteMeta<T extends { userId: string; updatedAt: Date }>(satellite: T) {
  const { userId: _userId, updatedAt: _updatedAt, ...rest } = satellite;
  void _userId;
  void _updatedAt;
  return rest;
}

export const DELETE = apiHandler(async () => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const dbUser = auth.user;

  await prisma.user.update({
    where: { id: dbUser.id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
});
