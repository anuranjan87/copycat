"use client";

import * as React from "react";
import { useEffect, useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
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
  Asterisk,
  Rocket,
  BarChart3,
  Calendar,
} from "lucide-react";
import {
  getVisitCount,
  getVisitChartData,
  getEnquiries,
  getActiveVisitorsCount,
} from "@/lib/website-actions";
import Nav from "@/components/nav";

// ================= TYPES =================
interface Enquiry {
  id: number;
  created_at: Date;
  [key: string]: any;
}

// ================= ANIMATED COUNTER =================
function AnimatedCounter({ value }: { value: number | null }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (value === null) return;

    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    let frame = 0;

    const timer = setInterval(() => {
      frame++;
      current = Math.floor(increment * frame);
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{displayValue.toLocaleString()}</span>;
}

// ================= STAT CARD =================
function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  delay,
}: {
  label: string;
  value: number | null;
  icon: any;
  trend?: number;
  delay: number;
}) {
  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 transition-all duration-500 hover:scale-[1.02] hover:border-white/20 hover:bg-black/60 animate-[slideUp_0.6s_ease-out_forwards] opacity-0"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 rounded-xl bg-red-600/10 text-red-500 transition-all duration-300 group-hover:bg-red-600/20">
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
          <div className="text-5xl font-black tracking-tight text-white">
            {value !== null ? <AnimatedCounter value={value} /> : "—"}
          </div>
          <p className="text-sm text-white/50 font-medium tracking-wide">{label}</p>
        </div>
      </div>
    </div>
  );
}

