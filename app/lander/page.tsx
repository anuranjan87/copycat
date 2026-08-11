import Link from 'next/link'

const features = [
  {
    title: 'Build with structure',
    description: 'Start from purpose-built templates for launch pages, marketing campaigns, and digital products.',
  },
  {
    title: 'Shape your message',
    description: 'Use guided editing and optional AI assistance to refine copy while keeping your brand voice in control.',
  },
  {
    title: 'Publish confidently',
    description: 'Create responsive, accessible pages and publish them when they are ready for your audience.',
  },
]

export default function Page() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5" aria-label="Main navigation">
          <Link href="/" className="font-mono text-sm font-semibold tracking-[0.2em]">
            7WINGZ
          </Link>
          <div className="flex items-center gap-5 text-sm text-muted-foreground">
            <Link href="#features" className="transition-colors hover:text-foreground">Features</Link>
            <Link href="#data-use" className="transition-colors hover:text-foreground">Data use</Link>
            <Link href="/legal/privacy" className="transition-colors hover:text-foreground">Privacy policy</Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-24 pt-24 md:pb-32 md:pt-32">
        <div className="max-w-3xl">
          <p className="mb-6 font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">Creative tools for the modern web</p>
          <h1 className="max-w-3xl text-balance text-5xl font-semibold tracking-tight md:text-7xl">
            Build clear, polished digital experiences with 7Wingz.
          </h1>
          <p className="mt-8 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground">
            7Wingz is a marketing and website-building platform for creators, teams, and small businesses. Choose a structured starting point, adapt the content, and publish a professional website without rebuilding every detail from scratch.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="#features" className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
              Explore features
            </Link>
            <Link href="/legal/privacy" className="rounded-full border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-muted">
              Read our privacy policy
            </Link>
          </div>
        </div>
      </section>

      <section id="features" className="border-y border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">What 7Wingz does</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">Everything you need to move from idea to published page.</h2>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.title} className="border-t border-border pt-5">
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-3 leading-7 text-muted-foreground">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="data-use" className="mx-auto max-w-6xl px-6 py-20 md:py-24">
        <div className="grid gap-10 md:grid-cols-[0.8fr_1.2fr] md:gap-20">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">Transparency</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">Why we request your data</h2>
          </div>
          <div className="space-y-5 text-base leading-7 text-muted-foreground">
            <p>When you create an account, we request basic account information such as your name and email address so we can identify your workspace, provide access to the service, and contact you about essential account activity.</p>
            <p>Content you create in 7Wingz is used to provide editing, AI-assisted writing, preview, and publishing features. We do not request data unrelated to these functions, and we do not sell your personal information.</p>
            <p>For the complete details about collection, use, retention, and your choices, please read our <Link href="/legal/privacy" className="font-medium text-foreground underline underline-offset-4">Privacy Policy</Link>.</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© 2026 7Wingz. All rights reserved.</p>
          <div className="flex flex-wrap gap-5">
            <Link href="/legal/privacy" className="hover:text-foreground">Privacy policy</Link>
            <Link href="/legal/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/legal/support" className="hover:text-foreground">Support</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
