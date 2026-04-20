import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Clock,
  MapPin,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import supabase from "@/supabase_db/supabase_client";

type DashboardRange = "24h" | "7d" | "30d" | "all";

type EmergencyRow = {
  emergency_id: string;
  created_at?: string | null;
  updated_at?: string | null;
  is_resolved?: boolean | null;
  is_active?: boolean | null;
  responder_uid?: string | null;
  sublocality?: string | null;
  locality?: string | null;
  route?: string | null;
  full_address?: string | null;
};

type ResponderRow = {
  auth_uid?: string | null;
  firstname: string;
  lastname: string;
  middlename?: string | null;
  organization?: string | null;
  barangay?: string | null;
};

type TrendPoint = {
  bucket: string;
  count: number;
  resolved: number;
  active: number;
};

type RankedItem = {
  label: string;
  count: number;
  detail?: string;
};

const RANGE_OPTIONS: Array<{ label: string; value: DashboardRange }> = [
  { label: "24h", value: "24h" },
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "All time", value: "all" },
];

const DEFAULT_STATS = {
  totalEmergencies: 0,
  resolvedEmergencies: 0,
  activeEmergencies: 0,
  averageResponseMinutes: 0,
  resolvedRate: 0,
};

const formatMinutes = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    return "0 min";
  }

  if (value < 60) {
    return `${Math.round(value)}m`;
  }

  const hours = Math.floor(value / 60);
  const minutes = Math.round(value % 60);

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat().format(value);
};

const getRangeStart = (range: DashboardRange) => {
  const now = new Date();

  switch (range) {
    case "24h":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
};

const withinRange = (
  value: string | null | undefined,
  range: DashboardRange,
) => {
  if (!value || range === "all") {
    return true;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const rangeStart = getRangeStart(range);
  return rangeStart ? date >= rangeStart : true;
};

const getTrendBucket = (value: string, range: DashboardRange) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { label: "Unknown", sortKey: 0 };
  }

  switch (range) {
    case "24h":
      return {
        label: date.getHours().toString().padStart(2, "0") + ":00",
        sortKey: new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          date.getHours(),
        ).getTime(),
      };
    case "7d":
      return {
        label: date.toLocaleDateString(undefined, { weekday: "short" }),
        sortKey: new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
        ).getTime(),
      };
    case "30d":
      return {
        label: date.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        sortKey: new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
        ).getTime(),
      };
    default:
      return {
        label: date.toLocaleDateString(undefined, {
          month: "short",
          year: "numeric",
        }),
        sortKey: new Date(date.getFullYear(), date.getMonth(), 1).getTime(),
      };
  }
};

const getLocationLabel = (row: EmergencyRow) => {
  return (
    row.sublocality ||
    row.locality ||
    row.route ||
    row.full_address ||
    "Unidentified"
  );
};

const buildResponderName = (responder?: ResponderRow) => {
  if (!responder) {
    return "Unknown responder";
  }

  const name = [responder.firstname, responder.middlename, responder.lastname]
    .filter(Boolean)
    .join(" ");

  return name || "Unknown responder";
};

