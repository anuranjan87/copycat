// app/api/images/route.ts

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query");

  if (!query) {
    return NextResponse.json(
      { error: "Missing query parameter" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
        query
      )}&per_page=10`,
      {
        headers: {
          Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch Unsplash");
    }

    const data = await res.json();

    const images = data.results.map((photo: any) => ({
      id: photo.id,
      description: photo.alt_description,
      image: photo.urls.regular,
      thumb: photo.urls.small,
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
      downloadLocation: photo.links.download_location,
    }));

    return NextResponse.json(images);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Unable to fetch images" },
      { status: 500 }
    );
  }
}