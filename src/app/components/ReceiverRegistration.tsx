import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  Shield, 
  Phone, 
  MapPin, 
  Building2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { registerResponder, RegisterResponderData } from '@/supabase_db/api';

export function ReceiverRegistration() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstname: '',
    lastname: '',
    middlename: '',
    phone_number: '',
    organization: '',
    region: '',
    city_municipality: '',
    barangay: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const responderData: RegisterResponderData = {
        email: formData.email,
        password: formData.password,
        firstname: formData.firstname,
        lastname: formData.lastname,
        middlename: formData.middlename,
        organization: formData.organization,
        phone_number: formData.phone_number,
        region: formData.region,
        city_municipality: formData.city_municipality,
        barangay: formData.barangay,
      };

      await registerResponder(responderData);
      setIsSuccess(true);
      
      // Reset form after success
      setFormData({
        email: '',
        password: '',
        firstname: '',
        lastname: '',
        middlename: '',
        phone_number: '',
        organization: '',
        region: '',
        city_municipality: '',
        barangay: '',
      });

      // Hide success message after 3 seconds
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register responder. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="md:flex">
          {/* Left Column - Info */}
          <div className="md:w-1/3 bg-[#1E3A8A] p-10 text-white relative overflow-hidden">
            <div className="relative z-10">
              <Shield className="w-12 h-12 mb-6 text-red-500" />
              <h2 className="text-2xl font-bold mb-4">Account Activation</h2>
              <p className="text-blue-100 text-sm leading-relaxed opacity-90">
                Register a new official responder account to the ERBriwan system. 
                Activated accounts will have access to the responder portal and receive real-time alerts.
              </p>

              <div className="mt-12 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center text-xs font-bold">1</div>
                  <span className="text-sm font-medium">Identity Verification</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center text-xs font-bold">2</div>
                  <span className="text-sm font-medium">Area Assignment</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center text-xs font-bold">3</div>
                  <span className="text-sm font-medium">Secure Access Setup</span>
                </div>
              </div>
            </div>
            
            {/* Background design elements */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-red-600 rounded-full blur-3xl opacity-20"></div>
            <div className="absolute top-20 -left-10 w-32 h-32 bg-blue-400 rounded-full blur-3xl opacity-10"></div>
          </div>

          {/* Right Column - Form */}
          <div className="md:w-2/3 p-10">
            {isSuccess ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col items-center justify-center text-center py-12"
              >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Activation Successful!</h3>
                <p className="text-gray-500 max-w-sm">
                  The responder account for {formData.firstname} {formData.lastname} has been created and activated.
                </p>
                <button 
                  onClick={() => setIsSuccess(false)}
                  className="mt-8 px-6 py-2 bg-[#1E3A8A] text-white rounded-xl font-semibold hover:bg-blue-800 transition-colors"
                >
                  Register Another
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 ml-1">First Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        required
                        name="firstname"
                        value={formData.firstname}
                        onChange={handleChange}
                        type="text" 
                        placeholder="John"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Last Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        required
                        name="lastname"
                        value={formData.lastname}
                        onChange={handleChange}
                        type="text" 
                        placeholder="Doe"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 ml-1">Middle Name (Optional)</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      name="middlename"
                      value={formData.middlename}
                      onChange={handleChange}
                      type="text" 
                      placeholder="Middle name"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        required
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        type="email" 
                        placeholder="john@erbriwan.com"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        required
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        type="password" 
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        required
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleChange}
                        type="tel" 
                        placeholder="+63 912 345 6789"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Organization</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <select 
                        name="organization"
                        value={formData.organization}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                      >
                        <option value="">Select Organization</option>
                        <option value="Police">Police Department</option>
                        <option value="Health">Municipal Health Office</option>
                        <option value="BFP">Bureau of Fire Protection</option>
                        <option value="Barangay">Barangay Response Team</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Region</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        required
                        name="region"
                        value={formData.region}
                        onChange={handleChange}
                        type="text" 
                        placeholder="NCR"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 ml-1">City/Municipality</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        required
                        name="city_municipality"
                        value={formData.city_municipality}
                        onChange={handleChange}
                        type="text" 
                        placeholder="Manila"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Barangay</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        required
                        name="barangay"
                        value={formData.barangay}
                        onChange={handleChange}
                        type="text" 
                        placeholder="Bagumbayan"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-4 bg-red-50 rounded-xl border border-red-100 text-red-800">
                    <AlertCircle size={20} className="shrink-0" />
                    <p className="text-xs">{error}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 p-4 bg-amber-50 rounded-xl border border-amber-100 text-amber-800">
                  <AlertCircle size={20} className="shrink-0" />
                  <p className="text-xs">
                    Please ensure all information is accurate. False registrations may compromise emergency response coordination.
                  </p>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-red-600 text-white rounded-xl font-bold text-lg hover:bg-red-700 shadow-lg shadow-red-200 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                      Activating Account...
                    </>
                  ) : 'Activate Responder Account'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
