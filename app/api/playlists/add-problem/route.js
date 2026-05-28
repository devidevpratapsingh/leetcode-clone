import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function POST(request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await db.user.findUnique({
      where: { clerkId: user.id },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { problemId, playlistId } = await request.json();

    if (!problemId || !playlistId) {
      return NextResponse.json(
        { error: "problemId and playlistId are required" },
        { status: 400 }
      );
    }

    const playlist = await db.playlist.findFirst({
      where: { id: playlistId, userId: dbUser.id },
    });

    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    await db.problemInPlaylist.create({
      data: { playlistId, problemId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding problem to playlist:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Problem is already in this playlist" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to add problem to playlist" },
      { status: 500 }
    );
  }
}
