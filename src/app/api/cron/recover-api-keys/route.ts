import { NextRequest, NextResponse } from "next/server";
import { recoveryQueue } from "@/lib/queue/recovery-queue";

export async function GET(request: NextRequest) {
  const authorizationHeader = request.headers.get("authorization");

  if (authorizationHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const job = await recoveryQueue.add(
    "recover-api-keys",
    {},
    {
      jobId: "gemini-api-key-recovery",
    },
  );

  return NextResponse.json({
    message: "Recovery job queued successfully.",
    jobId: job.id,
  });
}
