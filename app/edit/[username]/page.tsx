import {
  getLatestPublishedSiteWithNullData,
  getSavedWebsiteItem,
} from "@/lib/website-actions";
import { notFound } from "next/navigation";
import { CodeEditor } from "@/components/code-editor";

interface PageProps {
  params: Promise<{
    username: string;
  }>;
  searchParams: Promise<{
    savedId?: string;
  }>;
}

export default async function EditPage({ params, searchParams }: PageProps) {
  const { username } = await params;
  const { savedId } = await searchParams;

  try {
    const savedContent = savedId
      ? await getSavedWebsiteItem(username, Number(savedId))
      : null;

    const content = savedContent ??
      (await getLatestPublishedSiteWithNullData(username)) ?? {
        html: "",
        script: "",
        data: "",
      };

    return (
      <div className="flex h-screen bg-[#030712] relative">
        <main className="flex-1">
          <CodeEditor
            username={username}
            initialContent={content}
          />
        </main>
      </div>
    );
  } catch (error) {
    console.error("Error loading edit page:", error);
    notFound();
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params;

  return {
    title: `Edit ${username}'s Website`,
    description: `Edit the website for ${username}`,
  };
}