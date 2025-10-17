/**
 * Password Policy Component untuk Absenta System
 * Component untuk menampilkan dan memvalidasi password policy
 */

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { apiCall } from '../utils/api';

interface PasswordPolicyProps {
  onPasswordChange?: (password: string, isValid: boolean) => void;
  showStrengthIndicator?: boolean;
  showRequirements?: boolean;
  className?: string;
}

interface PasswordStrength {
  isValid: boolean;
  strengthScore: number;
  strengthLevel: string;
  errors: string[];
  warnings: string[];
  requirements: {
    minLength: number;
    maxLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    minSpecialChars: number;
  };
}

interface PasswordPolicyInfo {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  minSpecialChars: number;
  maxRepeatingChars: number;
  maxSequentialChars: number;
  maxAge: number;
  maxResetsPerDay: number;
  minTimeBetweenResets: number;
}

const PasswordPolicy: React.FC<PasswordPolicyProps> = ({
  onPasswordChange,
  showStrengthIndicator = true,
  showRequirements = true,
  className = ''
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState<PasswordStrength | null>(null);
  const [policyInfo, setPolicyInfo] = useState<PasswordPolicyInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Load password policy information
  useEffect(() => {
    const loadPolicyInfo = async () => {
      try {
        const response = await apiCall.get('/api/password/policy');
        if (response.success) {
          setPolicyInfo(response.data);
        }
      } catch (error) {
        console.error('Error loading password policy:', error);
      }
    };

    loadPolicyInfo();
  }, []);

  // Check password strength when password changes
  useEffect(() => {
    if (password.length > 0) {
      checkPasswordStrength();
    } else {
      setStrength(null);
      onPasswordChange?.(password, false);
    }
  }, [password]);

  const checkPasswordStrength = async () => {
    if (password.length === 0) return;

    setIsChecking(true);
    try {
      const response = await apiCall.post('/api/password/check-strength', {
        password
      });

      if (response.success) {
        setStrength(response.data);
        onPasswordChange?.(password, response.data.isValid);
      }
    } catch (error) {
      console.error('Error checking password strength:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const getStrengthColor = (level: string) => {
    switch (level) {
      case 'very-weak': return 'bg-red-500';
      case 'weak': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'strong': return 'bg-blue-500';
      case 'very-strong': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  const getStrengthLabel = (level: string) => {
    switch (level) {
      case 'very-weak': return 'Sangat Lemah';
      case 'weak': return 'Lemah';
      case 'medium': return 'Sedang';
      case 'strong': return 'Kuat';
      case 'very-strong': return 'Sangat Kuat';
      default: return 'Tidak Diketahui';
    }
  };

  const getStrengthIcon = (level: string) => {
    switch (level) {
      case 'very-weak':
      case 'weak':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'strong':
      case 'very-strong':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Password Input */}
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Masukkan password"
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Password Strength Indicator */}
      {showStrengthIndicator && strength && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Kekuatan Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Strength Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {getStrengthLabel(strength.strengthLevel)}
                </span>
                <div className="flex items-center space-x-2">
                  {getStrengthIcon(strength.strengthLevel)}
                  <Badge variant="outline">
                    {strength.strengthScore}/100
                  </Badge>
                </div>
              </div>
              <Progress 
                value={strength.strengthScore} 
                className="h-2"
              />
            </div>

            {/* Errors */}
            {strength.errors.length > 0 && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {strength.errors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Warnings */}
            {strength.warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {strength.warnings.map((warning, index) => (
                      <li key={index} className="text-sm">{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Success Message */}
            {strength.isValid && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Password memenuhi semua kriteria keamanan
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Password Requirements */}
      {showRequirements && policyInfo && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Persyaratan Password</CardTitle>
            <CardDescription>
              Password harus memenuhi kriteria berikut untuk keamanan yang optimal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Length Requirements */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Panjang Password</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Minimal {policyInfo.minLength} karakter</li>
                  <li>• Maksimal {policyInfo.maxLength} karakter</li>
                </ul>
              </div>

              {/* Character Requirements */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Jenis Karakter</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  {policyInfo.requireUppercase && (
                    <li>• Minimal 1 huruf besar (A-Z)</li>
                  )}
                  {policyInfo.requireLowercase && (
                    <li>• Minimal 1 huruf kecil (a-z)</li>
                  )}
                  {policyInfo.requireNumbers && (
                    <li>• Minimal 1 angka (0-9)</li>
                  )}
                  {policyInfo.requireSpecialChars && (
                    <li>• Minimal {policyInfo.minSpecialChars} karakter khusus</li>
                  )}
                </ul>
              </div>

              {/* Security Requirements */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Keamanan</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Tidak boleh berulang lebih dari {policyInfo.maxRepeatingChars} kali</li>
                  <li>• Tidak boleh berurutan lebih dari {policyInfo.maxSequentialChars} karakter</li>
                  <li>• Tidak boleh menggunakan kata-kata umum</li>
                </ul>
              </div>

              {/* Policy Information */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Kebijakan</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Password berlaku {policyInfo.maxAge} hari</li>
                  <li>• Maksimal {policyInfo.maxResetsPerDay} reset per hari</li>
                  <li>• Minimal {policyInfo.minTimeBetweenResets} menit antar reset</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isChecking && (
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
          <span>Memeriksa kekuatan password...</span>
        </div>
      )}
    </div>
  );
};

export default PasswordPolicy;
