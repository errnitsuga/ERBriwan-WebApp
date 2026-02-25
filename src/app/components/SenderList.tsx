import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Cpu, 
  Smartphone, 
  UserCircle,
  Clock,
  Battery,
  ShieldCheck
} from 'lucide-react';

const mockSenders = [
  { id: '1', name: 'Antonio Luna', phone: '+63 912 345 6789', deviceStatus: 'Connected', battery: '85%', registered: 'Jan 12, 2026', totalAlerts: 2 },
  { id: '2', name: 'Melchora Aquino', phone: '+63 922 888 7777', deviceStatus: 'Disconnected', battery: '12%', registered: 'Feb 05, 2026', totalAlerts: 0 },
  { id: '3', name: 'Andres Bonifacio', phone: '+63 915 555 1234', deviceStatus: 'Connected', battery: '92%', registered: 'Feb 15, 2026', totalAlerts: 1 },
  { id: '4', name: 'Gregoria de Jesus', phone: '+63 918 444 9999', deviceStatus: 'Connected', battery: '45%', registered: 'Dec 20, 2025', totalAlerts: 5 },
  { id: '5', name: 'Apolinario Mabini', phone: '+63 909 333 2222', deviceStatus: 'Low Battery', battery: '5%', registered: 'Jan 28, 2026', totalAlerts: 0 },
];

export function SenderList() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Registered Senders</h2>
          <p className="text-gray-500 text-sm">Monitor system users and their IoT emergency button status.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search users..."
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
            <Filter size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockSenders.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map((sender) => (
          <div key={sender.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400">
                <UserCircle size={32} />
              </div>
              <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                sender.deviceStatus === 'Connected' ? 'bg-green-100 text-green-700' :
                sender.deviceStatus === 'Low Battery' ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>
                {sender.deviceStatus}
              </div>
            </div>
            
            <h3 className="font-bold text-gray-900 text-lg mb-1">{sender.name}</h3>
            <p className="text-sm text-gray-500 flex items-center gap-1.5 mb-4">
              <Smartphone size={14} />
              {sender.phone}
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Battery</p>
                <div className="flex items-center gap-1.5">
                  <Battery size={14} className={parseInt(sender.battery) < 20 ? 'text-red-500' : 'text-green-500'} />
                  <span className="text-sm font-semibold">{sender.battery}</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Alerts</p>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-blue-500" />
                  <span className="text-sm font-semibold">{sender.totalAlerts} Sent</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Clock size={12} />
                Joined {sender.registered}
              </div>
              <button className="text-xs font-bold text-[#1E3A8A] hover:underline">View Profile</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
