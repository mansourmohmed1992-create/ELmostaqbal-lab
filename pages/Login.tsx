
import React, { useState } from 'react';
import { LogIn, Lock, User, FlaskConical, Eye, EyeOff } from 'lucide-react';
import Logo from '../components/Logo';
import { UserRole } from '../types';
import { loginUser } from '../services/firebaseService';

interface LoginProps {
  onLogin: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const cleanUser = username.trim();
    
    // Keep hardcoded admin for backwards compatibility
    if (cleanUser === 'admin' && password === 'F@res222') {
      onLogin({ id: 'admin-main', name: 'د. فارس (مدير المختبر)', username: 'admin', role: UserRole.ADMIN });
      setLoading(false);
      return;
    }

    // Try Firebase authentication - convert username to email format
    const userEmail = `${cleanUser}@elmostaqbal-lab.com`;
    const result = await loginUser(userEmail, password);
    
    if (result.success && result.user) {
      // Fetch user additional data from Firebase
      onLogin({ 
        id: result.user?.uid || 'u_' + cleanUser, 
        name: result.user?.displayName || cleanUser, 
        username: cleanUser, 
        email: userEmail,
        role: UserRole.CLIENT // Default role, should be fetched from Firebase
      });
      setLoading(false);
      return;
    }

    // Fallback: try localStorage for existing accounts
    const managedAccounts = JSON.parse(localStorage.getItem('lab_managed_accounts') || '{}');
    const userAccount = managedAccounts[cleanUser];

    if (userAccount && userAccount.password === password) {
      onLogin({ 
        id: userAccount.id || 'u_' + cleanUser, 
        name: userAccount.name, 
        username: cleanUser, 
        role: userAccount.role 
      });
      setLoading(false);
      return;
    }

    setError('خطأ في بيانات الدخول. يرجى مراجعة الإدارة.');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-['Cairo'] relative overflow-hidden">
      {/* Bio-Medical Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-5">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
          </pattern>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>

      <div className="max-w-xl w-full relative z-10">
        <div className="bg-white rounded-[4rem] shadow-2xl shadow-blue-200/50 overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 p-12 md:p-16 text-white text-center relative">
            <div className="absolute top-4 right-8 opacity-10"><FlaskConical size={140} /></div>
            
            <div className="flex flex-col items-center justify-center relative z-10">
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-[3rem] border border-white/20 inline-block mb-6">
                <Logo className="w-auto h-auto" color="#ffffff" showText={true} />
              </div>
              <p className="text-blue-100 font-bold opacity-80 text-xs uppercase tracking-[0.4em]">للتحاليل الطبية الكيميائية</p>
            </div>
          </div>

          <div className="p-12 md:p-16">
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <div className="bg-red-50 text-red-600 p-5 rounded-3xl text-xs font-black border border-red-100 text-center animate-shake">
                  {error}
                </div>
              )}
              
              <div className="space-y-3">
                <label className="block text-xs font-black text-gray-400 mr-2 uppercase tracking-widest">اسم المستخدم / الكيميائي</label>
                <div className="relative group">
                  <User className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors" size={22} />
                  <input
                    type="text"
                    required
                    className="w-full pr-16 pl-8 py-5 bg-gray-50 border border-gray-100 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500 transition-all font-bold text-gray-800"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-black text-gray-400 mr-2 uppercase tracking-widest">كلمة المرور الآمنة</label>
                <div className="relative group">
                  <Lock className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors" size={22} />
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="w-full pr-16 pl-8 py-5 bg-gray-50 border border-gray-100 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500 transition-all font-bold text-gray-800"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-6 rounded-[2.2rem] font-black text-xl transition-all shadow-2xl shadow-blue-200 flex items-center justify-center gap-4 transform active:scale-95 group"
              >
                <span>{loading ? 'جاري الدخول...' : 'دخول'}</span>
                <LogIn size={26} className="group-hover:translate-x-[-6px] transition-transform" />
              </button>
            </form>

            <div className="mt-12 text-center pt-10 border-t border-gray-50">
              <p className="text-gray-300 text-[10px] font-black uppercase tracking-[0.5em]">
                Advanced Chemical Pathology System
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
