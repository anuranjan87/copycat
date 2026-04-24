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
import {
  ArrowLeft,
  Mail,
  CalendarDays,
  Eye,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Users,
  Activity,
  TrendingUp,
  TrendingDown,
  Zap,
  Sparkles,
  BarChart3,
  Calendar,
} from "lucide-react"
import {
  getVisitCount,
  getVisitChartData,
  getEnquiries,
  getActiveVisitorsCount,
} from "@/lib/website-actions"

// ================= TYPES =================
interface Enquiry {
  id: number
  created_at: Date
  [key: string]: any
}

// ================= ANIMATED COUNTER =================
function AnimatedCounter({ value }: { value: number | null }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (value === null) return

    const duration = 2000
    const steps = 60
    const increment = value / steps
    let current = 0
    let frame = 0

    const timer = setInterval(() => {
      frame++
      current = Math.floor(increment * frame)
      if (current >= value) {
        setDisplayValue(value)
        clearInterval(timer)
      } else {
        setDisplayValue(current)
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [value])

  return <span>{displayValue.toLocaleString()}</span>
}

// ================= STAT CARD =================
function StatCard({
  label,
  value,
  icon: Icon,
  color,
  trend,
  delay,
}: {
  label: string
  value: number | null
  icon: any
  color: string
  trend?: number
  delay: number
}) {
  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl p-6 shadow-xl transition-all duration-500 hover:scale-105 hover:border-white/20 hover:shadow-2xl animate-[slideUp_0.6s_ease-out_forwards] opacity-0"
    >
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${color}`} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl backdrop-blur-md transition-all duration-300 ${color}`}>
            <Icon className="h-6 w-6" />
          </div>
          {trend !== undefined && (
            <div
              className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                trend >= 0
                  ? "text-emerald-400 bg-emerald-500/10"
                  : "text-red-400 bg-red-500/10"
              }`}
            >
              {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {trend >= 0 ? `+${trend}%` : `${trend}%`}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div className="text-5xl font-black bg-gradient-to-r from-white via-white to-gray-300 bg-clip-text text-transparent">
            {value !== null ? <AnimatedCounter value={value} /> : "—"}
          </div>
          <p className="text-sm text-gray-400 font-medium">{label}</p>
        </div>
      </div>
      <div className="absolute inset-0 rounded-2xl border border-transparent bg-gradient-to-r from-white/20 via-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </div>
  )
}

// ================= MAIN DASHBOARD =================
export default function DashboardPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = React.use(params)

  // State
  const [loading, setLoading] = useState(true)
  const [totalVisits, setTotalVisits] = useState<number | null>(null)
  const [activeVisitors, setActiveVisitors] = useState<number>(0)
  const [dailyData, setDailyData] = useState<any[]>([]) // raw daily from API
  const [monthlyData, setMonthlyData] = useState<any[]>([]) // aggregated monthly
  const [chartView, setChartView] = useState<"monthly" | "daily">("monthly")
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null)
  const [page, setPage] = useState(1)
  const [trendPercent, setTrendPercent] = useState<number | null>(null)
  const pageSize = 5

  // Fetch data
  useEffect(() => {
    async function load() {
      try {
        setLoading(true)

        // Total visits
        const total = await getVisitCount(username)
        setTotalVisits(total)

        // Daily chart data (already daily from your server action)
        const visitRes = await getVisitChartData(username)
        setDailyData(visitRes)

        // Aggregate monthly
        const map: Record<string, { visits: number; date: Date }> = {}
        visitRes.forEach((item: any) => {
          const date = new Date(item.date)
          const key = date.toLocaleDateString("en-US", { year: "numeric", month: "short" })
          if (!map[key]) map[key] = { visits: 0, date }
          map[key].visits += item.visits
        })
        const monthly = Object.entries(map)
          .map(([month, val]) => ({ month, visits: val.visits, date: val.date }))
          .sort((a, b) => a.date.getTime() - b.date.getTime())
        setMonthlyData(monthly)

        // Compute month‑over‑month trend from monthly data
        if (monthly.length >= 2) {
          const last = monthly[monthly.length - 1].visits
          const prev = monthly[monthly.length - 2].visits
          if (prev !== 0) {
            const change = ((last - prev) / prev) * 100
            setTrendPercent(Math.round(change))
          } else {
            setTrendPercent(last > 0 ? 100 : 0)
          }
        } else {
          setTrendPercent(null)
        }

        // Enquiries
        const enquiryRes = await getEnquiries(username)
        const formatted = enquiryRes
          .map((e: any) => ({ ...e, created_at: new Date(e.created_at) }))
          .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
        setEnquiries(formatted)
      } catch (error) {
        console.error("Failed to load dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [username])

  // Live active visitors
  useEffect(() => {
    async function fetchActive() {
      try {
        const active = await getActiveVisitorsCount(username, 5)
        setActiveVisitors(active)
      } catch (err) {
        console.error("Failed to fetch active visitors", err)
      }
    }
    fetchActive()
    const interval = setInterval(fetchActive, 30000)
    return () => clearInterval(interval)
  }, [username])

  // Helpers
  const totalPages = Math.ceil(enquiries.length / pageSize)
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return enquiries.slice(start, start + pageSize)
  }, [enquiries, page])

  const getEmail = (e: Enquiry) => e.email || e.Email || "No email"
  const formatTime = (date: Date) =>
    new Date(date).toLocaleString("en-US", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    })

  // Prepare data for the chart based on current view
  const chartData = chartView === "monthly" ? monthlyData : dailyData
  const xAxisKey = chartView === "monthly" ? "month" : "date"
  // For daily view, show only every Nth label to avoid clutter
  const tickFormatter = (label: string, index: number) => {
    if (chartView === "daily") {
      const date = new Date(label)
      return index % 5 === 0 ? `${date.getDate()}/${date.getMonth() + 1}` : ""
    }
    return label
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white px-6 py-10">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="space-y-2 animate-pulse">
            <div className="h-10 w-48 bg-white/10 rounded-lg" />
            <div className="h-4 w-32 bg-white/5 rounded" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[0, 1].map((i) => (
              <div key={i} className="h-32 bg-white/5 rounded-2xl border border-white/10 animate-pulse" />
            ))}
          </div>
          <div className="h-[350px] bg-white/5 rounded-2xl border border-white/10 animate-pulse" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" style={{ animationDelay: `${i * 50}ms` }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Main render
  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-0 left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "-3s" }} />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-10 space-y-12">
          {/* Header */}
          <div className="animate-[slideUp_0.6s_ease-out] space-y-2">
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-blue-400 animate-bounce" />
              <h1 className="text-5xl font-black bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-200 bg-clip-text text-transparent">
                Dashboard
              </h1>
            </div>
            <p className="text-gray-400 text-lg">
              Live analytics for{" "}
              <span className="font-bold text-white bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {username}
              </span>
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard
              label="Total visitors (all time)"
              value={totalVisits}
              icon={Users}
              color="bg-emerald-500/20 text-emerald-400"
              trend={trendPercent !== null ? trendPercent : undefined}
              delay={0}
            />
            <StatCard
              label="Active now (live)"
              value={activeVisitors}
              icon={Activity}
              color="bg-red-500/20 text-red-400"
              delay={150}
            />
          </div>

          {/* Chart Card with toggle */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl p-8 shadow-xl transition-all duration-500 hover:border-white/20 hover:shadow-2xl animate-[slideUp_0.6s_ease-out_0.3s_forwards] opacity-0">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-blue-500/10 via-transparent to-transparent" />
            <div className="relative z-10 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform">
                    <Eye className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Performance</h2>
                    <p className="text-sm text-gray-500">Traffic trends and insights</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => setChartView("monthly")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      chartView === "monthly"
                        ? "bg-blue-500 text-white shadow-lg"
                        : "text-gray-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Calendar className="h-4 w-4" />
                    Monthly
                  </button>
                  <button
                    onClick={() => setChartView("daily")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      chartView === "daily"
                        ? "bg-blue-500 text-white shadow-lg"
                        : "text-gray-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <BarChart3 className="h-4 w-4" />
                    Daily
                  </button>
                </div>
              </div>

              <div className="w-full h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey={xAxisKey}
                      tick={{ fill: "#9ca3af", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      dy={10}
                      interval={chartView === "daily" ? 5 : 0}
                      tickFormatter={tickFormatter}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(15, 23, 42, 0.95)",
                        border: "1px solid rgba(59, 130, 246, 0.3)",
                        borderRadius: "12px",
                        padding: "12px 16px",
                        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)",
                      }}
                      labelStyle={{ color: "#e0e7ff", fontSize: "13px", fontWeight: 600 }}
                      formatter={(v: any) => [
                        <span key="visits" className="text-blue-300 font-semibold">
                          {v.toLocaleString()} visits
                        </span>,
                        "Traffic",
                      ]}
                      cursor={{ stroke: "rgba(59, 130, 246, 0.3)", strokeWidth: 2 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="visits"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fill="url(#colorVisits)"
                      isAnimationActive={true}
                      animationDuration={1200}
                      activeDot={{ r: 8, fill: "#60a5fa", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Enquiries Card */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl p-8 shadow-xl transition-all duration-500 hover:border-white/20 hover:shadow-2xl animate-[slideUp_0.6s_ease-out_0.6s_forwards] opacity-0">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-purple-500/10 via-transparent to-transparent" />
            <div className="relative z-10">
              {!selectedEnquiry ? (
                // LIST VIEW
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform">
                        <MessageSquare className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">Messages & Enquiries</h2>
                        <p className="text-sm text-gray-500">Recent interactions from your audience</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-4 py-2 rounded-full border border-purple-500/30">
                      <Sparkles className="h-4 w-4 text-purple-400" />
                      <span className="text-sm font-semibold text-purple-200">{enquiries.length} total</span>
                    </div>
                  </div>

                  <ScrollArea className="max-h-[380px] rounded-xl border border-white/5 bg-white/[0.02]">
                    {paginated.length === 0 ? (
                      <div className="text-center py-16 text-gray-500 text-sm">
                        <MessageSquare className="h-8 w-8 mx-auto mb-4 opacity-50" />
                        No enquiries yet
                      </div>
                    ) : (
                      <div className="divide-y divide-white/5">
                        {paginated.map((e, idx) => (
                          <div
                            key={e.id}
                            onClick={() => setSelectedEnquiry(e)}
                            style={{ animationDelay: `${idx * 50}ms` }}
                            className="group/item relative p-4 cursor-pointer transition-all duration-300 hover:bg-white/8 animate-[slideIn_0.4s_ease-out_forwards] opacity-0 hover:pl-6"
                          >
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-4 min-w-0 flex-1">
                                <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 group-hover/item:scale-110 transition-transform flex-shrink-0">
                                  <Mail className="h-5 w-5 text-blue-400" />
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className="text-sm font-semibold text-white truncate">
                                    {e.name || getEmail(e)}
                                  </span>
                                  <span className="text-xs text-gray-500 flex items-center gap-2 mt-1 truncate">
                                    <Mail className="h-3 w-3 flex-shrink-0" />
                                    {getEmail(e)}
                                  </span>
                                  <span className="text-xs text-gray-600 flex items-center gap-2 mt-1">
                                    <CalendarDays className="h-3 w-3 flex-shrink-0" />
                                    {formatTime(e.created_at)}
                                  </span>
                                </div>
                              </div>
                              <ChevronRight className="h-5 w-5 text-gray-600 group-hover/item:text-blue-400 group-hover/item:translate-x-1 transition-all flex-shrink-0" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => setPage((p) => p - 1)}
                        className="text-gray-400 hover:text-blue-400 hover:bg-white/5 disabled:opacity-30 transition-all"
                      >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Previous
                      </Button>
                      <div className="flex items-center gap-2">
                        {Array.from({ length: totalPages }).map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setPage(idx + 1)}
                            className={`w-8 h-8 rounded-lg font-medium transition-all ${
                              page === idx + 1
                                ? "bg-blue-500 text-white"
                                : "bg-white/5 text-gray-400 hover:bg-white/10"
                            }`}
                          >
                            {idx + 1}
                          </button>
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={page === totalPages}
                        onClick={() => setPage((p) => p + 1)}
                        className="text-gray-400 hover:text-blue-400 hover:bg-white/5 disabled:opacity-30 transition-all"
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                // DETAIL VIEW
                <div className="animate-[slideIn_0.4s_ease-out] space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400">
                        <MessageSquare className="h-6 w-6" />
                      </div>
                      <h2 className="text-2xl font-bold">Message Details</h2>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedEnquiry(null)}
                      className="text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                  </div>

                  <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 border border-white/10">
                    <CalendarDays className="h-5 w-5 text-blue-400 flex-shrink-0" />
                    <span className="text-sm text-gray-300 font-medium">
                      {formatTime(selectedEnquiry.created_at)}
                    </span>
                  </div>

                  <div className="grid gap-6">
                    {Object.entries(selectedEnquiry)
                      .filter(([k]) => k !== "id" && k !== "created_at")
                      .map(([k, v], idx) => (
                        <div
                          key={k}
                          style={{ animationDelay: `${idx * 50}ms` }}
                          className="group/field animate-[slideUp_0.4s_ease-out_forwards] opacity-0 rounded-lg border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.06] transition-all"
                        >
                          <p className="text-xs font-mono uppercase tracking-widest text-blue-400 mb-2 font-bold">
                            {k}
                          </p>
                          <p className="text-base text-gray-200 break-words leading-relaxed font-medium">
                            {String(v) || "—"}
                          </p>
                        </div>
                      ))}
                  </div>

                  <Button
                    onClick={() => setSelectedEnquiry(null)}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 rounded-lg transition-all hover:scale-105 active:scale-95"
                  >
                    Back to Messages
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}