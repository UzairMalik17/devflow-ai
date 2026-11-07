import { NextResponse } from "next/server";
import { findRepositoryById } from "@/features/repositories/repository.service";

type RouteContext = {
  params: Promise<{
    repositoryId: string;
  }>;
};

export async function GET({ params }: RouteContext) {
  const { repositoryId } = await params;

  try {
    const repository = await findRepositoryById(repositoryId);
    return NextResponse.json({
      repository,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Repository not found",
      },
      { status: 404 },
    );
  }
}
