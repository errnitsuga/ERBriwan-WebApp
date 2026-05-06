import React, { useState, useEffect } from "react";
import {
  Search,
  MoreVertical,
  BadgeCheck,
  Clock,
  MapPin,
  Phone,
  AlertCircle,
  IdCard,
} from "lucide-react";
import { getAllUsers } from "@/supabase_db/api";
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

interface Sender {
  id: string;
  user_uid?: string;
  auth_uid?: string;
  firstname: string;
  lastname: string;
  middlename?: string;
  birthdate?: string;
  emergency_contact?: string;
  emergency_person?: string;
  account_status?: string;
  region: string;
  city_municipality: string;
  barangay: string;
  contact: string;
  device_id: string;
  is_verified?: boolean;
  registered_at?: string;
}

interface DeviceEmergencyRecord {
  emergency_id: string;
  created_at?: string | null;
  updated_at?: string | null;
  is_resolved?: boolean | null;
  is_active?: boolean | null;
  device_id: string;
  receiver_id?: string | null;
  ping_count?: number | null;
  longitude?: number | null;
  latitude?: number | null;
  altitude?: number | null;
  speed?: number | null;
  full_address?: string | null;
  sublocality?: string | null;
  locality?: string | null;
  route?: string | null;
}

interface DeviceHistoryRecord {
  id?: number;
  emergency_id: string;
  created_at?: string | null;
  is_resolved?: boolean | null;
  is_active?: boolean | null;
  ping_count?: number | null;
  speed_kmph?: number | null;
  longitude?: number | null;
  latitude?: number | null;
  altitude?: number | null;
  full_address?: string | null;
  sublocality?: string | null;
  locality?: string | null;
  route?: string | null;
  device_id: string;
}

interface DeviceTrendPoint {
  bucket: string;
  emergencies: number;
  resolved: number;
  active: number;
}

interface DevicePerformanceData {
  emergencyCount: number;
  resolvedCount: number;
  activeCount: number;
  unresolvedCount: number;
  averageDurationMinutes: number;
  longestDurationMinutes: number;
  latestEmergencyAt: string | null;
  latestAddress: string;
  averageSpeed: number;
  maxSpeed: number;
  averagePingCount: number;
  maxPingCount: number;
  trend: DeviceTrendPoint[];
  emergencies: DeviceEmergencyRecord[];
  history: DeviceHistoryRecord[];
}

const DEFAULT_DEVICE_PERFORMANCE: DevicePerformanceData = {
  emergencyCount: 0,
  resolvedCount: 0,
  activeCount: 0,
  unresolvedCount: 0,
  averageDurationMinutes: 0,
  longestDurationMinutes: 0,
  latestEmergencyAt: null,
  latestAddress: "N/A",
  averageSpeed: 0,
  maxSpeed: 0,
  averagePingCount: 0,
  maxPingCount: 0,
  trend: [],
  emergencies: [],
  history: [],
};

const CHART_COLORS = {
  emergencies: "#1d4ed8",
  resolved: "#16a34a",
  active: "#f59e0b",
  unresolved: "#dc2626",
};

const timeBuckets = ["24h", "week", "month", "year", "all"] as const;

type DeviceTimeFilter = (typeof timeBuckets)[number];

const USER_VALID_ID_BUCKET = "user_valid_id";
const USER_VALID_ID_PRIVATE_FOLDER = "private";

const formatDate = (value?: string) => {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleDateString();
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

const formatMinutes = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    return "0 min";
  }

  if (value < 60) {
    return `${Math.round(value)} min`;
  }

  const hours = Math.floor(value / 60);
  const remainingMinutes = Math.round(value % 60);

  if (remainingMinutes === 0) {
    return `${hours} hr${hours > 1 ? "s" : ""}`;
  }

  return `${hours} hr${hours > 1 ? "s" : ""} ${remainingMinutes} min`;
};

const getRangeStart = (filter: DeviceTimeFilter) => {
  const now = new Date();

  switch (filter) {
    case "24h":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "week":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "month":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "year":
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
};

const getBucketKey = (value: string, filter: DeviceTimeFilter) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  switch (filter) {
    case "24h":
      return `${date.getHours().toString().padStart(2, "0")}:00`;
    case "week":
      return date.toLocaleDateString(undefined, { weekday: "short" });
    case "month":
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    case "year":
      return date.toLocaleDateString(undefined, { month: "short" });
    default:
      return date.toLocaleDateString();
  }
};

