import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/api/auth";
import { apiHandler } from "@/lib/api/api-handler";
import { parseJsonBody } from "@/lib/api/request-body";
import {
  getOrCreateMission,
  trackMissionByPath,
  trackMission,
  claimTaskReward,
  claimBonusReward,
  serializeMission,
} from "@/lib/honey/missions";

export const GET = apiHandler(async () => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const mission = await getOrCreateMission(auth.user.id);
  return NextResponse.json({ mission: await serializeMission(mission) });
});

export const POST = apiHandler(async (request) => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody<{
    action: "track" | "track-by-path" | "claim-task" | "claim-bonus";
    task?: string;
    path?: string;
    taskId?: string;
    shareCompleted?: boolean;
  }>(request);
  if (!parsed.ok) return parsed.response;
  const { action } = parsed.body;

  if (action === "track") {
    const { task, shareCompleted } = parsed.body;
    if (!task) return NextResponse.json({ error: "Invalid task" }, { status: 400 });
    try {
      const mission = await trackMission(auth.user.id, task, { shareCompleted });
      return NextResponse.json({ mission: await serializeMission(mission) });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
  }

  if (action === "track-by-path") {
    const { path } = parsed.body;
    if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });
    const mission = await trackMissionByPath(auth.user.id, path);
    return NextResponse.json({ mission: await serializeMission(mission) });
  }

  if (action === "claim-task") {
    const taskId = parsed.body.taskId ?? parsed.body.task;
    if (!taskId) return NextResponse.json({ error: "Missing taskId" }, { status: 400 });
    const result = await claimTaskReward(auth.user.id, taskId);
    if (!result.claimed) {
      return NextResponse.json({ error: "Task not completed or already claimed" }, { status: 400 });
    }
    return NextResponse.json({ mission: await serializeMission(result.mission), earned: result.earned });
  }

  if (action === "claim-bonus") {
    const result = await claimBonusReward(auth.user.id);
    if (!result.claimed) {
      return NextResponse.json({ error: "Not eligible for bonus" }, { status: 400 });
    }
    return NextResponse.json({ mission: await serializeMission(result.mission), earned: result.earned });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
});
