import { getLatestPublishedSiteWithNullData } from "@/lib/website-actions";
import { notFound } from "next/navigation";
import { CodeEditor } from "@/components/code-editor";

interface PageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function EditPage({ params }: PageProps) {
  const { username } = await params;

  try {
    const content =
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