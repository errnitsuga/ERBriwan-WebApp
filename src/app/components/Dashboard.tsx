import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  AlertTriangle, 
  Activity, 
  Users, 
  MapPin, 
  TrendingUp,
  Clock
} from 'lucide-react';

const mockData = {
  incidentStats: [
    { name: 'Medical', value: 45, color: '#C61F1F' },
    { name: 'Police', value: 30, color: '#1E3A8A' },
    { name: 'Fire', value: 15, color: '#F97316' },
    { name: 'Accident', value: 10, color: '#6366F1' },
  ],
  areaClicks: [
    { area: 'Downtown', count: 120 },
    { area: 'North Park', count: 85 },
    { area: 'South Side', count: 65 },
    { area: 'East View', count: 45 },
    { area: 'West Port', count: 95 },
  ],
  weeklyTrends: [
    { day: 'Mon', count: 12 },
    { day: 'Tue', count: 19 },
    { day: 'Wed', count: 15 },
    { day: 'Thu', count: 25 },
    { day: 'Fri', count: 32 },
    { day: 'Sat', count: 45 },
    { day: 'Sun', count: 38 },
  ]
};

const StatCard = ({ icon: Icon, label, value, trend, color }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between">
    <div>
      <p className="text-sm text-gray-500 font-medium mb-1">{label}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      <div className="flex items-center gap-1 mt-2">
        <TrendingUp size={14} className="text-green-500" />
        <span className="text-xs text-green-600 font-medium">+{trend}% from last month</span>
      </div>
    </div>
    <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
      <Icon size={24} className={color.replace('bg-', 'text-')} />
    </div>
  </div>
);

export function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={AlertTriangle} 
          label="Total Incidents" 
          value="482" 
          trend="12" 
          color="bg-red-500" 
        />
        <StatCard 
          icon={Activity} 
          label="Avg Response Time" 
          value="4.2m" 
          trend="5" 
          color="bg-blue-500" 
        />
        <StatCard 
          icon={Users} 
          label="Registered Senders" 
          value="1,240" 
          trend="8" 
          color="bg-indigo-500" 
        />
        <StatCard 
          icon={MapPin} 
          label="Active Responders" 
          value="56" 
          trend="15" 
          color="bg-green-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Incident Classification */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800">Incident Classification</h3>
            <button className="text-xs text-blue-600 font-semibold hover:underline">View Detailed Reports</button>
          </div>
          <div className="h-64 flex">
            <ResponsiveContainer width="60%" height="100%">
              <PieChart>
                <Pie
                  data={mockData.incidentStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {mockData.incidentStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-[40%] flex flex-col justify-center space-y-3">
              {mockData.incidentStats.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-600">{item.name}</span>
                  <span className="text-sm font-bold ml-auto">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Area Click Distribution */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800">Clicks by Area</h3>
            <button className="text-xs text-blue-600 font-semibold hover:underline">Full Map View</button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockData.areaClicks}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="area" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#C61F1F" 
                  radius={[4, 4, 0, 0]} 
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Weekly Trends */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock className="text-blue-600" size={20} />
            <h3 className="text-lg font-bold text-gray-800">Weekly Activity Trend</h3>
          </div>
          <select className="bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-1.5 outline-none">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
          </select>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockData.weeklyTrends}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1E3A8A" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#1E3A8A" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#1E3A8A" 
                fillOpacity={1} 
                fill="url(#colorCount)" 
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
