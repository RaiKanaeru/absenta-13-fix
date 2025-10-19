import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Lock, User } from "lucide-react";

interface LoginFormProps {
  onLogin: (credentials: { username: string; password: string }) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const LoginForm = ({ onLogin, isLoading, error }: LoginFormProps) => {
  const [credentials, setCredentials] = useState({
    username: "",
    password: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentials.username.trim() || !credentials.password.trim()) {
      return;
    }
    await onLogin(credentials);
  };

  const handleInputChange = (field: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header Bar */}
      <div className="bg-gray-800 text-white py-3 px-6">
        <div className="flex items-center">
          <span className="text-lg font-semibold">ABSENTA Logo</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-start justify-start p-8">
        <div className="w-full max-w-md">
          {/* Branding */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">ABSENTA</h1>
            <p className="text-gray-600 text-sm">Sistem Absensi Guru Modern</p>
          </div>

          {/* Section Title */}
          <h2 className="text-xl font-bold text-gray-800 mb-6">Masuk ke Sistem</h2>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="bg-red-50 border-red-200">
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Username Field */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700 font-medium">
                Username
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Masukkan username Anda"
                  value={credentials.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Masukkan password Anda"
                  value={credentials.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 bg-gray-600 hover:bg-gray-700 text-white font-medium transition-all duration-200"
              disabled={isLoading || !credentials.username.trim() || !credentials.password.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sedang Masuk...
                </>
              ) : (
                "Masuk"
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-sm text-gray-500">
            <p>&copy; 2025 ABSENTA. Sistem Absensi Guru Modern.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
