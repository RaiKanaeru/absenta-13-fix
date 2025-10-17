/**
 * Two-Factor Authentication Verification Component untuk Absenta System
 * Component untuk verifikasi 2FA token saat login
 */

import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { 
  Shield, 
  Smartphone, 
  Key, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock
} from 'lucide-react';
import { apiCall } from '../utils/api';
import { toast } from '../hooks/use-toast';

interface TwoFactorVerificationProps {
  userId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

const TwoFactorVerification: React.FC<TwoFactorVerificationProps> = ({
  userId,
  onSuccess,
  onCancel,
  className = ''
}) => {
  const [token, setToken] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isResending, setIsResending] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on input
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Timer for token refresh
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  // Reset timer every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(30);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleTokenChange = (value: string) => {
    // Only allow digits and limit to 6 characters
    const cleanValue = value.replace(/\D/g, '').slice(0, 6);
    setToken(cleanValue);
    
    // Auto-submit when 6 digits are entered
    if (cleanValue.length === 6) {
      handleVerify();
    }
  };

  const handleVerify = async () => {
    if (token.length !== 6) {
      toast({
        title: 'Invalid Token',
        description: 'Please enter a 6-digit code',
        variant: 'destructive'
      });
      return;
    }

    if (isLocked) {
      toast({
        title: 'Account Locked',
        description: 'Too many failed attempts. Please try again later.',
        variant: 'destructive'
      });
      return;
    }

    setIsVerifying(true);
    try {
      const response = await apiCall.post('/api/2fa/verify-login', {
        userId,
        token
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: '2FA verification successful',
          variant: 'default'
        });
        onSuccess?.();
      } else {
        setAttempts(prev => prev + 1);
        if (attempts >= 4) {
          setIsLocked(true);
          toast({
            title: 'Account Locked',
            description: 'Too many failed attempts. Account locked for 15 minutes.',
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Invalid Token',
            description: 'Please check your authenticator app and try again',
            variant: 'destructive'
          });
        }
        setToken('');
      }
    } catch (error: any) {
      console.error('Error verifying 2FA:', error);
      setAttempts(prev => prev + 1);
      
      if (attempts >= 4) {
        setIsLocked(true);
        toast({
          title: 'Account Locked',
          description: 'Too many failed attempts. Account locked for 15 minutes.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Verification Failed',
          description: error.response?.data?.message || 'Invalid token',
          variant: 'destructive'
        });
      }
      setToken('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      // In a real implementation, this would resend the 2FA challenge
      // For now, we'll just show a message
      toast({
        title: 'Token Refreshed',
        description: 'New token generated. Check your authenticator app.',
        variant: 'default'
      });
      setTimeLeft(30);
    } catch (error) {
      console.error('Error resending token:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh token',
        variant: 'destructive'
      });
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Two-Factor Authentication</span>
        </CardTitle>
        <CardDescription>
          Enter the 6-digit code from your authenticator app
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Instructions */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Smartphone className="h-5 w-5 text-blue-600" />
            <div>
              <h4 className="font-medium">Open your authenticator app</h4>
              <p className="text-sm text-gray-600">
                Google Authenticator, Authy, or similar app
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Key className="h-5 w-5 text-green-600" />
            <div>
              <h4 className="font-medium">Enter the 6-digit code</h4>
              <p className="text-sm text-gray-600">
                Code refreshes every 30 seconds
              </p>
            </div>
          </div>
        </div>

        {/* Token Input */}
        <div className="space-y-2">
          <Label htmlFor="token">Verification Code</Label>
          <div className="flex space-x-2">
            <Input
              ref={inputRef}
              id="token"
              value={token}
              onChange={(e) => handleTokenChange(e.target.value)}
              placeholder="000000"
              maxLength={6}
              className="text-center text-2xl font-mono tracking-widest"
              disabled={isVerifying || isLocked}
            />
            <Button
              onClick={handleVerify}
              disabled={token.length !== 6 || isVerifying || isLocked}
              className="min-w-[100px]"
            >
              {isVerifying ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Verifying...</span>
                </div>
              ) : (
                'Verify'
              )}
            </Button>
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center justify-center space-x-2">
          <Clock className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            Code refreshes in {formatTime(timeLeft)}
          </span>
        </div>

        {/* Status Indicators */}
        {attempts > 0 && !isLocked && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {attempts} failed attempt{attempts > 1 ? 's' : ''}. 
              {5 - attempts} attempt{5 - attempts > 1 ? 's' : ''} remaining.
            </AlertDescription>
          </Alert>
        )}

        {isLocked && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Account locked due to too many failed attempts. 
              Please try again in 15 minutes.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResend}
              disabled={isResending || isLocked}
            >
              {isResending ? 'Refreshing...' : 'Refresh Token'}
            </Button>
          </div>
          
          <div className="flex space-x-2">
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Having trouble? Check that your device time is synchronized.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TwoFactorVerification;
