/**
 * Two-Factor Authentication Setup Component untuk Absenta System
 * Component untuk setup dan management 2FA
 */

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Shield, 
  Smartphone, 
  Key, 
  Download, 
  Copy, 
  CheckCircle, 
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';
import { apiCall } from '../utils/api';
import { toast } from '../hooks/use-toast';

interface TwoFactorSetupProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

interface TwoFactorStatus {
  enabled: boolean;
  backupCodesRemaining: number;
  hasBackupCodes: boolean;
}

interface SetupData {
  qrCodeUrl: string;
  qrCodeDataURL: string;
  manualEntryKey: string;
  backupCodes: string[];
}

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({
  onSuccess,
  onCancel,
  className = ''
}) => {
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [verificationToken, setVerificationToken] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);

  // Load 2FA status on mount
  useEffect(() => {
    loadTwoFactorStatus();
  }, []);

  const loadTwoFactorStatus = async () => {
    try {
      const response = await apiCall.get('/api/2fa/status');
      if (response.success) {
        setStatus(response.data);
      }
    } catch (error) {
      console.error('Error loading 2FA status:', error);
    }
  };

  const handleSetup = async () => {
    setIsLoading(true);
    try {
      const response = await apiCall.post('/api/2fa/setup');
      if (response.success) {
        setSetupData(response.data);
        setBackupCodes(response.data.backupCodes);
        setStep('verify');
        toast({
          title: '2FA Setup',
          description: 'Scan QR code or enter manual key to continue',
          variant: 'default'
        });
      }
    } catch (error: any) {
      console.error('Error setting up 2FA:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to setup 2FA',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationToken || verificationToken.length !== 6) {
      toast({
        title: 'Invalid Token',
        description: 'Please enter a 6-digit token',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiCall.post('/api/2fa/verify', {
        token: verificationToken,
        backupCodes: backupCodes
      });

      if (response.success) {
        setStep('complete');
        toast({
          title: 'Success',
          description: '2FA enabled successfully',
          variant: 'default'
        });
        onSuccess?.();
      }
    } catch (error: any) {
      console.error('Error verifying 2FA:', error);
      toast({
        title: 'Verification Failed',
        description: error.response?.data?.message || 'Invalid token',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async () => {
    const password = prompt('Enter your password to disable 2FA:');
    if (!password) return;

    setIsLoading(true);
    try {
      const response = await apiCall.post('/api/2fa/disable', { password });
      if (response.success) {
        setStatus({ enabled: false, backupCodesRemaining: 0, hasBackupCodes: false });
        toast({
          title: 'Success',
          description: '2FA disabled successfully',
          variant: 'default'
        });
      }
    } catch (error: any) {
      console.error('Error disabling 2FA:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to disable 2FA',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Copied to clipboard',
      variant: 'default'
    });
  };

  const downloadBackupCodes = () => {
    if (!backupCodes.length) return;

    const content = `Absenta System - 2FA Backup Codes\n\n${backupCodes.join('\n')}\n\nSave these codes in a secure location. Each code can only be used once.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'absenta-2fa-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (status?.enabled) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-green-600" />
            <span>Two-Factor Authentication</span>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Enabled
            </Badge>
          </CardTitle>
          <CardDescription>
            Your account is protected with two-factor authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Backup Codes</h4>
              <p className="text-sm text-gray-600">
                {status.backupCodesRemaining} codes remaining
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Status</h4>
              <p className="text-sm text-gray-600">
                {status.hasBackupCodes ? 'Backup codes available' : 'No backup codes'}
              </p>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowBackupCodes(!showBackupCodes)}
              disabled={isLoading}
            >
              {showBackupCodes ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showBackupCodes ? 'Hide' : 'Show'} Backup Codes
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable}
              disabled={isLoading}
            >
              Disable 2FA
            </Button>
          </div>

          {showBackupCodes && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Backup Codes:</p>
                  <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                    {backupCodes.map((code, index) => (
                      <div key={index} className="p-2 bg-gray-100 rounded">
                        {code}
                      </div>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={downloadBackupCodes}
                    className="mt-2"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Setup Two-Factor Authentication</span>
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'setup' && (
          <div className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Two-factor authentication adds an extra layer of security to your account. 
                You'll need an authenticator app like Google Authenticator or Authy.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <h4 className="font-medium">How it works:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>Scan QR code with your authenticator app</li>
                <li>Enter the 6-digit code to verify setup</li>
                <li>Save backup codes in a secure location</li>
                <li>Use authenticator app for future logins</li>
              </ul>
            </div>

            <div className="flex space-x-3">
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button onClick={handleSetup} disabled={isLoading}>
                {isLoading ? 'Setting up...' : 'Start Setup'}
              </Button>
            </div>
          </div>
        )}

        {step === 'verify' && setupData && (
          <div className="space-y-6">
            <Tabs defaultValue="qr" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="qr">QR Code</TabsTrigger>
                <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              </TabsList>
              
              <TabsContent value="qr" className="space-y-4">
                <div className="text-center">
                  <h4 className="font-medium mb-4">Scan QR Code</h4>
                  <div className="flex justify-center">
                    <img 
                      src={setupData.qrCodeDataURL} 
                      alt="2FA QR Code" 
                      className="border rounded-lg"
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Use your authenticator app to scan this QR code
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="manual" className="space-y-4">
                <div className="space-y-2">
                  <Label>Manual Entry Key</Label>
                  <div className="flex space-x-2">
                    <Input
                      value={setupData.manualEntryKey}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(setupData.manualEntryKey)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">
                    Enter this key manually in your authenticator app
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-4">
              <Label htmlFor="verificationToken">Enter 6-digit code</Label>
              <Input
                id="verificationToken"
                value={verificationToken}
                onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="text-center text-lg font-mono"
              />
            </div>

            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => setStep('setup')}>
                Back
              </Button>
              <Button 
                onClick={handleVerify} 
                disabled={isLoading || verificationToken.length !== 6}
              >
                {isLoading ? 'Verifying...' : 'Verify & Enable'}
              </Button>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-green-800 mb-2">
                Two-Factor Authentication Enabled
              </h3>
              <p className="text-gray-600">
                Your account is now protected with two-factor authentication
              </p>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Important: Save your backup codes</p>
                  <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                    {backupCodes.map((code, index) => (
                      <div key={index} className="p-2 bg-gray-100 rounded">
                        {code}
                      </div>
                    ))}
                  </div>
                  <div className="flex space-x-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={downloadBackupCodes}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(backupCodes.join('\n'))}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy All
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex justify-end">
              <Button onClick={onSuccess}>
                Complete Setup
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TwoFactorSetup;
