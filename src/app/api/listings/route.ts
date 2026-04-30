import { apiHandler } from "@/lib/api/api-handler";
import { requireAuthUser } from "@/lib/auth";
import { parseJsonBody } from "@/lib/api/request-body";
import { createListing, searchActiveListings } from "@/lib/marketplace/listings";
import { CreateListingSchema } from "@/lib/marketplace/schemas";
import { guardMarketplaceApi } from "@/lib/marketplace/feature-flag";
import { NextRequest, NextResponse } from "next/server";

export const GET = apiHandler(async (request: NextRequest) => {
  const blocked = await guardMarketplaceApi();
  if (blocked) return blocked;

  const result = await searchActiveListings(request.nextUrl.searchParams);
  if (!result.ok) return result.response;
  const { listings, total, page, limit, totalPages } = result;
  return NextResponse.json({ listings, total, page, limit, totalPages });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const blocked = await guardMarketplaceApi();
  if (blocked) return blocked;

  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, CreateListingSchema);
  if (!parsed.ok) return parsed.response;

  const result = await createListing(auth.user.id, parsed.body);
  if (!result.ok) return result.response;
  return NextResponse.json({ listing: result.listing }, { status: 201 });
});
