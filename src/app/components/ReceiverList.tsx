import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  BadgeCheck, 
  Clock, 
  MapPin, 
  Mail, 
  Phone,
  AlertCircle 
} from 'lucide-react';
import { getAllResponders } from '@/supabase_db/api';
import { motion } from 'motion/react';

interface Responder {
  id: string;
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

export function ReceiverList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [receivers, setReceivers] = useState<Responder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchResponders();
  }, []);

  const fetchResponders = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllResponders();
      console.log('API Response:', data);
      
      // Handle different response formats
      let responderArray: Responder[] = [];
      if (Array.isArray(data)) {
        responderArray = data;
      } else if (data?.data && Array.isArray(data.data)) {
        responderArray = data.data;
      } else if (data?.responders && Array.isArray(data.responders)) {
        responderArray = data.responders;
      } else {
        console.warn('Unexpected API response format:', data);
        responderArray = [];
      }
      
      setReceivers(responderArray);
    } catch (err: any) {
      console.error('Error fetching responders:', err);
      setError(err?.message || 'Failed to fetch responders. Please check your connection and try again.');
      setReceivers([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Registered Responders</h2>
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
          <button 
            onClick={fetchResponders}
            className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50"
          >
            <Filter size={20} />
          </button>
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
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full"
              />
              <span className="ml-4 text-gray-600 font-medium">Loading responders...</span>
            </div>
          ) : receivers.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">No responders found.</p>
                <p className="text-xs text-gray-400 mt-1">Start by registering a new responder.</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Responder</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Organization</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {receivers
                  .filter((r: Responder) => {
                    const fullName = `${r.firstname || ''} ${r.lastname || ''}`.toLowerCase();
                    const email = (r.email || '').toLowerCase();
                    const searchLower = searchTerm.toLowerCase();
                    return fullName.includes(searchLower) || email.includes(searchLower);
                  })
                  .map((receiver: Responder) => (
                    <tr key={receiver.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                            {(receiver.firstname?.[0] || 'R')}{(receiver.lastname?.[0] || 'U')}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900 flex items-center gap-1">
                              {receiver.firstname || 'Unknown'} {receiver.lastname || 'User'}
                              <BadgeCheck size={14} className="text-blue-500" />
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <Mail size={12} />
                              {receiver.email || 'No email'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          receiver.organization === 'Police' ? 'bg-blue-100 text-blue-700' :
                          receiver.organization === 'Health' ? 'bg-red-100 text-red-700' :
                          receiver.organization === 'BFP' ? 'bg-orange-100 text-orange-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {receiver.organization || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin size={14} className="text-gray-400" />
                          {receiver.barangay || 'N/A'}, {receiver.city_municipality || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-600 flex items-center gap-1">
                          <Phone size={12} />
                          {receiver.phone_number || 'No phone'}
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
          )}
        </div>
        {receivers.length > 0 && !loading && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">Showing {Math.min(receivers.length, 10)} of {receivers.length} responders</p>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 border border-gray-200 rounded-lg text-sm disabled:opacity-50">Prev</button>
              <button className="px-3 py-1 bg-[#1E3A8A] text-white rounded-lg text-sm">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
