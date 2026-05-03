import { getLatestPublishedSiteWithNullData  } from "@/lib/website-actions"
import { notFound } from "next/navigation"
import { CodeEditor } from "@/components/code-editor"
import  {Origami, Globe2Icon, LayoutDashboard, Link, CirclePlayIcon }  from "lucide-react";


interface PageProps {
  params: {
    username: string
  }
}

export default async function EditPage({ params }: PageProps) {
  const { username } = await params

  try {
    const content = await getLatestPublishedSiteWithNullData (username)
    if (!content) {
      notFound()
    }

    return (
      <div className="flex h-screen bg-[#030712] relative">
        {/* Sidebar */}

        {/* Main Content */}
        <main className="flex-1 ">
          <CodeEditor username={username} initialContent={content} />
        </main>
      </div>
    )
  } catch (error) {
    console.error("Error loading edit page:", error)
    notFound()
  }

}

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params

  return {
    title: `Edit ${username}'s Website`,
    description: `Edit the website for ${username}`,
  }
}
