import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

async function getDbUser() {
  const user = await currentUser();
  if (!user) {
    return null;
  }

  return db.user.findUnique({
    where: { clerkId: user.id },
    select: { id: true },
  });
}

export async function GET() {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const playlists = await db.playlist.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, playlists });
  } catch (error) {
    console.error("Error fetching playlists:", error);
    return NextResponse.json(
      { error: "Failed to fetch playlists" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const playlist = await db.playlist.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        userId: dbUser.id,
      },
    });

    return NextResponse.json({ success: true, playlist });
  } catch (error) {
    console.error("Error creating playlist:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A playlist with this name already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create playlist" },
      { status: 500 }
    );
  }
}