function StatCard({
  icon: Icon,
  label,
  value,
  helper,
  tone,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  helper: string;
  tone: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100/60">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <h3 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            {value}
          </h3>
          <p className="mt-2 text-xs text-slate-500">{helper}</p>
        </div>
        <div className={`rounded-2xl p-3 ${tone}`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  );
}

function RankedPanel({
  title,
  icon: Icon,
  items,
  emptyLabel,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  items: RankedItem[];
  emptyLabel: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-100/60">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-slate-950 p-2 text-white">
            <Icon size={18} />
          </div>
          <h3 className="text-lg font-bold text-slate-950">{title}</h3>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          Top 5
        </span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
          {emptyLabel}
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => {
            const maxCount = items[0]?.count || 1;
            const width = Math.max((item.count / maxCount) * 100, 8);

            return (
              <div key={`${item.label}-${index}`}>
                <div className="mb-2 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                        {index + 1}
                      </span>
                      <p className="font-semibold text-slate-950">
                        {item.label}
                      </p>
                    </div>
                    {item.detail ? (
                      <p className="mt-1 ml-9 text-xs text-slate-500">
                        {item.detail}
                      </p>
                    ) : null}
                  </div>
                  <p className="font-bold text-slate-900">
                    {formatNumber(item.count)}
                  </p>
                </div>
                <div className="ml-9 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#1E3A8A] to-[#C61F1F]"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Dashboard() {
  const [range, setRange] = useState<DashboardRange>("30d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [topResponders, setTopResponders] = useState<RankedItem[]>([]);
  const [topLocations, setTopLocations] = useState<RankedItem[]>([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const [emergenciesResult, respondersResult] = await Promise.all([
          supabase
            .from("device_states_tbl")
            .select(
              "emergency_id, created_at, updated_at, is_resolved, is_active, responder_uid, sublocality, locality, route, full_address",
            )
            .order("created_at", { ascending: false }),
          supabase
            .from("responder_tbl")
            .select(
              "auth_uid, firstname, lastname, middlename, organization, barangay",
            ),
        ]);

        if (emergenciesResult.error) {
          throw new Error(emergenciesResult.error.message);
        }

        if (respondersResult.error) {
          throw new Error(respondersResult.error.message);
        }

        const emergencyRows = (emergenciesResult.data || []) as EmergencyRow[];
        const responderRows = (respondersResult.data || []) as ResponderRow[];
        const visibleRows = emergencyRows.filter((row) => {
          const basisDate = row.updated_at || row.created_at;
          return withinRange(basisDate, range);
        });

        const totalEmergencies = visibleRows.length;
        const resolvedRows = visibleRows.filter((row) => row.is_resolved);
        const resolvedEmergencies = resolvedRows.length;
        const activeEmergencies = visibleRows.filter(
          (row) => row.is_active,
        ).length;
        const resolvedRate = totalEmergencies
          ? Math.round((resolvedEmergencies / totalEmergencies) * 100)
          : 0;

        const responseDurations = resolvedRows
          .map((row) => {
            const createdAt = row.created_at ? new Date(row.created_at) : null;
            const updatedAt = row.updated_at ? new Date(row.updated_at) : null;

            if (!createdAt || !updatedAt) {
              return 0;
            }

            return (
              Math.max(updatedAt.getTime() - createdAt.getTime(), 0) / 60000
            );
          })
          .filter((value) => value > 0);

        const averageResponseMinutes = responseDurations.length
          ? responseDurations.reduce((sum, value) => sum + value, 0) /
            responseDurations.length
          : 0;

        setStats({
          totalEmergencies,
          resolvedEmergencies,
          activeEmergencies,
          averageResponseMinutes,
          resolvedRate,
        });

        const trendMap = new Map<
          string,
          { count: number; resolved: number; active: number; sortKey: number }
        >();
        visibleRows.forEach((row) => {
          const basisDate = row.updated_at || row.created_at;
          if (!basisDate) {
            return;
          }

          const bucket = getTrendBucket(basisDate, range);
          const current = trendMap.get(bucket.label) || {
            count: 0,
            resolved: 0,
            active: 0,
            sortKey: bucket.sortKey,
          };

          current.count += 1;
          if (row.is_resolved) {
            current.resolved += 1;
          }
          if (row.is_active) {
            current.active += 1;
          }

          trendMap.set(bucket.label, current);
        });

        const trendData = Array.from(trendMap.entries())
          .map(([bucket, metrics]) => ({
            bucket,
            count: metrics.count,
            resolved: metrics.resolved,
            active: metrics.active,
            sortKey: metrics.sortKey,
          }))
          .sort((a, b) => a.sortKey - b.sortKey)
          .map(({ sortKey, ...rest }) => rest);

        setTrend(trendData);

        const responderMap = new Map<string, ResponderRow>();
        responderRows.forEach((responder) => {
          if (responder.auth_uid) {
            responderMap.set(responder.auth_uid, responder);
          }
        });

        const responderCounts = new Map<string, number>();
        resolvedRows.forEach((row) => {
          if (!row.responder_uid) {
            return;
          }

          responderCounts.set(
            row.responder_uid,
            (responderCounts.get(row.responder_uid) || 0) + 1,
          );
        });

        const topResponderData = Array.from(responderCounts.entries())
          .map(([authUid, count]) => {
            const responder = responderMap.get(authUid);
            return {
              label: buildResponderName(responder),
              count,
              detail: responder
                ? [responder.organization, responder.barangay]
                    .filter(Boolean)
                    .join(" • ")
                : authUid,
            };
          })
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setTopResponders(topResponderData);

        const locationCounts = new Map<string, number>();
        visibleRows.forEach((row) => {
          const locationLabel = getLocationLabel(row);
          locationCounts.set(
            locationLabel,
            (locationCounts.get(locationLabel) || 0) + 1,
          );
        });

        const topLocationData = Array.from(locationCounts.entries())
          .map(([label, count]) => ({ label, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setTopLocations(topLocationData);
      } catch (err: any) {
        setError(err?.message || "Failed to load dashboard data.");
        setStats(DEFAULT_STATS);
        setTrend([]);
        setTopResponders([]);
        setTopLocations([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchDashboard();
  }, [range]);

  const trendSubtitle = useMemo(() => {
    switch (range) {
      case "24h":
        return "Hourly emergency activity";
      case "7d":
        return "Daily emergency activity for the last 7 days";
      case "30d":
        return "Daily emergency activity for the last 30 days";
      default:
        return "Monthly emergency activity across all data";
    }
  }, [range]);

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,_#0f172a_0%,_#1e3a8a_55%,_#b91c1c_100%)] p-6 text-white shadow-xl shadow-slate-200/60 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
              Operations Dashboard
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Emergency activity, responder performance, and hotspot locations.
            </h2>
            <p className="mt-3 max-w-xl text-sm text-white/80">
              Focused on resolved response activity, top responders, and the
              locations where emergencies most often engage.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 rounded-2xl bg-white/10 p-2 backdrop-blur-sm">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setRange(option.value)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                  range === option.value
                    ? "bg-white text-slate-950 shadow"
                    : "text-white/85 hover:bg-white/10"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={AlertTriangle}
          label="Total Emergencies"
          value={loading ? "..." : formatNumber(stats.totalEmergencies)}
          helper="Rows currently visible in the selected range"
          tone="bg-[#1E3A8A]"
        />
        <StatCard
          icon={Clock}
          label="Avg Response Time"
          value={loading ? "..." : formatMinutes(stats.averageResponseMinutes)}
          helper="Calculated from created_at to updated_at on resolved records"
          tone="bg-[#C61F1F]"
        />
        <StatCard
          icon={Activity}
          label="Resolved Emergencies"
          value={loading ? "..." : formatNumber(stats.resolvedEmergencies)}
          helper={`${stats.resolvedRate}% resolved in the selected range`}
          tone="bg-emerald-600"
        />
        <StatCard
          icon={Users}
          label="Active Emergencies"
          value={loading ? "..." : formatNumber(stats.activeEmergencies)}
          helper="Currently active records in device_states_tbl"
          tone="bg-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-100/60">
          <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="text-[#1E3A8A]" size={20} />
                <h3 className="text-lg font-bold text-slate-950">
                  Emergency Trend
                </h3>
              </div>
              <p className="mt-1 text-sm text-slate-500">{trendSubtitle}</p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {range.toUpperCase()}
            </div>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient
                    id="dashboardTrendFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#1E3A8A" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#1E3A8A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="bucket"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "16px",
                    border: "none",
                    boxShadow: "0 10px 25px -10px rgb(15 23 42 / 0.35)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#1E3A8A"
                  fill="url(#dashboardTrendFill)"
                  fillOpacity={1}
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-100/60">
          <div className="mb-5 flex items-center gap-2">
            <MapPin className="text-[#C61F1F]" size={20} />
            <div>
              <h3 className="text-lg font-bold text-slate-950">
                Top Locations
              </h3>
              <p className="text-sm text-slate-500">
                By sublocality first, otherwise Unidentified
              </p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  className="h-16 animate-pulse rounded-2xl bg-slate-100"
                />
              ))}
            </div>
          ) : topLocations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
              No location data found for the selected range.
            </div>
          ) : (
            <div className="space-y-4">
              {topLocations.map((item, index) => {
                const maxCount = topLocations[0]?.count || 1;
                const width = Math.max((item.count / maxCount) * 100, 8);

                return (
                  <div key={`${item.label}-${index}`}>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-950">
                            {item.label}
                          </p>
                          <p className="text-xs text-slate-500">
                            Hotspot location
                          </p>
                        </div>
                      </div>
                      <p className="font-bold text-slate-900">
                        {formatNumber(item.count)}
                      </p>
                    </div>
                    <div className="ml-11 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#C61F1F] to-[#F97316]"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <RankedPanel
          title="Top Responders"
          icon={Users}
          items={topResponders}
          emptyLabel="No resolved responder assignments found for the selected range."
        />

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-100/60">
          <div className="mb-5 flex items-center gap-2">
            <TrendingUp className="text-emerald-600" size={20} />
            <div>
              <h3 className="text-lg font-bold text-slate-950">
                Dashboard Notes
              </h3>
              <p className="text-sm text-slate-500">
                Operational totals for the selected range
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Resolved Rate
              </p>
              <p className="mt-2 text-3xl font-black text-slate-950">
                {stats.resolvedRate}%
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Resolved vs all visible emergencies
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Top Hotspot Count
              </p>
              <p className="mt-2 text-3xl font-black text-slate-950">
                {topLocations[0]?.count
                  ? formatNumber(topLocations[0].count)
                  : "0"}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Highest emergency concentration in the list
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            Top emergencies were intentionally excluded. The dashboard now
            focuses on responder performance and hotspot locations.
          </div>
        </div>
      </div>
    </div>
  );
}
