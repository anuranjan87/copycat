// app/dashboard/marketing/page.tsx

import {
  Calendar,
  Mail,
  Users,
  Search,
  Plus,
  Send,
  Clock3,
  BarChart3,
  Eye,
  MousePointerClick,
} from "lucide-react";

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
          <div>
            <h1 className="text-3xl font-bold">Email Marketing</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Create, schedule and manage email campaigns.
            </p>
          </div>

          <button className="flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-white transition hover:bg-zinc-800">
            <Plus className="h-4 w-4" />
            New Campaign
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl p-8 space-y-8">

        {/* Stats */}

        <div className="grid grid-cols-4 gap-6">

          <div className="rounded-2xl bg-white p-6 shadow-sm border">
            <Mail className="mb-4 h-7 w-7" />
            <p className="text-sm text-zinc-500">Campaigns</p>
            <h2 className="mt-2 text-3xl font-bold">48</h2>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm border">
            <Users className="mb-4 h-7 w-7" />
            <p className="text-sm text-zinc-500">Subscribers</p>
            <h2 className="mt-2 text-3xl font-bold">18,420</h2>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm border">
            <Eye className="mb-4 h-7 w-7" />
            <p className="text-sm text-zinc-500">Open Rate</p>
            <h2 className="mt-2 text-3xl font-bold">46.8%</h2>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm border">
            <MousePointerClick className="mb-4 h-7 w-7" />
            <p className="text-sm text-zinc-500">CTR</p>
            <h2 className="mt-2 text-3xl font-bold">8.9%</h2>
          </div>

        </div>

        {/* Campaign Table */}

        <div className="rounded-2xl border bg-white">

          <div className="flex items-center justify-between border-b p-6">

            <h2 className="text-xl font-semibold">
              Campaigns
            </h2>

            <div className="flex gap-3">

              <div className="flex items-center rounded-xl border px-4">
                <Search className="mr-2 h-4 w-4 text-zinc-400" />
                <input
                  placeholder="Search..."
                  className="h-11 outline-none"
                />
              </div>

              <button className="rounded-xl border px-5">
                Filter
              </button>

            </div>

          </div>

          <table className="w-full">

            <thead className="bg-zinc-50 text-left text-sm">

              <tr>

                <th className="p-4">Campaign</th>
                <th>Audience</th>
                <th>Status</th>
                <th>Scheduled</th>
                <th>Sent</th>
                <th>Open</th>
                <th>CTR</th>

              </tr>

            </thead>

            <tbody>

              {[
                {
                  name: "Product Launch",
                  audience: "All Users",
                  status: "Sent",
                  date: "12 Jul",
                  sent: "18,203",
                  open: "49%",
                  ctr: "9.8%",
                },
                {
                  name: "July Newsletter",
                  audience: "Subscribers",
                  status: "Scheduled",
                  date: "Tomorrow",
                  sent: "--",
                  open: "--",
                  ctr: "--",
                },
                {
                  name: "Welcome Email",
                  audience: "New Users",
                  status: "Active",
                  date: "Automation",
                  sent: "4,238",
                  open: "61%",
                  ctr: "13%",
                },
              ].map((item) => (
                <tr
                  key={item.name}
                  className="border-t hover:bg-zinc-50"
                >
                  <td className="p-4 font-medium">{item.name}</td>
                  <td>{item.audience}</td>
                  <td>
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm">
                      {item.status}
                    </span>
                  </td>
                  <td>{item.date}</td>
                  <td>{item.sent}</td>
                  <td>{item.open}</td>
                  <td>{item.ctr}</td>
                </tr>
              ))}

            </tbody>

          </table>

        </div>

        {/* Bottom */}

        <div className="grid grid-cols-3 gap-6">

          {/* Audience */}

          <div className="rounded-2xl border bg-white p-6">

            <h3 className="mb-5 text-xl font-semibold">
              Audience
            </h3>

            <div className="space-y-4">

              {[
                ["All Users", "18,420"],
                ["Premium", "2,130"],
                ["Trial", "6,920"],
                ["Inactive", "4,203"],
              ].map(([name, count]) => (
                <div
                  key={name}
                  className="flex justify-between rounded-xl border p-4"
                >
                  <span>{name}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}

            </div>

          </div>

          {/* Upcoming */}

          <div className="rounded-2xl border bg-white p-6">

            <h3 className="mb-5 text-xl font-semibold">
              Scheduled
            </h3>

            <div className="space-y-5">

              <div className="flex gap-3">

                <Clock3 />

                <div>
                  <p className="font-medium">
                    July Newsletter
                  </p>

                  <p className="text-sm text-zinc-500">
                    Tomorrow • 10:00 AM
                  </p>

                </div>

              </div>

              <div className="flex gap-3">

                <Calendar />

                <div>
                  <p className="font-medium">
                    Product Update
                  </p>

                  <p className="text-sm text-zinc-500">
                    28 July • 09:00 AM
                  </p>

                </div>

              </div>

            </div>

          </div>

          {/* Quick Actions */}

          <div className="rounded-2xl border bg-white p-6">

            <h3 className="mb-5 text-xl font-semibold">
              Quick Actions
            </h3>

            <div className="space-y-3">

              <button className="flex w-full items-center justify-center gap-2 rounded-xl border py-3 hover:bg-zinc-50">
                <Plus className="h-4 w-4" />
                Create Campaign
              </button>

              <button className="flex w-full items-center justify-center gap-2 rounded-xl border py-3 hover:bg-zinc-50">
                <Users className="h-4 w-4" />
                Import Subscribers
              </button>

              <button className="flex w-full items-center justify-center gap-2 rounded-xl border py-3 hover:bg-zinc-50">
                <Send className="h-4 w-4" />
                Send Test Email
              </button>

              <button className="flex w-full items-center justify-center gap-2 rounded-xl border py-3 hover:bg-zinc-50">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </button>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}