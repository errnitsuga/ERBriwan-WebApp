import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Cpu, 
  Smartphone, 
  UserCircle,
  Clock,
  Battery,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { getAllUsers } from '@/supabase_db/api';
import { motion } from 'motion/react';

interface User {
  id: string;
  name?: string;
  email?: string;
  phone_number?: string;
  created_at?: string;
  [key: string]: any;
}

export function SenderList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllUsers();
      console.log('getAllUsers raw response:', data);

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
      } else if (data && typeof data === 'object') {
        // Fallback: pick the first array-valued property
        const firstArrayProp = Object.values(data).find((v) => Array.isArray(v)) as
          | User[]
          | undefined;
        if (firstArrayProp) {
          usersArray = firstArrayProp;
        }
      }

      if (!usersArray.length) {
        console.warn('Unexpected getAllUsers API response format, no users array found:', data);
      }

      // Map backend fields to the UI-friendly User shape
      const mappedUsers: User[] = usersArray.map((u) => {
        const fullName = `${u.firstname ?? ""} ${u.lastname ?? ""}`.trim();
        return {
          // always keep original id
          id: u.id,
          // derived / mapped fields used in the UI
          name: fullName || undefined,
          email: u.email ?? undefined,
          phone_number: u.contact ?? u.phone_number ?? undefined,
          created_at: u.registered_at ?? u.created_at ?? undefined,
          // keep all original fields as passthrough
          ...u,
        };
      });

      console.log("Mapped users for UI:", mappedUsers);
      setUsers(mappedUsers);
    } catch (err) {
      setError('Failed to fetch users. Please try again.');
      console.error('Error fetching users:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Registered Users (Senders)</h2>
          <p className="text-gray-500 text-sm">Monitor all registered system users and their emergency contact information.</p>
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
          <button 
            onClick={fetchUsers}
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

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full"
          />
          <span className="ml-4 text-gray-600 font-medium">Loading users...</span>
        </div>
      ) : users.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">No users found.</p>
            <p className="text-xs text-gray-400 mt-1">Users will appear here once registered.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(searchTerm.trim() ? users.filter((user: User) => {
              const term = searchTerm.toLowerCase();
              const nameMatch = (user.name || "").toLowerCase().includes(term);
              const emailMatch = (user.email || "").toLowerCase().includes(term);
              return nameMatch || emailMatch;
            }) : users
          ).map((user: User) => (
            <div key={user.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg">
                  {user.name?.charAt(0) || 'U'}
                </div>
                <div className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700">
                  Active
                </div>
              </div>
              
              <h3 className="font-bold text-gray-900 text-lg mb-1">{user.name || 'Unknown User'}</h3>
              <p className="text-sm text-gray-500 flex items-center gap-1.5 mb-4">
                <Smartphone size={14} />
                {user.phone_number || 'No phone'}
              </p>

              <div className="pt-4 border-t border-gray-50">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-2">Email</p>
                <p className="text-sm text-gray-700 break-all">{user.email || 'No email'}</p>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Clock size={12} />
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                </div>
                <button className="text-xs font-bold text-[#1E3A8A] hover:underline">View Details</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
