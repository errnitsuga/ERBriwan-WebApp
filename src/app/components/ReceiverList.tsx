import React, { useState, useEffect } from "react";
import {
  Search,
  MoreVertical,
  BadgeCheck,
  Clock,
  MapPin,
  Mail,
  Phone,
  AlertCircle,
} from "lucide-react";
import { getAllResponders } from "@/supabase_db/api";
import { motion } from "motion/react";
import supabase from "@/supabase_db/supabase_client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

const escapeRegExp = (value: string) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const normalizeSearchText = (value: string) => {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

const highlightMatch = (text: string, searchTerm: string) => {
  if (!searchTerm.trim()) {
    return text;
  }

  const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, "ig");
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.toLowerCase() === searchTerm.toLowerCase()) {
      return (
        <mark
          key={`${part}-${index}`}
          className="bg-yellow-200 text-inherit px-0.5 rounded-sm"
        >
          {part}
        </mark>
      );
    }

    return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
  });
};

interface Responder {
  id: string | number;
  auth_uid?: string | null;
  firstname: string;
  lastname: string;
  email: string;
  organization: string;
  region: string;
  city_municipality: string;
  barangay: string;
  phone_number: string;
  created_at?: string;
}

interface EmergencyRecord {
  emergency_id: string;
  created_at: string | null;
  updated_at: string;
  is_resolved: boolean;
  is_active: boolean;
  device_id: string;
  full_address: string | null;
}

type TimeFilter = "24h" | "week" | "month" | "year" | "all";

interface PerformanceData {
  respondedCount: number;
  resolvedCount: number;
  activeCount: number;
  unresolvedCount: number;
  trend: Array<{ bucket: string; responded: number; resolved: number }>;
  emergencies: EmergencyRecord[];
}

const TIME_FILTER_OPTIONS: Array<{ value: TimeFilter; label: string }> = [
  { value: "24h", label: "Last 24h" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
  { value: "all", label: "All Time" },
];

const CHART_COLORS = {
  responded: "#1E3A8A",
  resolved: "#16A34A",
  unresolved: "#DC2626",
};

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleString();
};

