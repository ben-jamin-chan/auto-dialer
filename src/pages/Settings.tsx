import React, { useState, useEffect } from 'react';
import { Save, Key, Phone } from 'lucide-react';
import { useTwilio } from '../contexts/TwilioContext';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const { settings: savedSettings, saveSettings } = useTwilio();
  
  const [twilioAccountSid, setTwilioAccountSid] = useState('');
  const [twilioAuthToken, setTwilioAuthToken] = useState('');
  const [twilioPhoneNumber, setTwilioPhoneNumber] = useState('');
  const [callRetryAttempts, setCallRetryAttempts] = useState(0);
  const [callRetryDelay, setCallRetryDelay] = useState(60);
  const [callDuration, setCallDuration] = useState(30);
  const [isSaving, setIsSaving] = useState(false);
  
  // Mask character for sensitive fields
  const MASK_CHAR = '•';
  const MASK_LENGTH = 24;
  
  useEffect(() => {
    // Initialize form fields with saved settings
    setTwilioPhoneNumber(savedSettings.phoneNumber || '');
    setCallRetryAttempts(savedSettings.retryAttempts || 3);
    setCallRetryDelay(savedSettings.retryDelay || 60);
    setCallDuration(savedSettings.callDuration || 30);
    
    // Mask sensitive credentials
    setTwilioAccountSid(
      savedSettings.accountSid 
        ? MASK_CHAR.repeat(MASK_LENGTH)
        : ''
    );
    setTwilioAuthToken(
      savedSettings.authToken 
        ? MASK_CHAR.repeat(MASK_LENGTH)
        : ''
    );
  }, [savedSettings]);

  const isMasked = (value: string) => value === MASK_CHAR.repeat(MASK_LENGTH);
  
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const updates: Partial<typeof savedSettings> = {
        phoneNumber: twilioPhoneNumber,
        retryAttempts: callRetryAttempts,
        retryDelay: callRetryDelay,
        callDuration: callDuration,
      };

      // Only update credentials if they were changed (not masked values)
      if (!isMasked(twilioAccountSid)) {
        updates.accountSid = twilioAccountSid;
      }
      if (!isMasked(twilioAuthToken)) {
        updates.authToken = twilioAuthToken;
      }

      await saveSettings(updates);
      toast.success('Settings saved successfully');
      
      // Re-mask fields after save
      if (updates.accountSid) {
        setTwilioAccountSid(MASK_CHAR.repeat(MASK_LENGTH));
      }
      if (updates.authToken) {
        setTwilioAuthToken(MASK_CHAR.repeat(MASK_LENGTH));
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCredentialFocus = (
    field: 'accountSid' | 'authToken',
    currentValue: string
  ) => {
    if (isMasked(currentValue)) {
      if (field === 'accountSid') {
        setTwilioAccountSid('');
      } else {
        setTwilioAuthToken('');
      }
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Configure your auto dialer application</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <form onSubmit={handleSaveSettings}>
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Key className="mr-2 h-5 w-5 text-blue-600" />
                Twilio API Configuration
              </h2>
              
              <div className="bg-blue-50 text-blue-700 p-4 rounded-md text-sm mb-4">
                <p>
                  You'll need to sign up for a Twilio account to make automated phone calls.
                  Get your API credentials from the{' '}
                  <a
                    href="https://www.twilio.com/console"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-800"
                  >
                    Twilio Console
                  </a>.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="twilio-account-sid" className="block text-sm font-medium text-gray-700 mb-1">
                    Twilio Account SID
                  </label>
                  <input
                    id="twilio-account-sid"
                    type="password"
                    value={twilioAccountSid}
                    onChange={(e) => setTwilioAccountSid(e.target.value)}
                    onFocus={() => handleCredentialFocus('accountSid', twilioAccountSid)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder={isMasked(twilioAccountSid) ? 'Previously saved value' : 'Enter new Account SID'}
                    required={!isMasked(twilioAccountSid)}
                  />
                </div>
                
                <div>
                  <label htmlFor="twilio-auth-token" className="block text-sm font-medium text-gray-700 mb-1">
                    Twilio Auth Token
                  </label>
                  <input
                    id="twilio-auth-token"
                    type="password"
                    value={twilioAuthToken}
                    onChange={(e) => setTwilioAuthToken(e.target.value)}
                    onFocus={() => handleCredentialFocus('authToken', twilioAuthToken)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder={isMasked(twilioAuthToken) ? 'Previously saved value' : 'Enter new Auth Token'}
                    required={!isMasked(twilioAuthToken)}
                  />
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Phone className="mr-2 h-5 w-5 text-blue-600" />
                Caller ID Configuration
              </h2>
              
              <div className="mb-4">
                <label htmlFor="twilio-phone-number" className="block text-sm font-medium text-gray-700 mb-1">
                  Twilio Phone Number
                </label>
                <input
                  id="twilio-phone-number"
                  type="tel"
                  value={twilioPhoneNumber}
                  onChange={(e) => setTwilioPhoneNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+1 (234) 567-8900"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  This number will be displayed as the caller ID for outbound calls.
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Call Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="call-duration" className="block text-sm font-medium text-gray-700 mb-1">
                    Call Duration (seconds)
                  </label>
                  <input
                    id="call-duration"
                    value={callDuration}
                    onChange={(e) => setCallDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Duration of each outbound call (5-30 seconds)
                  </p>
                </div>
                
                <div>
                  <label htmlFor="call-retry-attempts" className="block text-sm font-medium text-gray-700 mb-1">
                    Retry Attempts
                  </label>
                  <input
                    id="call-retry-attempts"
                    type="number"
                    min="0"
                    max="5"
                    value={callRetryAttempts}
                    onChange={(e) => setCallRetryAttempts(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Number of times to retry failed calls (0-5)
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label htmlFor="call-retry-delay" className="block text-sm font-medium text-gray-700 mb-1">
                    Retry Delay (seconds)
                  </label>
                  <input
                    id="call-retry-delay"
                    type="number"
                    min="30"
                    max="300"
                    value={callRetryDelay}
                    onChange={(e) => setCallRetryDelay(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Time to wait before retrying a failed call (30-300 seconds)
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="ml-auto">
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`px-4 py-2 rounded-md text-white font-medium flex items-center ${
                    isSaving
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;