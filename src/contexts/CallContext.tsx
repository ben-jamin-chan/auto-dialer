import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTwilio } from './TwilioContext';
import toast from 'react-hot-toast';

// Define localStorage key for call lists
const CALL_LISTS_STORAGE_KEY = 'call_lists';
const ACTIVE_CALL_LIST_STORAGE_KEY = 'active_call_list_id';

export interface PhoneNumber {
  id: string;
  number: string;
  name?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'declined';
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
  deleteCallList: (listId: string) => void;
  handleTwilioStatusUpdate: (callSid: string, status: string) => void;
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

  // Load call lists from localStorage on mount
  useEffect(() => {
    const savedCallLists = localStorage.getItem(CALL_LISTS_STORAGE_KEY);
    if (savedCallLists) {
      try {
        // Parse the stored JSON string
        const parsedLists = JSON.parse(savedCallLists);
        
        // Convert string dates back to Date objects
        const processedLists = parsedLists.map((list: Omit<CallList, 'createdAt' | 'updatedAt'> & {
          createdAt: string;
          updatedAt: string;
          phoneNumbers: Array<Omit<PhoneNumber, 'callStartTime' | 'callEndTime'> & {
            callStartTime?: string;
            callEndTime?: string;
          }>;
        }) => ({
          ...list,
          createdAt: new Date(list.createdAt),
          updatedAt: new Date(list.updatedAt),
          phoneNumbers: list.phoneNumbers.map((phone) => ({
            ...phone,
            callStartTime: phone.callStartTime ? new Date(phone.callStartTime) : undefined,
            callEndTime: phone.callEndTime ? new Date(phone.callEndTime) : undefined,
          })),
        }));
        
        setCallLists(processedLists);
        
        // Restore active call list if it exists
        const activeListId = localStorage.getItem(ACTIVE_CALL_LIST_STORAGE_KEY);
        if (activeListId) {
          const activeList = processedLists.find((list: CallList) => list.id === activeListId);
          if (activeList) {
            setActiveCallList(activeList);
          }
        }
      } catch (error) {
        console.error('Error parsing saved call lists:', error);
      }
    }
  }, []);

  // Save call lists to localStorage whenever they change
  useEffect(() => {
    if (callLists.length > 0) {
      localStorage.setItem(CALL_LISTS_STORAGE_KEY, JSON.stringify(callLists));
    } else {
      localStorage.removeItem(CALL_LISTS_STORAGE_KEY);
    }
  }, [callLists]);

  // Save active call list ID whenever it changes
  useEffect(() => {
    if (activeCallList) {
      localStorage.setItem(ACTIVE_CALL_LIST_STORAGE_KEY, activeCallList.id);
    } else {
      localStorage.removeItem(ACTIVE_CALL_LIST_STORAGE_KEY);
    }
  }, [activeCallList]);

  // Calculate call metrics based on active call list
  const callMetrics: CallMetrics = {
    total: activeCallList?.phoneNumbers.length || 0,
    completed: activeCallList?.phoneNumbers.filter(n => n.status === 'completed').length || 0,
    failed: activeCallList?.phoneNumbers.filter(n => n.status === 'failed' || n.status === 'declined').length || 0,
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
    
    // Make sure we're setting the updated list from the latest state
    if (list) {
      // Using a callback to ensure we're working with the most up-to-date state
      setActiveCallList(list);
    } else {
      setActiveCallList(null);
    }
  };

  // Add a phone number to a call list
  const addPhoneNumber = (listId: string, number: string, name?: string) => {
    const newNumber: PhoneNumber = {
      id: Date.now().toString(),
      number,
      name,
      status: 'pending',
    };
    
    const updatedLists = callLists.map(list => {
      if (list.id === listId) {
        return {
          ...list,
          phoneNumbers: [...list.phoneNumbers, newNumber],
          updatedAt: new Date(),
        };
      }
      return list;
    });
    
    setCallLists(updatedLists);
    
    // Update active call list if needed
    if (activeCallList?.id === listId) {
      const updatedActiveList = updatedLists.find(list => list.id === listId);
      setActiveCallList(updatedActiveList || null);
    }
  };

