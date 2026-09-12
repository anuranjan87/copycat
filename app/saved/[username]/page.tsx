import Link from "next/link";
import { getSavedWebsiteItems } from "@/lib/website-actions";
import Nav from "@/components/nav";

interface PageProps {
  params: Promise<{ username: string }>;
}

function buildPreview(html: string, data: string) {
  if (!data.trim()) return html;

  const dataScript = `<script>\n${data}\n</script>`;
  const babelScript = /<script[^>]*type=["']text\/babel["'][^>]*>/i;

  if (babelScript.test(html)) {
    return html.replace(babelScript, `${dataScript}\n$&`);
  }

  return html.replace(/<\/head>/i, `${dataScript}\n</head>`);
}

export default async function SavedItemsPage({ params }: PageProps) {
  const { username } = await params;
  const result = await getSavedWebsiteItems(username);
  const items = result.items;

  return (
    <main className="min-h-screen bg-zinc-950 px-5 pb-12 pt-28 text-white sm:px-8">
      <Nav username={username} />
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              {username}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Saved Items
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Reopen a saved version in the editor or inspect its preview.
            </p>
          </div>
          <Link
            href={`/templates/${username}`}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
          >
            Templates
          </Link>
        </div>

        {!result.success ? (
          <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-6 text-sm text-red-200">
            {result.error}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-12 text-center text-sm text-zinc-400">
            No saved items yet. Use Save in the editor to create one.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] shadow-2xl"
              >
                <div className="border-b border-white/10 px-5 py-4">
                  <h2 className="text-sm font-medium text-white">
                    Saved {new Date(item.createdAt).toLocaleString()}
                  </h2>
                </div>
                <div className="bg-black p-3">
                  <iframe
                    srcDoc={buildPreview(item.html, item.data)}
                    title={`Saved website ${item.id}`}
                    sandbox="allow-scripts allow-same-origin"
                    className="aspect-[16/10] w-full rounded-lg border border-white/10 bg-white"
                  />
                </div>
                <div className="flex items-center justify-between px-5 py-4">
                  <span className="text-xs text-zinc-500">Version {item.id}</span>
                  <Link
                    href={`/edit/${username}?savedId=${item.id}`}
                    className="rounded-lg bg-white px-3 py-2 text-xs font-medium text-black transition hover:bg-zinc-200"
                  >
                    Open in blank editor
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