const safeNumber = (value?: number | null) => {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
};

const combineAddress = (
  value: Partial<DeviceEmergencyRecord & DeviceHistoryRecord>,
) => {
  return (
    value.full_address ||
    [value.route, value.sublocality, value.locality]
      .filter(Boolean)
      .join(", ") ||
    "N/A"
  );
};

export function SenderList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 10;
  const [senders, setSenders] = useState<Sender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSender, setSelectedSender] = useState<Sender | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [validIdImageUrl, setValidIdImageUrl] = useState<string | null>(null);
  const [validIdLoading, setValidIdLoading] = useState(false);
  const [validIdError, setValidIdError] = useState("");
  const [isDeviceDetailsOpen, setIsDeviceDetailsOpen] = useState(false);
  const [deviceDetailsFilter, setDeviceDetailsFilter] =
    useState<DeviceTimeFilter>("all");
  const [devicePerformanceData, setDevicePerformanceData] =
    useState<DevicePerformanceData>(DEFAULT_DEVICE_PERFORMANCE);
  const [devicePerformanceLoading, setDevicePerformanceLoading] =
    useState(false);
  const [devicePerformanceError, setDevicePerformanceError] = useState("");

  useEffect(() => {
    fetchSenders();
  }, []);

  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm]);

  const fetchSenders = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAllUsers();
      console.log("getAllUsers raw response:", data);

      // Normalize different possible response shapes from the API
      let usersArray: any[] = [];

      if (Array.isArray(data)) {
        usersArray = data;
      } else if (data?.data && Array.isArray(data.data)) {
        usersArray = data.data;
      } else if (data?.users && Array.isArray(data.users)) {
        usersArray = data.users;
      } else if (data?.senders && Array.isArray(data.senders)) {
        // In case backend uses "senders" terminology
        usersArray = data.senders;
      } else if (data && typeof data === "object") {
        // Fallback: pick the first array-valued property
        const firstArrayProp = Object.values(data).find((v) =>
          Array.isArray(v),
        ) as Sender[] | undefined;
        if (firstArrayProp) {
          usersArray = firstArrayProp;
        }
      }

      if (!usersArray.length) {
        console.warn(
          "Unexpected getAllUsers API response format, no users array found:",
          data,
        );
      }

      const mappedSenders: Sender[] = usersArray.map((u) => {
        return {
          id: u.id,
          user_uid: u.user_uid ?? undefined,
          auth_uid: u.auth_uid ?? undefined,
          firstname: u.firstname ?? "",
          lastname: u.lastname ?? "",
          middlename: u.middlename ?? undefined,
          birthdate: u.birthdate ?? undefined,
          emergency_contact: u.emergency_contact ?? undefined,
          emergency_person: u.emergency_person ?? undefined,
          account_status: u.account_status ?? "unverified",
          region: u.region ?? "",
          city_municipality: u.city_municipality ?? "",
          barangay: u.barangay ?? "",
          contact: u.contact ?? "",
          device_id: u.device_id ?? "",
          is_verified: u.is_verified ?? false,
          registered_at: u.registered_at ?? undefined,
        };
      });

      console.log("Mapped senders for UI:", mappedSenders);
      setSenders(mappedSenders);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch users. Please try again.");
      console.error("Error fetching users:", err);
      setSenders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadLatestValidIdImage = async (sender: Sender) => {
    setValidIdLoading(true);
    setValidIdError("");
    setValidIdImageUrl(null);

    try {
      const uidCandidates = [sender.id, sender.user_uid, sender.auth_uid]
        .filter((uid): uid is string => Boolean(uid))
        .filter((uid, index, arr) => arr.indexOf(uid) === index);

      const attemptedPaths: string[] = [];
      let lastStorageError = "";

      for (const uid of uidCandidates) {
        const folderPath = `${USER_VALID_ID_PRIVATE_FOLDER}/${sender.device_id}/${uid}`;
        attemptedPaths.push(folderPath);

        const { data: files, error: listError } = await supabase.storage
          .from(USER_VALID_ID_BUCKET)
          .list(folderPath, {
            limit: 100,
            offset: 0,
            sortBy: { column: "created_at", order: "desc" },
          });

        if (listError) {
          lastStorageError = listError.message;
          continue;
        }

        const fileCandidates = (files || []).filter((file) => !!file.name);
        if (fileCandidates.length === 0) {
          continue;
        }

        const latestFile = [...fileCandidates].sort((a, b) => {
          const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;

          if (aTime === bTime) {
            return b.name.localeCompare(a.name);
          }

          return bTime - aTime;
        })[0];

        const objectPath = `${folderPath}/${latestFile.name}`;
        const { data: signedData, error: signError } = await supabase.storage
          .from(USER_VALID_ID_BUCKET)
          .createSignedUrl(objectPath, 60 * 60);

        if (signError) {
          lastStorageError = signError.message;
          continue;
        }

        if (signedData?.signedUrl) {
          setValidIdImageUrl(signedData.signedUrl);
          return;
        }
      }

      if (lastStorageError) {
        setValidIdError(
          `Failed to load valid ID. ${lastStorageError}. Attempted: ${attemptedPaths.join(" | ")}`,
        );
        return;
      }

      setValidIdError(
        `No uploaded valid ID found. Attempted: ${attemptedPaths.join(" | ")}`,
      );
    } catch (err: any) {
      setValidIdError(err?.message || "Failed to load valid ID image.");
    } finally {
      setValidIdLoading(false);
    }
  };

  const openDetailsModal = async (sender: Sender) => {
    setSelectedSender(sender);
    setIsDetailsOpen(true);
    await loadLatestValidIdImage(sender);
  };

  const loadDeviceDetails = async (
    sender: Sender,
    filter: DeviceTimeFilter,
  ) => {
    if (!sender.device_id) {
      setDevicePerformanceError("No device ID is available for this sender.");
      setDevicePerformanceData(DEFAULT_DEVICE_PERFORMANCE);
      return;
    }

    setDevicePerformanceLoading(true);
    setDevicePerformanceError("");

    try {
      const rangeStart = getRangeStart(filter);

      const [statesResult, historyResult] = await Promise.all([
        supabase
          .from("device_states_tbl")
          .select(
            "emergency_id, created_at, updated_at, is_resolved, is_active, device_id, receiver_id, ping_count, longitude, latitude, altitude, speed, full_address, sublocality, locality, route",
          )
          .eq("device_id", sender.device_id)
          .order("updated_at", { ascending: false }),
        supabase
          .from("location_click_history")
          .select(
            "id, emergency_id, created_at, is_resolved, is_active, ping_count, speed_kmph, longitude, latitude, altitude, full_address, sublocality, locality, route, device_id",
          )
          .eq("device_id", sender.device_id)
          .order("created_at", { ascending: false }),
      ]);

      if (statesResult.error) {
        throw new Error(statesResult.error.message);
      }

      if (historyResult.error) {
        throw new Error(historyResult.error.message);
      }

      const emergencyRows = (statesResult.data ||
        []) as DeviceEmergencyRecord[];
      const historyRows = (historyResult.data || []) as DeviceHistoryRecord[];

      const filteredEmergencyRows = rangeStart
        ? emergencyRows.filter((row) => {
            const basisDate = row.updated_at || row.created_at;
            return basisDate ? new Date(basisDate) >= rangeStart : false;
          })
        : emergencyRows;

      const filteredHistoryRows = rangeStart
        ? historyRows.filter((row) => {
            const basisDate = row.created_at;
            return basisDate ? new Date(basisDate) >= rangeStart : false;
          })
        : historyRows;

      const emergencyCount = new Set(
        filteredEmergencyRows.map((row) => row.emergency_id),
      ).size;
      const resolvedRows = filteredEmergencyRows.filter(
        (row) => row.is_resolved,
      );
      const resolvedCount = new Set(resolvedRows.map((row) => row.emergency_id))
        .size;
      const activeCount = filteredEmergencyRows.filter(
        (row) => row.is_active,
      ).length;
      const unresolvedCount = Math.max(emergencyCount - resolvedCount, 0);

      const durationValues = filteredEmergencyRows
        .filter((row) => row.is_resolved)
        .map((row) => {
          const createdAt = row.created_at ? new Date(row.created_at) : null;
          const updatedAt = row.updated_at ? new Date(row.updated_at) : null;

          if (!createdAt || !updatedAt) {
            return 0;
          }

          return Math.max(updatedAt.getTime() - createdAt.getTime(), 0) / 60000;
        })
        .filter((value) => value > 0);

      const averageDurationMinutes = durationValues.length
        ? durationValues.reduce((sum, value) => sum + value, 0) /
          durationValues.length
        : 0;
      const longestDurationMinutes = durationValues.length
        ? Math.max(...durationValues)
        : 0;

      const latestEmergencyRecord = [...filteredEmergencyRows].sort((a, b) => {
        const aTime = new Date(a.updated_at || a.created_at || 0).getTime();
        const bTime = new Date(b.updated_at || b.created_at || 0).getTime();
        return bTime - aTime;
      })[0];

      const latestHistoryRecord = [...filteredHistoryRows].sort((a, b) => {
        const aTime = new Date(a.created_at || 0).getTime();
        const bTime = new Date(b.created_at || 0).getTime();
        return bTime - aTime;
      })[0];

      const averageSpeedValues = filteredHistoryRows
        .map((row) => safeNumber(row.speed_kmph))
        .filter((value) => value > 0);
      const pingCountValues = filteredHistoryRows
        .map((row) => safeNumber(row.ping_count))
        .filter((value) => value >= 0);

      const trendMap = new Map<
        string,
        { emergencies: number; resolved: number; active: number }
      >();

      filteredEmergencyRows.forEach((row) => {
        const basisDate = row.updated_at || row.created_at;
        if (!basisDate) {
          return;
        }

        const bucket = getBucketKey(basisDate, filter);
        const current = trendMap.get(bucket) || {
          emergencies: 0,
          resolved: 0,
          active: 0,
        };

        current.emergencies += 1;
        if (row.is_resolved) {
          current.resolved += 1;
        }
        if (row.is_active) {
          current.active += 1;
        }

        trendMap.set(bucket, current);
      });

      const trend = Array.from(trendMap.entries())
        .map(([bucket, metrics]) => ({
          bucket,
          emergencies: metrics.emergencies,
          resolved: metrics.resolved,
          active: metrics.active,
        }))
        .sort((a, b) => a.bucket.localeCompare(b.bucket));

      setDevicePerformanceData({
        emergencyCount,
        resolvedCount,
        activeCount,
        unresolvedCount,
        averageDurationMinutes,
        longestDurationMinutes,
        latestEmergencyAt:
          latestEmergencyRecord?.updated_at ||
          latestEmergencyRecord?.created_at ||
          null,
        latestAddress:
          combineAddress(latestHistoryRecord || latestEmergencyRecord || {}) ||
          "N/A",
        averageSpeed: averageSpeedValues.length
          ? averageSpeedValues.reduce((sum, value) => sum + value, 0) /
            averageSpeedValues.length
          : 0,
        maxSpeed: averageSpeedValues.length
          ? Math.max(...averageSpeedValues)
          : 0,
        averagePingCount: pingCountValues.length
          ? pingCountValues.reduce((sum, value) => sum + value, 0) /
            pingCountValues.length
          : 0,
        maxPingCount: pingCountValues.length ? Math.max(...pingCountValues) : 0,
        trend,
        emergencies: filteredEmergencyRows,
        history: filteredHistoryRows,
      });
    } catch (err: any) {
      setDevicePerformanceError(
        err?.message || "Failed to load device emergency details.",
      );
      setDevicePerformanceData(DEFAULT_DEVICE_PERFORMANCE);
    } finally {
      setDevicePerformanceLoading(false);
    }
  };

  const openDeviceDetails = async (sender: Sender) => {
    setIsDeviceDetailsOpen(true);
    setDeviceDetailsFilter("all");
    await loadDeviceDetails(sender, "all");
  };

  const onDeviceDetailsFilterChange = async (filter: DeviceTimeFilter) => {
    setDeviceDetailsFilter(filter);
    if (selectedSender) {
      await loadDeviceDetails(selectedSender, filter);
    }
  };

  const filteredSenders = senders.filter((sender: Sender) => {
    const searchLower = normalizeSearchText(searchTerm);
    if (!searchLower) {
      return true;
    }

    const searchableText = normalizeSearchText(
      [
        sender.firstname || "",
        sender.lastname || "",
        sender.middlename || "",
        sender.contact || "",
        sender.device_id || "",
        sender.region || "",
        sender.city_municipality || "",
        sender.barangay || "",
        sender.account_status || "",
      ].join(" "),
    );

    return searchableText.includes(searchLower);
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredSenders.length / ITEMS_PER_PAGE);
  const paginatedSenders = filteredSenders.slice(
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Registered Users (Senders)
          </h2>
          <p className="text-gray-500 text-sm">
            Monitor all registered system users and their emergency contact
            information.
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
              placeholder="Search users..."
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

      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full"
            />
            <span className="ml-4 text-gray-600 font-medium">
              Loading users...
            </span>
          </div>
        </div>
      ) : senders.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">No users found.</p>
              <p className="text-xs text-gray-400 mt-1">
                Users will appear here once registered.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            {filteredSenders.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <AlertCircle
                    size={32}
                    className="mx-auto text-gray-400 mb-2"
                  />
                  <p className="text-gray-500">No users matched your search.</p>
                </div>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Sender
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Device
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedSenders.map((sender: Sender) => (
                    <tr
                      key={sender.id}
                      className="hover:bg-blue-50/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                            {sender.firstname?.[0] || "U"}
                            {sender.lastname?.[0] || "S"}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900 flex items-center gap-1">
                              {highlightMatch(
                                `${sender.firstname || "Unknown"} ${sender.lastname || "User"}`,
                                searchTerm,
                              )}
                              {sender.is_verified && (
                                <BadgeCheck
                                  size={14}
                                  className="text-blue-500"
                                />
                              )}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <Clock size={12} />
                              {highlightMatch(
                                sender.registered_at
                                  ? new Date(
                                      sender.registered_at,
                                    ).toLocaleDateString()
                                  : "Unknown registration date",
                                searchTerm,
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin size={14} className="text-gray-400" />
                          {highlightMatch(
                            `${sender.barangay || "N/A"}, ${sender.city_municipality || "N/A"}`,
                            searchTerm,
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-600 flex items-center gap-1">
                          <Phone size={12} />
                          {highlightMatch(
                            sender.contact || "No contact",
                            searchTerm,
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className="text-xs font-mono text-gray-600 max-w-[160px] truncate"
                          title={sender.device_id}
                        >
                          {highlightMatch(
                            sender.device_id || "No device id",
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
                              onClick={() => void openDetailsModal(sender)}
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

          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {paginatedSenders.length} of {filteredSenders.length} users
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
        </div>
      )}

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sender Full Details</DialogTitle>
            <DialogDescription>
              Complete user information and latest uploaded valid ID image.
            </DialogDescription>
          </DialogHeader>

          {selectedSender && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Full Name
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {selectedSender.firstname} {selectedSender.middlename || ""}{" "}
                    {selectedSender.lastname}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Birthdate
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {formatDate(selectedSender.birthdate)}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Contact
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {selectedSender.contact || "N/A"}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Emergency Contact
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {selectedSender.emergency_contact || "N/A"}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Emergency Person
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {selectedSender.emergency_person || "N/A"}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Registered At
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {formatDate(selectedSender.registered_at)}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 bg-gray-50 md:col-span-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Address
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {selectedSender.barangay || "N/A"},{" "}
                    {selectedSender.city_municipality || "N/A"},{" "}
                    {selectedSender.region || "N/A"}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    User UUID
                  </p>
                  <p className="text-sm font-mono text-gray-900 mt-1 break-all">
                    {selectedSender.id}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Device ID
                  </p>
                  <p className="text-sm font-mono text-gray-900 mt-1 break-all">
                    {selectedSender.device_id || "N/A"}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Account Status
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {selectedSender.account_status || "unverified"}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Is Verified
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {selectedSender.is_verified ? "Yes" : "No"}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-4 bg-white">
                <div className="flex items-center gap-2 mb-3">
                  <IdCard size={16} className="text-gray-500" />
                  <p className="text-sm font-semibold text-gray-900">
                    Valid ID (Latest Upload)
                  </p>
                </div>

                {validIdLoading && (
                  <div className="flex items-center justify-center py-8">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-6 h-6 border-4 border-blue-200 border-t-blue-600 rounded-full"
                    />
                    <span className="ml-3 text-sm text-gray-600">
                      Loading valid ID image...
                    </span>
                  </div>
                )}

                {!validIdLoading && validIdError && (
                  <div className="bg-red-50 text-red-700 text-sm py-3 px-4 rounded-lg border border-red-100">
                    {validIdError}
                  </div>
                )}

                {!validIdLoading && !validIdError && validIdImageUrl && (
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <img
                      src={validIdImageUrl}
                      alt="User valid ID"
                      className="w-full h-auto max-h-[420px] object-contain bg-gray-50"
                    />
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-blue-200 p-4 bg-blue-50/60">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <IdCard size={16} className="text-blue-700" />
                      <p className="text-sm font-semibold text-blue-900">
                        Device Emergency Details
                      </p>
                    </div>
                    <p className="text-xs text-blue-700 mt-1">
                      Inspect emergencies, resolution timing, and location
                      history for this device.
                    </p>
                  </div>
                  <button
                    onClick={() => void openDeviceDetails(selectedSender)}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#1E3A8A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1E40AF]"
                  >
                    <Clock size={16} />
                    View device details
                  </button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDeviceDetailsOpen} onOpenChange={setIsDeviceDetailsOpen}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Device Emergency Details</DialogTitle>
            <DialogDescription>
              Emergency metrics, response duration, and location history for the
              selected sender device.
            </DialogDescription>
          </DialogHeader>

          {selectedSender && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                {timeBuckets.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => void onDeviceDetailsFilterChange(filter)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                      deviceDetailsFilter === filter
                        ? "bg-[#1E3A8A] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {devicePerformanceLoading ? (
                <div className="flex items-center justify-center py-12">
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
                    Loading device details...
                  </span>
                </div>
              ) : devicePerformanceError ? (
                <div className="bg-red-50 text-red-700 text-sm py-3 px-4 rounded-lg border border-red-100">
                  {devicePerformanceError}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-gray-200 p-4 bg-blue-50">
                      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide flex items-center gap-1">
                        <AlertCircle size={12} />
                        Emergencies
                      </p>
                      <p className="text-3xl font-bold text-blue-900 mt-1">
                        {devicePerformanceData.emergencyCount}
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-200 p-4 bg-green-50">
                      <p className="text-xs font-semibold text-green-700 uppercase tracking-wide flex items-center gap-1">
                        <BadgeCheck size={12} />
                        Resolved
                      </p>
                      <p className="text-3xl font-bold text-green-900 mt-1">
                        {devicePerformanceData.resolvedCount}
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-200 p-4 bg-amber-50">
                      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide flex items-center gap-1">
                        <AlertCircle size={12} />
                        Active
                      </p>
                      <p className="text-3xl font-bold text-amber-900 mt-1">
                        {devicePerformanceData.activeCount}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="rounded-xl border border-gray-200 p-4 bg-white">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                        <Clock size={12} />
                        Avg. Emergency Length
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {formatMinutes(
                          devicePerformanceData.averageDurationMinutes,
                        )}
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-200 p-4 bg-white">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Longest Emergency
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {formatMinutes(
                          devicePerformanceData.longestDurationMinutes,
                        )}
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-200 p-4 bg-white">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                        <Phone size={12} />
                        Speed Stats
                      </p>
                      <p className="text-lg font-bold text-gray-900 mt-1">
                        Avg {devicePerformanceData.averageSpeed.toFixed(2)} km/h
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Max {devicePerformanceData.maxSpeed.toFixed(2)} km/h
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-200 p-4 bg-white">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                        <Clock size={12} />
                        Ping Stats
                      </p>
                      <p className="text-lg font-bold text-gray-900 mt-1">
                        Avg {devicePerformanceData.averagePingCount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Max {devicePerformanceData.maxPingCount.toFixed(0)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="rounded-xl border border-gray-200 p-4 bg-white">
                      <p className="text-sm font-semibold text-gray-900 mb-3">
                        Emergency Timeline
                      </p>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={devicePerformanceData.trend}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="bucket" />
                            <YAxis allowDecimals={false} />
                            <RechartsTooltip />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="emergencies"
                              stroke={CHART_COLORS.emergencies}
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
                            <Line
                              type="monotone"
                              dataKey="active"
                              stroke={CHART_COLORS.active}
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 p-4 bg-white">
                      <p className="text-sm font-semibold text-gray-900 mb-3">
                        Emergency Breakdown
                      </p>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                {
                                  name: "Resolved",
                                  value: devicePerformanceData.resolvedCount,
                                },
                                {
                                  name: "Unresolved",
                                  value: devicePerformanceData.unresolvedCount,
                                },
                                {
                                  name: "Active",
                                  value: devicePerformanceData.activeCount,
                                },
                              ].filter((entry) => entry.value > 0)}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={95}
                              label
                            >
                              {[
                                {
                                  name: "Resolved",
                                  value: devicePerformanceData.resolvedCount,
                                },
                                {
                                  name: "Unresolved",
                                  value: devicePerformanceData.unresolvedCount,
                                },
                                {
                                  name: "Active",
                                  value: devicePerformanceData.activeCount,
                                },
                              ]
                                .filter((entry) => entry.value > 0)
                                .map((entry) => (
                                  <Cell
                                    key={entry.name}
                                    fill={
                                      entry.name === "Resolved"
                                        ? CHART_COLORS.resolved
                                        : entry.name === "Unresolved"
                                          ? CHART_COLORS.unresolved
                                          : CHART_COLORS.active
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

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="rounded-xl border border-gray-200 p-4 bg-white">
                      <p className="text-sm font-semibold text-gray-900 mb-3">
                        Latest Device Snapshot
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            Latest Emergency At
                          </p>
                          <p className="font-semibold text-gray-900 mt-1">
                            {formatDateTime(
                              devicePerformanceData.latestEmergencyAt,
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            Latest Address
                          </p>
                          <p className="font-semibold text-gray-900 mt-1">
                            {devicePerformanceData.latestAddress}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            Device ID
                          </p>
                          <p className="font-mono font-semibold text-gray-900 mt-1 break-all">
                            {selectedSender.device_id}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            Emergency Count
                          </p>
                          <p className="font-semibold text-gray-900 mt-1">
                            {devicePerformanceData.emergencyCount}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 p-4 bg-white">
                      <p className="text-sm font-semibold text-gray-900 mb-3">
                        Emergency Records
                      </p>
                      <div className="overflow-x-auto max-h-[320px]">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                              <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Emergency ID
                              </th>
                              <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Created
                              </th>
                              <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Updated
                              </th>
                              <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Address
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {devicePerformanceData.emergencies.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={5}
                                  className="px-4 py-8 text-center text-sm text-gray-500"
                                >
                                  No emergency records were found for this
                                  device in the selected range.
                                </td>
                              </tr>
                            ) : (
                              devicePerformanceData.emergencies
                                .slice(0, 12)
                                .map((emergency) => (
                                  <tr key={emergency.emergency_id}>
                                    <td className="px-4 py-3 text-xs font-mono text-gray-700">
                                      {emergency.emergency_id}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-600">
                                      {formatDateTime(emergency.created_at)}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-600">
                                      {formatDateTime(emergency.updated_at)}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-700">
                                      {emergency.is_resolved
                                        ? "Resolved"
                                        : emergency.is_active
                                          ? "Active"
                                          : "Pending"}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-600">
                                      {combineAddress(emergency)}
                                    </td>
                                  </tr>
                                ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-4 bg-white">
                    <p className="text-sm font-semibold text-gray-900 mb-3">
                      Location History
                    </p>
                    <div className="overflow-x-auto max-h-[280px]">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Timestamp
                            </th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Emergency ID
                            </th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Ping
                            </th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Speed
                            </th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Address
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {devicePerformanceData.history.length === 0 ? (
                            <tr>
                              <td
                                colSpan={5}
                                className="px-4 py-8 text-center text-sm text-gray-500"
                              >
                                No location history was found for this device in
                                the selected range.
                              </td>
                            </tr>
                          ) : (
                            devicePerformanceData.history
                              .slice(0, 12)
                              .map((entry) => (
                                <tr
                                  key={
                                    entry.id ??
                                    `${entry.emergency_id}-${entry.created_at}`
                                  }
                                >
                                  <td className="px-4 py-3 text-xs text-gray-600">
                                    {formatDateTime(entry.created_at)}
                                  </td>
                                  <td className="px-4 py-3 text-xs font-mono text-gray-700">
                                    {entry.emergency_id}
                                  </td>
                                  <td className="px-4 py-3 text-xs text-gray-600">
                                    {entry.ping_count ?? 0}
                                  </td>
                                  <td className="px-4 py-3 text-xs text-gray-600">
                                    {typeof entry.speed_kmph === "number"
                                      ? `${entry.speed_kmph.toFixed(2)} km/h`
                                      : "N/A"}
                                  </td>
                                  <td className="px-4 py-3 text-xs text-gray-600">
                                    {combineAddress(entry)}
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
