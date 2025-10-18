import { useState, useEffect, useCallback } from "react";
import { LoginForm } from "@/components/LoginForm_Modern";
import { AdminDashboard } from "@/components/AdminDashboard_Modern";
import { TeacherDashboard } from "@/components/TeacherDashboard_Modern";
import { StudentDashboard } from "@/components/StudentDashboard_Modern";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/utils/api";

type AppState = 'login' | 'dashboard';
type UserRole = 'admin' | 'guru' | 'siswa' | null;

interface UserData {
  id: number;
  username: string;
  nama: string;
  role: UserRole;
  // Admin specific
  // Guru specific
  guru_id?: number;
  nip?: string;
  mapel?: string;
  // Siswa specific
  siswa_id?: number;
  nis?: string;
  kelas?: string;
  kelas_id?: number;
}

const Index = () => {
  console.log('🚀 ABSENTA Modern App Starting...');
  
  const [currentState, setCurrentState] = useState<AppState>('login');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Helper function to normalize user data with lowercase role
  const normalizeUserData = (data: any): UserData | null => {
    if (!data) return null;
    return {
      ...data,
      role: data.role?.toLowerCase() // Ensure role is always lowercase
    };
  };

  const checkExistingAuth = useCallback(async () => {
    try {
      console.log('🔍 Checking existing authentication...');
      
      // Check if token exists in localStorage first
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('ℹ️ No token found, showing login form');
        setCurrentState('login');
        return;
      }
      
      const result = await api.get('/api/verify');
      
      console.log('🔍 Auth check response:', result);
      
      // ✅ FIX: Check result.data instead of result directly
      if (result.success && result.data && result.data.user) {
          console.log('✅ Existing auth found, user:', result.data.user);
          
          // Load latest profile data based on role
          try {
            let profileData;
            switch (result.data.user.role) {
              case 'admin':
                profileData = await api.get('/api/admin/info');
                break;
              case 'guru':
                profileData = await api.get('/api/guru/info');
                break;
              case 'siswa':
                profileData = await api.get('/api/siswa/info');
                break;
              default:
                profileData = null;
            }
            
            if (profileData) {
              console.log('📋 Profile data received:', profileData);
              
              // ✅ FIX: Check profileData.data for wrapped response
              const profileInfo = profileData.data || profileData;
              
              if (profileData.success) {
                console.log('🔍 Profile info data:', profileInfo);
                console.log('🔍 Profile guru_id:', profileInfo.guru_id);
                console.log('🔍 Profile id:', profileInfo.id);
                
                // Merge JWT data with latest profile data
                const updatedUserData = {
                  ...result.data.user,
                  ...profileInfo,
                  // Map field names for compatibility based on role
                  ...(result.data.user.role === 'siswa' && {
                    siswa_id: profileInfo.id_siswa,
                    nis: profileInfo.nis,
                    kelas: profileInfo.nama_kelas,
                    kelas_id: profileInfo.kelas_id
                  }),
                  ...(result.data.user.role === 'guru' && {
                    guru_id: profileInfo.guru_id || profileInfo.id, // Use guru_id if available, fallback to id
                    nip: profileInfo.nip,
                    mapel: profileInfo.mata_pelajaran
                  })
                };
                setUserData(normalizeUserData(updatedUserData));
                console.log('✅ Updated user data with latest profile:', updatedUserData);
              } else {
                console.log('❌ Profile data not successful:', profileData);
                setUserData(normalizeUserData(result.data.user));
              }
            } else {
              console.log('❌ Profile data not successful:', profileData);
              setUserData(normalizeUserData(result.data.user));
            }
          } catch (profileError) {
            console.error('❌ Failed to load latest profile data:', profileError);
            console.log('❌ Profile error details:', {
              message: profileError.message,
              stack: profileError.stack,
              name: profileError.name
            });
            setUserData(normalizeUserData(result.data.user));
          }
          
          setCurrentState('dashboard');
          
          // ✅ FIX: Safe access with optional chaining
          const userName = result.data.user?.nama || result.data.user?.username || 'User';
          
          toast({
            title: "Selamat datang kembali!",
            description: `Halo ${userName}, Anda berhasil login otomatis.`,
          });
      } else {
        console.log('ℹ️ No existing authentication found, result:', result);
      }
    } catch (error) {
      console.log('ℹ️ No existing auth or error checking:', error);
    }
  }, [toast]);

  // Check for existing authentication on mount
  useEffect(() => {
    checkExistingAuth();
  }, [checkExistingAuth]);

  const handleLogin = useCallback(async (credentials: { username: string; password: string }) => {
    console.log('🔐 Starting login process for:', credentials.username);
    setIsLoading(true);
    setError(null);

    try {
      const result = await api.post('/api/login', credentials);

      console.log('📡 Login response:', result);

      if (result.success) {
        // ✅ FIX: Handle both response formats
        const userData = result.data?.user || result.user;
        const token = result.data?.token || result.token;
        
        if (!userData) {
          throw new Error('Invalid response structure: missing user data');
        }
        
        console.log('✅ Login successful for user:', userData.username);
        
        // ✅ FIX: Access user from result and normalize role
        setUserData(normalizeUserData(userData));
        setCurrentState('dashboard');
        setError(null);
        
        // Store token in localStorage for persistence
        if (token) {
          localStorage.setItem('token', token);
        }
        
        // ✅ FIX: Safe access with optional chaining
        const userName = userData?.nama || userData?.username || 'User';
        
        toast({
          title: "Login Berhasil!",
          description: `Selamat datang, ${userName}!`,
        });
      } else {
        // ✅ FIX: Better error handling
        const errorMessage = result.error || result.message || 'Login failed';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat login';
      setError(errorMessage);
      
      toast({
        title: "Login Gagal",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleLogout = useCallback(async () => {
    console.log('🚪 Logging out user...');
    
    try {
      await api.post('/api/logout');
      
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      
      // Reset state
      setUserData(null);
      setCurrentState('login');
      setError(null);
      
      console.log('✅ Logout successful');
      
      toast({
        title: "Logout Berhasil",
        description: "Anda telah keluar dari sistem",
      });
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Force logout even if request fails
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      setUserData(null);
      setCurrentState('login');
    }
  }, [toast]);

  // Loading screen
  if (isLoading && currentState === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Sedang masuk...</h2>
          <p className="text-gray-600">Mohon tunggu sebentar</p>
        </div>
      </div>
    );
  }

  // Render login form
  if (currentState === 'login' || !userData) {
    return (
      <LoginForm 
        onLogin={handleLogin}
        isLoading={isLoading}
        error={error}
      />
    );
  }

  // Render dashboard based on user role
  if (currentState === 'dashboard' && userData) {
    console.log('🎯 Rendering dashboard for role:', userData.role);
    
    switch (userData.role) {
      case 'admin':
        return (
          <AdminDashboard 
            onLogout={handleLogout}
          />
        );
        
      case 'guru':
        if (!userData.guru_id) {
          console.error('❌ Guru user missing guru_id');
          handleLogout();
          return null;
        }
        return (
          <TeacherDashboard 
            userData={userData as UserData & { guru_id: number; nip: string; mapel: string }}
            onLogout={handleLogout}
          />
        );
        
      case 'siswa':
        if (!userData.siswa_id) {
          console.error('❌ Siswa user missing siswa_id');
          handleLogout();
          return null;
        }
        return (
          <StudentDashboard 
            userData={userData as UserData & { siswa_id: number; nis: string; kelas: string; kelas_id: number }}
            onLogout={handleLogout}
          />
        );
        
      default:
        console.error('❌ Unknown user role:', userData.role);
        setError('Role pengguna tidak dikenali');
        handleLogout();
        return null;
    }
  }

  // Fallback
  console.log('⚠️ Unexpected state, redirecting to login');
  setCurrentState('login');
  return null;
};

export default Index;
