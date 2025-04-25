import React, { createContext, useContext, useState } from 'react';
import { useTwilio } from './TwilioContext';

export interface PhoneNumber {
  id: string;
  number: string;
  name?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  callDuration?: number;
  callStartTime?: Date;
  callEndTime?: Date;
  notes?: string;
}

export interface CallList {
  id: string;
  name: string;
  description?: string;
  phoneNumbers: PhoneNumber[];
  createdAt: Date;
  updatedAt: Date;
}

interface CallMetrics {
  total: number;
  completed: number;
  failed: number;
  remaining: number;
}

interface CallContextType {
  callLists: CallList[];
  activeCallList: CallList | null;
  isCallSessionActive: boolean;
  currentCall: PhoneNumber | null;
  callMetrics: CallMetrics;
  addCallList: (name: string, description?: string) => void;
  setActiveCallList: (listId: string) => void;
  addPhoneNumber: (listId: string, number: string, name?: string) => void;
  removePhoneNumber: (listId: string, numberId: string) => void;
  importPhoneNumbers: (listId: string, numbers: { number: string; name?: string }[]) => void;
  startCallSession: () => void;
  pauseCallSession: () => void;
  stopCallSession: () => void;
  updateCallStatus: (numberId: string, status: PhoneNumber['status'], duration?: number) => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const useCall = () => {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { makeCall, makeDirectCall } = useTwilio();
  const [callLists, setCallLists] = useState<CallList[]>([]);
  const [activeCallList, setActiveCallList] = useState<CallList | null>(null);
  const [isCallSessionActive, setIsCallSessionActive] = useState(false);
  const [currentCall, setCurrentCall] = useState<PhoneNumber | null>(null);

  // Calculate call metrics based on active call list
  const callMetrics: CallMetrics = {
    total: activeCallList?.phoneNumbers.length || 0,
    completed: activeCallList?.phoneNumbers.filter(n => n.status === 'completed').length || 0,
    failed: activeCallList?.phoneNumbers.filter(n => n.status === 'failed').length || 0,
    remaining: activeCallList?.phoneNumbers.filter(n => n.status === 'pending').length || 0,
  };

  // Add a new call list
  const addCallList = (name: string, description?: string) => {
    const newList: CallList = {
      id: Date.now().toString(),
      name,
      description,
      phoneNumbers: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setCallLists([...callLists, newList]);
  };

  // Set active call list by ID
  const setActiveListById = (listId: string) => {
    const list = callLists.find(list => list.id === listId);
    setActiveCallList(list || null);
  };

  // Add a phone number to a call list
  const addPhoneNumber = (listId: string, number: string, name?: string) => {
    setCallLists(
      callLists.map(list => {
        if (list.id === listId) {
          const newNumber: PhoneNumber = {
            id: Date.now().toString(),
            number,
            name,
            status: 'pending',
          };
          return {
            ...list,
            phoneNumbers: [...list.phoneNumbers, newNumber],
            updatedAt: new Date(),
          };
        }
        return list;
      })
    );

    // Update active call list if needed
    if (activeCallList?.id === listId) {
      setActiveListById(listId);
    }
  };

  // Remove a phone number from a call list
  const removePhoneNumber = (listId: string, numberId: string) => {
    setCallLists(
      callLists.map(list => {
        if (list.id === listId) {
          return {
            ...list,
            phoneNumbers: list.phoneNumbers.filter(n => n.id !== numberId),
            updatedAt: new Date(),
          };
        }
        return list;
      })
    );

    // Update active call list if needed
    if (activeCallList?.id === listId) {
      setActiveListById(listId);
    }
  };

  // Import multiple phone numbers to a call list
  const importPhoneNumbers = (listId: string, numbers: { number: string; name?: string }[]) => {
    setCallLists(
      callLists.map(list => {
        if (list.id === listId) {
          const newNumbers: PhoneNumber[] = numbers.map(n => ({
            id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
            number: n.number,
            name: n.name,
            status: 'pending',
          }));
          return {
            ...list,
            phoneNumbers: [...list.phoneNumbers, ...newNumbers],
            updatedAt: new Date(),
          };
        }
        return list;
      })
    );

    // Update active call list if needed
    if (activeCallList?.id === listId) {
      setActiveListById(listId);
    }
  };

  // Start call session
  const startCallSession = () => {
    if (activeCallList && activeCallList.phoneNumbers.some(n => n.status === 'pending')) {
      setIsCallSessionActive(true);
      
      // Find the first pending number and set it as current call
      const nextCall = activeCallList.phoneNumbers.find(n => n.status === 'pending');
      if (nextCall) {
        setCurrentCall(nextCall);
        
        // Update the status to in-progress
        updateCallStatus(nextCall.id, 'in-progress');
        
        // Try direct call first (bypasses authentication), then fallback to normal call
        makeDirectCall(nextCall.number)
          .catch(error => {
            console.error('Direct call failed, trying normal call:', error);
            // Fallback to normal call through Supabase
            return makeCall(nextCall.number);
          })
          .catch(error => {
            console.error('All call methods failed:', error);
            // If all call methods fail, mark as failed and move to the next call
            updateCallStatus(nextCall.id, 'failed');
          });
      }
    }
  };

  // Pause call session
  const pauseCallSession = () => {
    setIsCallSessionActive(false);
  };

  // Stop call session
  const stopCallSession = () => {
    setIsCallSessionActive(false);
    setCurrentCall(null);
  };

  // Update call status
  const updateCallStatus = (numberId: string, status: PhoneNumber['status'], duration?: number) => {
    if (!activeCallList) return;

    setCallLists(
      callLists.map(list => {
        if (list.id === activeCallList.id) {
          return {
            ...list,
            phoneNumbers: list.phoneNumbers.map(n => {
              if (n.id === numberId) {
                return {
                  ...n,
                  status,
                  callDuration: duration,
                  ...(status === 'in-progress' ? { callStartTime: new Date() } : {}),
                  ...(status === 'completed' || status === 'failed' ? { callEndTime: new Date() } : {}),
                };
              }
              return n;
            }),
            updatedAt: new Date(),
          };
        }
        return list;
      })
    );

    // Update active call list
    setActiveListById(activeCallList.id);

    // If current call is completed or failed, move to next call
    if (currentCall?.id === numberId && (status === 'completed' || status === 'failed')) {
      if (isCallSessionActive) {
        // Find the next pending call
        const updatedList = callLists.find(list => list.id === activeCallList.id);
        if (updatedList) {
          const nextCall = updatedList.phoneNumbers.find(n => n.status === 'pending');
          if (nextCall) {
            setCurrentCall(nextCall);
            // Update the status to in-progress
            updateCallStatus(nextCall.id, 'in-progress');
            
            // Try direct call first (bypasses authentication), then fallback to normal call
            makeDirectCall(nextCall.number)
              .catch(error => {
                console.error('Direct call failed, trying normal call:', error);
                // Fallback to normal call through Supabase
                return makeCall(nextCall.number);
              })
              .catch(error => {
                console.error('All call methods failed:', error);
                // If all call methods fail, mark as failed and move to the next call
                updateCallStatus(nextCall.id, 'failed');
              });
          } else {
            // No more calls to make
            setCurrentCall(null);
            setIsCallSessionActive(false);
          }
        }
      } else {
        setCurrentCall(null);
      }
    }
  };

  return (
    <CallContext.Provider
      value={{
        callLists,
        activeCallList,
        isCallSessionActive,
        currentCall,
        callMetrics,
        addCallList,
        setActiveCallList: setActiveListById,
        addPhoneNumber,
        removePhoneNumber,
        importPhoneNumbers,
        startCallSession,
        pauseCallSession,
        stopCallSession,
        updateCallStatus,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};