const getRangeStart = (filter: TimeFilter): Date | null => {
  const now = new Date();

  if (filter === "all") {
    return null;
  }

  const start = new Date(now);
  if (filter === "24h") {
    start.setHours(now.getHours() - 24);
    return start;
  }

  if (filter === "week") {
    const dayOfWeek = now.getDay();
    const daysFromMonday = (dayOfWeek + 6) % 7;
    start.setDate(now.getDate() - daysFromMonday);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (filter === "month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  start.setMonth(0, 1);
  start.setHours(0, 0, 0, 0);
  return start;
};

const getBucketKey = (dateValue: string, filter: TimeFilter) => {
  const date = new Date(dateValue);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");

  if (filter === "24h") {
    return `${month}/${day} ${hour}:00`;
  }

  if (filter === "year") {
    return `${year}-${month}`;
  }

  if (filter === "all") {
    return `${year}`;
  }

  return `${year}-${month}-${day}`;
};

export function ReceiverList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 10;
  const [receivers, setReceivers] = useState<Responder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReceiver, setSelectedReceiver] = useState<Responder | null>(
    null,
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [performanceError, setPerformanceError] = useState("");
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    respondedCount: 0,
    resolvedCount: 0,
    activeCount: 0,
    unresolvedCount: 0,
    trend: [],
    emergencies: [],
  });

  useEffect(() => {
    fetchResponders();
  }, []);

  const fetchResponders = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAllResponders();
      console.log("API Response:", data);

      // Handle different response formats
      let responderArray: Responder[] = [];
      if (Array.isArray(data)) {
        responderArray = data;
      } else if (data?.data && Array.isArray(data.data)) {
        responderArray = data.data;
      } else if (data?.responders && Array.isArray(data.responders)) {
        responderArray = data.responders;
      } else {
        console.warn("Unexpected API response format:", data);
        responderArray = [];
      }

      const normalizedResponders: Responder[] = responderArray.map(
        (row: any) => ({
          ...row,
          auth_uid: row?.auth_uid ?? row?.authUid ?? row?.responder_uid ?? null,
        }),
      );

      setReceivers(normalizedResponders);
    } catch (err: any) {
      console.error("Error fetching responders:", err);
      setError(
        err?.message ||
          "Failed to fetch responders. Please check your connection and try again.",
      );
      setReceivers([]);
    } finally {
      setLoading(false);
    }
  };

  const resolveResponderAuthUid = async (responder: Responder) => {
    if (responder.auth_uid) {
      return responder.auth_uid;
    }

    const responderId =
      typeof responder.id === "number" ? responder.id : Number(responder.id);

    if (!Number.isNaN(responderId)) {
      const { data: byId, error: byIdError } = await supabase
        .from("responder_tbl")
        .select("auth_uid")
        .eq("id", responderId)
        .maybeSingle();

      if (!byIdError && byId?.auth_uid) {
        return byId.auth_uid;
      }
    }

    if (responder.email) {
      const { data: byEmail, error: byEmailError } = await supabase
        .from("responder_tbl")
        .select("auth_uid")
        .eq("email", responder.email)
        .maybeSingle();

      if (!byEmailError && byEmail?.auth_uid) {
        return byEmail.auth_uid;
      }
    }

    if (responder.phone_number) {
      const { data: byPhone, error: byPhoneError } = await supabase
        .from("responder_tbl")
        .select("auth_uid")
        .eq("phone_number", responder.phone_number)
        .maybeSingle();

      if (!byPhoneError && byPhone?.auth_uid) {
        return byPhone.auth_uid;
      }
    }

    return null;
  };

  const fetchResponderPerformance = async (
    responder: Responder,
    filter: TimeFilter,
  ) => {
    const responderAuthUid = await resolveResponderAuthUid(responder);

    if (!responderAuthUid) {
      setPerformanceError(
        `Responder auth_uid could not be resolved for ${responder.firstname} ${responder.lastname} (id: ${responder.id}).`,
      );
      setPerformanceData({
        respondedCount: 0,
        resolvedCount: 0,
        activeCount: 0,
        unresolvedCount: 0,
        trend: [],
        emergencies: [],
      });
      return;
    }

    setPerformanceLoading(true);
    setPerformanceError("");

    try {
      const rangeStart = getRangeStart(filter);
      let query = supabase
        .from("device_states_tbl")
        .select(
          "emergency_id, created_at, updated_at, is_resolved, is_active, device_id, full_address, responder_uid",
        )
        .eq("responder_uid", responderAuthUid)
        .order("updated_at", { ascending: false });

      if (rangeStart) {
        query = query.gte("updated_at", rangeStart.toISOString());
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        throw new Error(queryError.message);
      }

      const rows = (data || []) as EmergencyRecord[];
      const respondedCount = new Set(rows.map((row) => row.emergency_id)).size;
      const resolvedRows = rows.filter((row) => row.is_resolved);
      const resolvedCount = new Set(resolvedRows.map((row) => row.emergency_id))
        .size;
      const activeCount = rows.filter((row) => row.is_active).length;
      const unresolvedCount = Math.max(respondedCount - resolvedCount, 0);

      const trendMap = new Map<
        string,
        { responded: number; resolved: number }
      >();

      rows.forEach((row) => {
        const basisDate = row.updated_at || row.created_at;
        if (!basisDate) {
          return;
        }

        const bucket = getBucketKey(basisDate, filter);
        const current = trendMap.get(bucket) || { responded: 0, resolved: 0 };
        current.responded += 1;
        if (row.is_resolved) {
          current.resolved += 1;
        }
        trendMap.set(bucket, current);
      });

      const trend = Array.from(trendMap.entries())
        .map(([bucket, metrics]) => ({
          bucket,
          responded: metrics.responded,
          resolved: metrics.resolved,
        }))
        .sort((a, b) => a.bucket.localeCompare(b.bucket));

      setPerformanceData({
        respondedCount,
        resolvedCount,
        activeCount,
        unresolvedCount,
        trend,
        emergencies: rows,
      });
    } catch (err: any) {
      setPerformanceError(
        err?.message || "Failed to load responder performance.",
      );
      setPerformanceData({
        respondedCount: 0,
        resolvedCount: 0,
        activeCount: 0,
        unresolvedCount: 0,
        trend: [],
        emergencies: [],
      });
    } finally {
      setPerformanceLoading(false);
    }
  };

  const openReceiverDetails = async (receiver: Responder) => {
    setSelectedReceiver(receiver);
    setTimeFilter("all");
    setIsDetailsOpen(true);
    await fetchResponderPerformance(receiver, "all");
  };

  const onTimeFilterChange = async (filter: TimeFilter) => {
    setTimeFilter(filter);
    if (selectedReceiver) {
      await fetchResponderPerformance(selectedReceiver, filter);
    }
  };

  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm]);

  const filteredReceivers = receivers.filter((r: Responder) => {
    const searchLower = normalizeSearchText(searchTerm);
    if (!searchLower) {
      return true;
    }

    const searchableText = normalizeSearchText(
      [
        r.firstname || "",
        r.lastname || "",
        r.email || "",
        r.organization || "",
        r.region || "",
        r.city_municipality || "",
        r.barangay || "",
        r.phone_number || "",
      ].join(" "),
    );

    return searchableText.includes(searchLower);
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredReceivers.length / ITEMS_PER_PAGE);
  const paginatedReceivers = filteredReceivers.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE,
  );

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const donutData = [
    { name: "Resolved", value: performanceData.resolvedCount },
    { name: "Unresolved", value: performanceData.unresolvedCount },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Registered Responders
          </h2>
          <p className="text-gray-500 text-sm">
            Manage and monitor all emergency responders in the system.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search responders..."
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 text-red-600 text-sm py-3 px-4 rounded-xl font-medium flex items-center gap-2 border border-red-100"
        >
          <AlertCircle size={16} />
          {error}
        </motion.div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full"
              />
              <span className="ml-4 text-gray-600 font-medium">
                Loading responders...
              </span>
            </div>
          ) : receivers.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">No responders found.</p>
                <p className="text-xs text-gray-400 mt-1">
                  Start by registering a new responder.
                </p>
              </div>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Responder
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Organization
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedReceivers.map((receiver: Responder) => (
                    <tr
                      key={receiver.id}
                      className="hover:bg-blue-50/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                            {receiver.firstname?.[0] || "R"}
                            {receiver.lastname?.[0] || "U"}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900 flex items-center gap-1">
                              {highlightMatch(
                                `${receiver.firstname || "Unknown"} ${receiver.lastname || "User"}`,
                                searchTerm,
                              )}
                              <BadgeCheck size={14} className="text-blue-500" />
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <Mail size={12} />
                              {highlightMatch(
                                receiver.email || "No email",
                                searchTerm,
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            receiver.organization === "Police"
                              ? "bg-blue-100 text-blue-700"
                              : receiver.organization === "Health"
                                ? "bg-red-100 text-red-700"
                                : receiver.organization === "BFP"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-green-100 text-green-700"
                          }`}
                        >
                          {highlightMatch(
                            receiver.organization || "Unknown",
                            searchTerm,
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin size={14} className="text-gray-400" />
                          {highlightMatch(
                            `${receiver.barangay || "N/A"}, ${receiver.city_municipality || "N/A"}`,
                            searchTerm,
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-600 flex items-center gap-1">
                          <Phone size={12} />
                          {highlightMatch(
                            receiver.phone_number || "No phone",
                            searchTerm,
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 hover:bg-gray-100 rounded-lg text-gray-400">
                              <MoreVertical size={18} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => void openReceiverDetails(receiver)}
                            >
                              View details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
        {filteredReceivers.length > 0 && !loading && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {paginatedReceivers.length} of {filteredReceivers.length}{" "}
              responders
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={handlePrevPage}
                disabled={currentPage === 0}
                className="px-3 py-1 border border-gray-200 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Prev
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage + 1} of {Math.max(1, totalPages)}
              </span>
              <button 
                onClick={handleNextPage}
                disabled={currentPage >= totalPages - 1}
                className="px-3 py-1 bg-[#1E3A8A] text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1e3a8a]/90"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedReceiver
                ? `${selectedReceiver.firstname} ${selectedReceiver.lastname} - Performance`
                : "Responder Performance"}
            </DialogTitle>
            <DialogDescription>
              Receiver-specific performance summary, trends, and emergency
              history.
            </DialogDescription>
          </DialogHeader>

          {selectedReceiver && (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {TIME_FILTER_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => void onTimeFilterChange(option.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      timeFilter === option.value
                        ? "bg-[#1E3A8A] text-white border-[#1E3A8A]"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {performanceError && (
                <div className="bg-red-50 text-red-700 text-sm py-3 px-4 rounded-lg border border-red-100">
                  {performanceError}
                </div>
              )}

              {performanceLoading ? (
                <div className="flex items-center justify-center py-16">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full"
                  />
                  <span className="ml-4 text-gray-600 font-medium">
                    Loading performance metrics...
                  </span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-gray-200 p-4 bg-blue-50">
                      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                        Responded Emergencies
                      </p>
                      <p className="text-3xl font-bold text-blue-900 mt-1">
                        {performanceData.respondedCount}
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-200 p-4 bg-green-50">
                      <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                        Resolved Emergencies
                      </p>
                      <p className="text-3xl font-bold text-green-900 mt-1">
                        {performanceData.resolvedCount}
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-200 p-4 bg-amber-50">
                      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                        Active Emergencies
                      </p>
                      <p className="text-3xl font-bold text-amber-900 mt-1">
                        {performanceData.activeCount}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="rounded-xl border border-gray-200 p-4 bg-white">
                      <p className="text-sm font-semibold text-gray-900 mb-3">
                        Emergency Trend
                      </p>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={performanceData.trend}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="bucket" />
                            <YAxis allowDecimals={false} />
                            <RechartsTooltip />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="responded"
                              stroke={CHART_COLORS.responded}
                              strokeWidth={2}
                              dot={false}
                            />
                            <Line
                              type="monotone"
                              dataKey="resolved"
                              stroke={CHART_COLORS.resolved}
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 p-4 bg-white">
                      <p className="text-sm font-semibold text-gray-900 mb-3">
                        Resolved vs Unresolved
                      </p>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={donutData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={95}
                              label
                            >
                              {donutData.map((entry) => (
                                <Cell
                                  key={entry.name}
                                  fill={
                                    entry.name === "Resolved"
                                      ? CHART_COLORS.resolved
                                      : CHART_COLORS.unresolved
                                  }
                                />
                              ))}
                            </Pie>
                            <Legend />
                            <RechartsTooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-4 bg-white">
                    <p className="text-sm font-semibold text-gray-900 mb-3">
                      Recent Emergencies (Responder-Specific)
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Emergency ID
                            </th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Created At
                            </th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Updated At
                            </th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Device ID
                            </th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Address
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {performanceData.emergencies.length === 0 ? (
                            <tr>
                              <td
                                colSpan={6}
                                className="px-4 py-8 text-center text-sm text-gray-500"
                              >
                                No emergency records for this responder in the
                                selected range.
                              </td>
                            </tr>
                          ) : (
                            performanceData.emergencies
                              .slice(0, 15)
                              .map((emergency) => (
                                <tr key={emergency.emergency_id}>
                                  <td className="px-4 py-3 text-xs font-mono text-gray-700">
                                    {emergency.emergency_id}
                                  </td>
                                  <td className="px-4 py-3 text-xs text-gray-700">
                                    {formatDateTime(emergency.created_at)}
                                  </td>
                                  <td className="px-4 py-3 text-xs text-gray-700">
                                    {formatDateTime(emergency.updated_at)}
                                  </td>
                                  <td className="px-4 py-3 text-xs">
                                    <span
                                      className={`px-2 py-1 rounded-md font-semibold ${
                                        emergency.is_resolved
                                          ? "bg-green-100 text-green-700"
                                          : "bg-red-100 text-red-700"
                                      }`}
                                    >
                                      {emergency.is_resolved
                                        ? "Resolved"
                                        : "Unresolved"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-xs font-mono text-gray-700">
                                    {emergency.device_id}
                                  </td>
                                  <td
                                    className="px-4 py-3 text-xs text-gray-700 max-w-[320px] truncate"
                                    title={emergency.full_address || "N/A"}
                                  >
                                    {emergency.full_address || "N/A"}
                                  </td>
                                </tr>
                              ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