  // Remove a phone number from a call list
  const removePhoneNumber = (listId: string, numberId: string) => {
    const updatedLists = callLists.map(list => {
      if (list.id === listId) {
        return {
          ...list,
          phoneNumbers: list.phoneNumbers.filter(n => n.id !== numberId),
          updatedAt: new Date(),
        };
      }
      return list;
    });
    
    setCallLists(updatedLists);
    
    // Update active call list if needed
    if (activeCallList?.id === listId) {
      const updatedActiveList = updatedLists.find(list => list.id === listId);
      setActiveCallList(updatedActiveList || null);
    }
  };

  // Import multiple phone numbers to a call list
  const importPhoneNumbers = (listId: string, numbers: { number: string; name?: string }[]) => {
    const newNumbers: PhoneNumber[] = numbers.map(n => ({
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      number: n.number,
      name: n.name,
      status: 'pending',
    }));
    
    const updatedLists = callLists.map(list => {
      if (list.id === listId) {
        return {
          ...list,
          phoneNumbers: [...list.phoneNumbers, ...newNumbers],
          updatedAt: new Date(),
        };
      }
      return list;
    });
    
    setCallLists(updatedLists);
    
    // Update active call list if needed
    if (activeCallList?.id === listId) {
      const updatedActiveList = updatedLists.find(list => list.id === listId);
      setActiveCallList(updatedActiveList || null);
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

    // Handle call declined or failed cases
    const isCallDeclined = (status === 'failed' || status === 'declined') && currentCall?.id === numberId;
    
    // Use functional update to ensure we're working with the latest state
    setCallLists(prevLists => {
      const updatedLists = prevLists.map(list => {
        if (list.id === activeCallList.id) {
          return {
            ...list,
            phoneNumbers: list.phoneNumbers.map(n => {
              if (n.id === numberId) {
                return {
                  ...n,
                  status,
                  callDuration: duration,
                  // Only set callStartTime on first transition to in-progress
                  ...(status === 'in-progress' && !n.callStartTime ? { callStartTime: new Date() } : {}),
                  ...(status === 'completed' || status === 'failed' || status === 'declined' ? { callEndTime: new Date() } : {}),
                };
              }
              return n;
            }),
            updatedAt: new Date(),
          };
        }
        return list;
      });
      
      // Find the updated list to immediately update activeCallList
      const updatedActiveList = updatedLists.find(list => list.id === activeCallList.id);
      if (updatedActiveList) {
        // Schedule activeCallList update on next tick to ensure it happens after callLists update
        setTimeout(() => setActiveCallList(updatedActiveList), 0);
      }
      
      return updatedLists;
    });

    // If current call is completed, failed, or declined, move to next call
    if (currentCall?.id === numberId && (status === 'completed' || status === 'failed' || status === 'declined')) {
      if (isCallSessionActive) {
        // Using setTimeout to ensure we access updated state after the list update
        setTimeout(() => {
          // Get the current lists to ensure we're working with the latest state
          const updatedList = callLists.find(list => list.id === activeCallList.id);
          if (updatedList) {
            const nextCall = updatedList.phoneNumbers.find(n => n.status === 'pending');
            if (nextCall) {
              // If we needed to fail the current call, show a notification
              if (isCallDeclined) {
                const statusText = status === 'declined' ? 'declined' : 'failed';
                toast.error(`Call to ${currentCall.number} was ${statusText}. Moving to next number.`);
              }
              
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
        }, 10); // Small delay to ensure state has been updated
      } else {
        setCurrentCall(null);
      }
    }
  };

  // Handle Twilio call status updates
  const handleTwilioStatusUpdate = (callSid: string, status: string) => {
    if (!currentCall) return;
    
    // Map Twilio status to our app status
    console.log(`Call ${callSid} status: ${status}`);
    
    if (status === 'busy' || status === 'no-answer' || status === 'canceled') {
      // Call was declined or not answered
      updateCallStatus(currentCall.id, 'declined');
    } else if (status === 'failed') {
      // Technical failure
      updateCallStatus(currentCall.id, 'failed');
    } else if (status === 'completed') {
      updateCallStatus(currentCall.id, 'completed');
    }
  };

  // Delete a call list by ID
  const deleteCallList = (listId: string) => {
    setCallLists(callLists.filter(list => list.id !== listId));
    if (activeCallList?.id === listId) {
      setActiveCallList(null);
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
        deleteCallList,
        handleTwilioStatusUpdate,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};