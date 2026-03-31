import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/request-body";
import { getOrCreateMission, trackMission, claimMissionReward, pathToMissionTask } from "@/lib/honey-missions";

export async function GET() {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const mission = await getOrCreateMission(auth.user.id);
  return NextResponse.json({ mission });
}

export async function POST(request: Request) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody<{
    action: "track" | "track-by-path" | "claim";
    task?: "checkedPrice" | "addedCard" | "viewedSet";
    path?: string;
  }>(request as never);
  if (!parsed.ok) return parsed.response;
  const { action } = parsed.body;

  if (action === "track") {
    const { task } = parsed.body;
    if (!task || !["checkedPrice", "addedCard", "viewedSet"].includes(task)) {
      return NextResponse.json({ error: "Invalid task" }, { status: 400 });
    }
    const mission = await trackMission(auth.user.id, task);
    return NextResponse.json({ mission });
  }

  if (action === "track-by-path") {
    const { path } = parsed.body;
    if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });
    const task = pathToMissionTask(path);
    if (!task) return NextResponse.json({ mission: await getOrCreateMission(auth.user.id) });
    const mission = await trackMission(auth.user.id, task);
    return NextResponse.json({ mission });
  }

  if (action === "claim") {
    const result = await claimMissionReward(auth.user.id);
    if (!result.claimed) {
      return NextResponse.json({ error: "Mission not completed or already claimed" }, { status: 400 });
    }
    return NextResponse.json({ mission: result.mission, earned: result.earned });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
