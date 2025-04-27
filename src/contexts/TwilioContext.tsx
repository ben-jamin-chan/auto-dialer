import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

interface TwilioSettings {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  retryAttempts: number;
  retryDelay: number;
  callDuration: number;
}

interface TwilioContextType {
  settings: TwilioSettings;
  saveSettings: (settings: TwilioSettings) => Promise<void>;
  makeCall: (to: string) => Promise<void>;
  makeDirectCall: (to: string) => Promise<void>;
}

const TwilioContext = createContext<TwilioContextType | undefined>(undefined);

export const useTwilio = () => {
  const context = useContext(TwilioContext);
  if (!context) {
    throw new Error('useTwilio must be used within a TwilioProvider');
  }
  return context;
};

const STORAGE_KEY = 'twilio_settings';

// Debug Supabase configuration
const supbaseUrlAvailable = !!import.meta.env.VITE_SUPABASE_URL;
const supabaseKeyAvailable = !!import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL available:', supbaseUrlAvailable);
console.log('Supabase Anon Key available:', supabaseKeyAvailable);

if (!supbaseUrlAvailable || !supabaseKeyAvailable) {
  console.error(
    'Supabase environment variables missing. Create a .env file in your project root with:\n' +
    'VITE_SUPABASE_URL=https://your-project-ref.supabase.co\n' +
    'VITE_SUPABASE_ANON_KEY=your-supabase-anon-key'
  );
}

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

export const TwilioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<TwilioSettings>({
    accountSid: '',
    authToken: '',
    phoneNumber: '',
    retryAttempts: 2,
    retryDelay: 60,
    callDuration: 30,
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const saveSettings = async (newSettings: TwilioSettings) => {
    try {
      if (!newSettings.accountSid || !newSettings.authToken || !newSettings.phoneNumber) {
        throw new Error('Please fill in all required Twilio settings');
      }

      // Validate phone number format
      const phoneNumber = newSettings.phoneNumber.replace(/\D/g, '');
      if (!phoneNumber) {
        throw new Error('Invalid phone number format');
      }

      const settings = {
        ...newSettings,
        phoneNumber: `+${phoneNumber}`, // Ensure E.164 format
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setSettings(settings);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save settings');
      throw error;
    }
  };

  const makeCall = async (to: string) => {
    try {
      if (!settings.accountSid || !settings.authToken || !settings.phoneNumber) {
        toast.error('Please configure Twilio settings before making calls');
        throw new Error('Please configure Twilio settings before making calls');
      }

      // Check if Supabase URL is configured
      if (!import.meta.env.VITE_SUPABASE_URL) {
        toast.error('Supabase URL not configured');
        throw new Error('Supabase URL not configured');
      }

      // Validate and format the phone number
      const toNumber = to.replace(/\D/g, '');
      if (!toNumber) {
        toast.error('Invalid phone number format');
        throw new Error('Invalid phone number format');
      }

      toast.loading('Initiating call...');

      // Use a guest ID if user isn't authenticated
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'guest-' + Date.now();

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/make-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          to: `+${toNumber}`, // Ensure E.164 format
          from: settings.phoneNumber,
          userId: userId,
        }),
      });

      toast.dismiss();

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Failed to initiate call';
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      toast.success(`Call initiated to +${toNumber}`);
      return data;
    } catch (error) {
      console.error('Error making call:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to make call';
      toast.error(errorMessage);
      throw error;
    }
  };

  // Direct call that bypasses Supabase
  const makeDirectCall = async (to: string) => {
    try {
      if (!settings.accountSid || !settings.authToken || !settings.phoneNumber) {
        toast.error('Please configure Twilio settings before making calls');
        throw new Error('Please configure Twilio settings before making calls');
      }

      // Validate and format the phone number
      const toNumber = to.replace(/\D/g, '');
      if (!toNumber) {
        toast.error('Invalid phone number format');
        throw new Error('Invalid phone number format');
      }

      toast.loading('Initiating direct call...');
      
      // Create a Twilio client directly in the browser (only for testing)
      // Note: This exposes your Twilio credentials in the client, not for production use
      try {
        // Create a very basic proxy call
        const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + 
          settings.accountSid + '/Calls.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(settings.accountSid + ':' + settings.authToken)
          },
          body: new URLSearchParams({
            To: `+${toNumber}`,
            From: settings.phoneNumber,
            Url: 'http://demo.twilio.com/docs/voice.xml' // Default TwiML
          }).toString()
        });

        toast.dismiss();

        if (!response.ok) {
          const errorData = await response.json();
          toast.error(errorData.message || 'Failed to make direct call');
          throw new Error(errorData.message || 'Failed to make direct call');
        }

        toast.success(`Direct call initiated to +${toNumber}`);
        return await response.json();
      } catch (error) {
        toast.error('Direct Twilio call failed. Try the regular call method.');
        throw error;
      }
    } catch (error) {
      console.error('Error making direct call:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to make direct call');
      throw error;
    }
  };

  return (
    <TwilioContext.Provider value={{ settings, saveSettings, makeCall, makeDirectCall }}>
      {children}
    </TwilioContext.Provider>
  );
};