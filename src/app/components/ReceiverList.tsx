import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  BadgeCheck, 
  Clock, 
  MapPin, 
  Mail, 
  Phone 
} from 'lucide-react';

const mockReceivers = [
  { id: '1', name: 'Officer Ricardo Dalisay', role: 'Police', email: 'ricardo@police.gov', status: 'Active', area: 'District 1', lastActive: '2 mins ago' },
  { id: '2', name: 'Dr. Maria Clara', role: 'Medical', email: 'mclara@health.gov', status: 'Active', area: 'Central Hospital', lastActive: '5 mins ago' },
  { id: '3', name: 'Sgt. Juan Dela Cruz', role: 'Fire', email: 'jdelacruz@bfp.gov', status: 'Offline', area: 'Station 4', lastActive: '1 hour ago' },
  { id: '4', name: 'Tanod Jose Rizal', role: 'Barangay', email: 'jrizal@brgy.gov', status: 'Active', area: 'Brgy. Bagumbayan', lastActive: '10 mins ago' },
  { id: '5', name: 'Officer Cardo Dalisay', role: 'Police', email: 'cardo@police.gov', status: 'Active', area: 'District 2', lastActive: 'Just now' },
];

export function ReceiverList() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Registered Receivers</h2>
          <p className="text-gray-500 text-sm">Manage and monitor all emergency responders in the system.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search responders..."
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

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Responder</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role & Dept</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Assigned Area</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Activity</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockReceivers.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase())).map((receiver) => (
                <tr key={receiver.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {receiver.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900 flex items-center gap-1">
                          {receiver.name}
                          <BadgeCheck size={14} className="text-blue-500" />
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Mail size={12} />
                          {receiver.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      receiver.role === 'Police' ? 'bg-blue-100 text-blue-700' :
                      receiver.role === 'Medical' ? 'bg-red-100 text-red-700' :
                      receiver.role === 'Fire' ? 'bg-orange-100 text-orange-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {receiver.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      <MapPin size={14} className="text-gray-400" />
                      {receiver.area}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${receiver.status === 'Active' ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-sm font-medium text-gray-700">{receiver.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock size={12} />
                      {receiver.lastActive}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1 hover:bg-gray-100 rounded-lg text-gray-400">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">Showing 5 of 56 responders</p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 border border-gray-200 rounded-lg text-sm disabled:opacity-50">Prev</button>
            <button className="px-3 py-1 bg-[#1E3A8A] text-white rounded-lg text-sm">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
