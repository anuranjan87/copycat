"use client"

import * as React from "react"
import { useEffect, useState, useMemo } from "react"
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Mail, CalendarDays, Eye, User, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react"
import {
  getVisitChartData,
  getEnquiries,
} from "@/lib/website-actions"

// ================= TYPES =================
interface Enquiry {
  id: number
  created_at: Date
  [key: string]: any
}

export default function Dashboard({ username }: { username: string }) {
  const [chartData, setChartData] = useState<any[]>([])
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null)
  const [page, setPage] = useState(1)
  const pageSize = 5

  // ================= FETCH =================
  useEffect(() => {
    async function load() {
      // chart
      const visitRes = await getVisitChartData(username)

      const map: Record<
        string,
        { visits: number; date: Date }
      > = {}

      visitRes.forEach((item: any) => {
        const date = new Date(item.date)

        const key = date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        })

        if (!map[key]) map[key] = { visits: 0, date }

        map[key].visits += item.visits
      })

      const monthly = Object.entries(map)
        .map(([month, val]) => ({
          month,
          visits: val.visits,
          date: val.date,
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime())

      setChartData(monthly)

      // enquiries
      const enquiryRes = await getEnquiries(username)

      const formatted = enquiryRes
        .map((e: any) => ({
          ...e,
          created_at: new Date(e.created_at),
        }))
        .sort(
          (a, b) =>
            b.created_at.getTime() - a.created_at.getTime()
        )

      setEnquiries(formatted)
    }

    load()
  }, [username])

  // ================= HELPERS =================
  const totalPages = Math.ceil(enquiries.length / pageSize)

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return enquiries.slice(start, start + pageSize)
  }, [enquiries, page])

  const getEmail = (e: Enquiry) =>
    e.email || e.Email || "No email"

  const formatTime = (date: Date) =>
    new Date(date).toLocaleString("en-US", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    })

  // ================= DETAIL VIEW =================
  if (selectedEnquiry) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black text-white">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Button
            variant="ghost"
            onClick={() => setSelectedEnquiry(null)}
            className="mb-8 text-gray-400 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to dashboard
          </Button>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
              <Mail className="h-5 w-5 text-blue-400" />
              <h2 className="text-xl font-semibold tracking-tight">Enquiry Details</h2>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <CalendarDays className="h-4 w-4" />
                <span>{formatTime(selectedEnquiry.created_at)}</span>
              </div>

              <div className="grid gap-6">
                {Object.entries(selectedEnquiry)
                  .filter(([k]) => k !== "id" && k !== "created_at")
                  .map(([k, v]) => (
                    <div key={k} className="border-l-2 border-blue-500/50 pl-4">
                      <p className="text-xs font-mono uppercase tracking-wider text-gray-500 mb-1">
                        {k}
                      </p>
                      <p className="text-base text-white/90 break-words">
                        {String(v) || "—"}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ================= MAIN DASHBOARD =================
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black text-white">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-12">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-500 mt-1">Welcome back, {username}</p>
        </div>

        {/* ===== CHART CARD ===== */}
        <div className="bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/10 p-6 shadow-xl transition-all hover:border-white/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-medium">Monthly visits</h2>
                <p className="text-xs text-gray-500">Audience activity over time</p>
              </div>
            </div>
            {chartData.length > 0 && (
              <span className="text-xs text-gray-500">
                Last 12 months
              </span>
            )}
          </div>

          <div className="w-full h-[350px] mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <Tooltip
                  contentStyle={{
                    background: "#111",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
                    padding: "8px 12px",
                  }}
                  labelStyle={{ color: "#9ca3af", fontSize: "12px" }}
                  formatter={(v: any) => [`${v} visits`, "Traffic"]}
                  cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }}
                />
                <defs>
                  <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="visits"
                  stroke="#60a5fa"
                  strokeWidth={2.5}
                  fill="url(#colorVisits)"
                  activeDot={{ r: 6, strokeWidth: 0, fill: "#60a5fa" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ===== ENQUIRIES CARD ===== */}
        <div className="bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/10 p-6 shadow-xl transition-all hover:border-white/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-medium">Enquiries</h2>
                <p className="text-xs text-gray-500">Recent messages from your site</p>
              </div>
            </div>
            <span className="text-sm bg-white/5 px-3 py-1 rounded-full border border-white/10">
              {enquiries.length} total
            </span>
          </div>

          <ScrollArea className="max-h-[320px] rounded-lg">
            {paginated.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">
                No enquiries yet
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {paginated.map((e) => (
                  <div
                    key={e.id}
                    onClick={() => setSelectedEnquiry(e)}
                    className="group flex items-center justify-between p-4 cursor-pointer transition-all hover:bg-white/5 rounded-lg"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition">
                        <Mail className="h-4 w-4 text-gray-400 group-hover:text-blue-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium truncate max-w-[200px] md:max-w-[300px]">
                          {getEmail(e)}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <CalendarDays className="h-3 w-3" />
                          {formatTime(e.created_at)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-gray-300 transition" />
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-2 border-t border-white/5">
              <Button
                variant="ghost"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="text-gray-400 hover:text-white disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="text-xs text-gray-500">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="text-gray-400 hover:text-white disabled:opacity-30"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}