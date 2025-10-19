/**
 * Change Password Form Component untuk Absenta System
 * Form untuk mengubah password dengan validasi policy
 */

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, XCircle, Eye, EyeOff, Lock } from 'lucide-react';
import { apiCall } from '../utils/api';
import { toast } from '../hooks/use-toast';
import PasswordPolicy from './PasswordPolicy';

interface ChangePasswordFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({
  onSuccess,
  onCancel,
  className = ''
}) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Password lama harus diisi';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'Password baru harus diisi';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Konfirmasi password harus diisi';
    }

    if (formData.newPassword && formData.confirmPassword && 
        formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Konfirmasi password tidak cocok';
    }

    if (formData.currentPassword && formData.newPassword && 
        formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'Password baru harus berbeda dengan password lama';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiCall.post('/api/password/change', formData);

      if (response.success) {
        toast({
          title: 'Berhasil',
          description: 'Password berhasil diubah',
          variant: 'default'
        });

        // Reset form
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });

        onSuccess?.();
      } else {
        toast({
          title: 'Gagal',
          description: response.message || 'Gagal mengubah password',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      
      const errorMessage = error.response?.data?.message || 'Terjadi kesalahan saat mengubah password';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = (password: string, isValid: boolean) => {
    setFormData(prev => ({ ...prev, newPassword: password }));
    
    if (!isValid && password.length > 0) {
      setErrors(prev => ({ ...prev, newPassword: 'Password tidak memenuhi kriteria keamanan' }));
    } else {
      setErrors(prev => ({ ...prev, newPassword: '' }));
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Lock className="h-5 w-5" />
          <span>Ubah Password</span>
        </CardTitle>
        <CardDescription>
          Ubah password Anda dengan password yang lebih aman
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Password Lama</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPasswords.current ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                placeholder="Masukkan password lama"
                className="pr-10"
                disabled={isSubmitting}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('current')}
                disabled={isSubmitting}
              >
                {showPasswords.current ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.currentPassword && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{errors.currentPassword}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* New Password with Policy */}
          <div className="space-y-4">
            <Label htmlFor="newPassword">Password Baru</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPasswords.new ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                placeholder="Masukkan password baru"
                className="pr-10"
                disabled={isSubmitting}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('new')}
                disabled={isSubmitting}
              >
                {showPasswords.new ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.newPassword && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{errors.newPassword}</AlertDescription>
              </Alert>
            )}

            {/* Password Policy Component */}
            <PasswordPolicy
              onPasswordChange={handlePasswordChange}
              showStrengthIndicator={true}
              showRequirements={true}
            />
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showPasswords.confirm ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Konfirmasi password baru"
                className="pr-10"
                disabled={isSubmitting}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('confirm')}
                disabled={isSubmitting}
              >
                {showPasswords.confirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.confirmPassword && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{errors.confirmPassword}</AlertDescription>
              </Alert>
            )}
            {formData.newPassword && formData.confirmPassword && 
             formData.newPassword === formData.confirmPassword && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Password cocok
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Batal
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Menyimpan...</span>
                </div>
              ) : (
                'Ubah Password'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ChangePasswordForm;