// ================= MAIN DASHBOARD =================
export default function DashboardPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = React.use(params); // ✅ unwrap the Promise

  // State
  const [loading, setLoading] = useState(true);
  const [totalVisits, setTotalVisits] = useState<number | null>(null);
  const [activeVisitors, setActiveVisitors] = useState<number>(0);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [chartView, setChartView] = useState<"monthly" | "daily">("monthly");
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [page, setPage] = useState(1);
  const [trendPercent, setTrendPercent] = useState<number | null>(null);
  const pageSize = 5;

  // Fetch data
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const total = await getVisitCount(username);
        setTotalVisits(total);

        const visitRes = await getVisitChartData(username);
        setDailyData(visitRes);

        // Aggregate monthly
        const map: Record<string, { visits: number; date: Date }> = {};
        visitRes.forEach((item: any) => {
          const date = new Date(item.date);
          const key = date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
          if (!map[key]) map[key] = { visits: 0, date };
          map[key].visits += item.visits;
        });
        const monthly = Object.entries(map)
          .map(([month, val]) => ({ month, visits: val.visits, date: val.date }))
          .sort((a, b) => a.date.getTime() - b.date.getTime());
        setMonthlyData(monthly);

        if (monthly.length >= 2) {
          const last = monthly[monthly.length - 1].visits;
          const prev = monthly[monthly.length - 2].visits;
          if (prev !== 0) {
            const change = ((last - prev) / prev) * 100;
            setTrendPercent(Math.round(change));
          } else {
            setTrendPercent(last > 0 ? 100 : 0);
          }
        } else {
          setTrendPercent(null);
        }

        const enquiryRes = await getEnquiries(username);
        const formatted = enquiryRes
          .map((e: any) => ({ ...e, created_at: new Date(e.created_at) }))
          .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
        setEnquiries(formatted);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [username]);

  // Live active visitors
  useEffect(() => {
    async function fetchActive() {
      try {
        const active = await getActiveVisitorsCount(username, 5);
        setActiveVisitors(active);
      } catch (err) {
        console.error("Failed to fetch active visitors", err);
      }
    }
    fetchActive();
    const interval = setInterval(fetchActive, 30000);
    return () => clearInterval(interval);
  }, [username]);

  const totalPages = Math.ceil(enquiries.length / pageSize);
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return enquiries.slice(start, start + pageSize);
  }, [enquiries, page]);

  const getEmail = (e: Enquiry) => e.email || e.Email || "No email";
  const formatTime = (date: Date) =>
    new Date(date).toLocaleString("en-US", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });

  const chartData = chartView === "monthly" ? monthlyData : dailyData;
  const xAxisKey = chartView === "monthly" ? "month" : "date";
  const tickFormatter = (label: string, index: number) => {
    if (chartView === "daily") {
      const date = new Date(label);
      return index % 5 === 0 ? `${date.getDate()}/${date.getMonth() + 1}` : "";
    }
    return label;
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white px-6 py-10">
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
    );
  }

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
        .rox { font-family: "Roxborough CF Thin", serif; }
      `}</style>

      <div className="min-h-screen bg-black text-white overflow-hidden">
        {/* Fixed Navbar - ✅ pass the unwrapped username */}
        <Nav username={username} />

        {/* Spacer for fixed navbar (optional) */}
        <div className="py-8" />

        {/* Animated background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-40 w-90 h-90 bg-red-600/40 rounded-full animate-float" />
        </div>

        {/* Main content */}
        <div className="relative z-10 max-w-6xl mx-auto px-12 py-10 space-y-12 mt-20">
          {/* Header */}
          <div className="animate-[slideUp_0.6s_ease-out] space-y-2">
            <p className="text-white/50 text-sm tracking-wide">
              Live analytics for{" "}
              <span className="font-bold text-stone-300">{username}</span>
            </p>
            <div className="flex items-center gap-3">
              <Rocket className="h-8 w-8 text-red-500 animate-pulse" />
              <h1 className="text-7xl text-white/80 rox tracking-tight">Dashboard</h1>
            </div>
          </div>

          {/* Stats Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-7">
            <StatCard label="Active now (live)" value={activeVisitors} icon={Activity} delay={150} />
            <StatCard label="Messages received (Total)" value={enquiries.length} icon={Mail} delay={0} />
            <StatCard
              label="Total visitors (all time)"
              value={totalVisits}
              icon={Users}
              trend={trendPercent !== null ? trendPercent : undefined}
              delay={0}
            />
          </div>

          {/* Chart Card */}
          <div className="group relative overflow-hidden rounded-3xl border border-white/20 bg-black/40 backdrop-blur-xl p-8 transition-all duration-500 hover:border-white/20 animate-[slideUp_0.6s_ease-out_0.3s_forwards] opacity-0">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-red-600/10 text-red-500 group-hover:scale-110 transition-transform">
                    <Eye className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold rox">Performance</h2>
                    <p className="text-sm text-white/40 mt-1">Traffic trends and insights</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs bg-white/5 p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => setChartView("monthly")}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${
                      chartView === "monthly"
                        ? "bg-red-600 text-white shadow-lg"
                        : "text-white/50 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Calendar className="h-4 w-4" />
                    Monthly
                  </button>
                  <button
                    onClick={() => setChartView("daily")}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${
                      chartView === "daily"
                        ? "bg-red-600 text-white shadow-lg"
                        : "text-white/50 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <BarChart3 className="h-4 w-4" />
                    Daily
                  </button>
                </div>
              </div>

              <div className="w-full h-[350px] px-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ left: 30, right: 30, top: 20, bottom: 10 }}>
                    <defs>
                      <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#dc2626" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#dc2626" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey={xAxisKey}
                      tick={{ fill: "#9ca3af", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      dy={10}
                      interval={chartView === "daily" ? 5 : 0}
                      tickFormatter={tickFormatter}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(0, 0, 0, 0.9)",
                        border: "1px solid rgba(220, 38, 38, 0.3)",
                        borderRadius: "12px",
                        padding: "12px 16px",
                        backdropFilter: "blur(12px)",
                      }}
                      labelStyle={{ color: "#e0e7ff", fontSize: "13px", fontWeight: 600 }}
                      formatter={(v: any) => [
                        <span key="visits" className="text-red-300 font-semibold">
                          {v.toLocaleString()} visits
                        </span>,
                        "Traffic",
                      ]}
                      cursor={{ stroke: "rgba(220, 38, 38, 0.3)", strokeWidth: 2 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="visits"
                      stroke="#dc2626"
                      strokeWidth={3}
                      fill="url(#colorVisits)"
                      isAnimationActive={true}
                      animationDuration={1200}
                      activeDot={{ r: 8, fill: "#ef4444", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Enquiries Card */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-8 transition-all duration-500 hover:border-white/20 animate-[slideUp_0.6s_ease-out_0.6s_forwards] opacity-0">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              {!selectedEnquiry ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-1 rounded-xl bg-red-600/10 text-red-500 scale-110 transition-transform">
                        <MessageSquare className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold rox mb-2">Voices from your audience</h2>
                        <p className="text-sm text-white/40 mb-2">Visitor messages</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                      <Asterisk className="h-4 w-4 text-red-400" />
                      <span className="text-sm font-semibold text-white/80">{enquiries.length} total</span>
                    </div>
                  </div>

                  <ScrollArea className="max-h-[380px] rounded-xl mt-2 border-t border-white/10 bg-black/20">
                    {paginated.length === 0 ? (
                      <div className="text-center py-16 text-white/40 text-sm">
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
                            className="group/item relative p-4 cursor-pointer transition-all duration-300 hover:bg-white/5 animate-[slideIn_0.4s_ease-out_forwards] opacity-0"
                          >
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-4 min-w-0 flex-1">
                                <div className="p-3 rounded-lg bg-red-600/10 group-hover/item:bg-red-600/20 transition-all flex-shrink-0">
                                  <Mail className="h-5 w-5 text-red-500" />
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className="text-sm font-semibold text-stone-400 truncate">
                                    {e.name || getEmail(e)}
                                  </span>
                                  <span className="text-xs text-white/40 flex items-center gap-2 mt-1 truncate">
                                    {getEmail(e)}
                                  </span>
                                  <span className="text-xs text-white/30 flex items-center gap-2 mt-1">
                                    {formatTime(e.created_at)}
                                  </span>
                                </div>
                              </div>
                              <ChevronRight className="h-5 w-5 text-white/30 group-hover/item:text-red-400 group-hover/item:translate-x-1 transition-all flex-shrink-0" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-6 border-t border-white/10 mt-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => setPage((p) => p - 1)}
                        className="text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all"
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
                                ? "bg-red-600 text-white"
                                : "bg-white/5 text-white/50 hover:bg-white/10"
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
                        className="text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all"
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="animate-[slideIn_0.4s_ease-out] space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-red-600/10 text-red-500">
                        <MessageSquare className="h-6 w-6" />
                      </div>
                      <h2 className="text-2xl font-bold rox">Message Details</h2>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedEnquiry(null)}
                      className="text-white/50 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                  </div>

                  <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 border border-white/10">
                    <CalendarDays className="h-5 w-5 text-red-400 flex-shrink-0" />
                    <span className="text-sm text-white/60 font-medium">
                      {formatTime(selectedEnquiry.created_at)}
                    </span>
                  </div>

                  <div className="grid gap-1">
                    {Object.entries(selectedEnquiry)
                      .filter(([k]) => k !== "id" && k !== "created_at")
                      .map(([k, v], idx) => (
                        <div
                          key={k}
                          style={{ animationDelay: `${idx * 50}ms` }}
                          className="group/field animate-[slideUp_0.4s_ease-out_forwards] opacity-0 rounded-lg border border-white/10 bg-black/20 p-4 hover:bg-white/5 transition-all"
                        >
                          <p className="text-xs font-mono uppercase tracking-widest text-red-400 mb-2 font-bold">
                            {k}
                          </p>
                          <p className="text-sm text-white/70 break-words leading-relaxed font-medium">
                            {String(v) || "—"}
                          </p>
                        </div>
                      ))}
                  </div>

                  <Button
                    onClick={() => setSelectedEnquiry(null)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-all hover:scale-[1.02] active:scale-95"
                  >
                    Back to Messages
                  </Button>
                </div>
              )}
            </div>
            <div className="text-center mt-32 text-white/20 text-xs tracking-[0.5em] uppercase">
              between coffee and code
            </div>
          </div>
        </div>
      </div>
    </>
  );
}