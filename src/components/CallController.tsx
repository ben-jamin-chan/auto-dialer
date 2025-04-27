import React, { useState, useEffect } from 'react';
import { Play, Pause, StopCircle, Phone } from 'lucide-react';
import { useCall } from '../contexts/CallContext';
import { useTwilio } from '../contexts/TwilioContext';

const CallController: React.FC = () => {
  const {
    activeCallList,
    isCallSessionActive,
    currentCall,
    callMetrics,
    startCallSession,
    pauseCallSession,
    stopCallSession,
    updateCallStatus,
  } = useCall();
  
  const { settings } = useTwilio();
  const [callTimer, setCallTimer] = useState(0);
  const [callAnswered, setCallAnswered] = useState(false);
  
  // Reset call state when current call changes
  useEffect(() => {
    // Reset timer and answered status when call changes
    setCallTimer(0);
    setCallAnswered(false);
    
    // If there's a current call and it's in-progress, mark as answered
    if (currentCall && currentCall.status === 'in-progress') {
      setCallAnswered(true);
    }
  }, [currentCall]);
  
  // Handle call duration timer - only start counting when the call is answered
  useEffect(() => {
    let interval: number | undefined;
    
    // Only start the timer if the call is active, there is a current call, and it's been answered
    if (isCallSessionActive && currentCall && callAnswered) {
      interval = window.setInterval(() => {
        setCallTimer((prev) => {
          const newTime = prev + 1;
          
          // Auto-terminate call after custom call duration
          if (newTime >= settings.callDuration) {
            clearInterval(interval);
            // Mark call as completed after custom call duration
            updateCallStatus(currentCall.id, 'completed', newTime);
            return 0;
          }
          
          return newTime;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCallSessionActive, currentCall, updateCallStatus, settings.callDuration, callAnswered]);
  
  // Handle call status changes
  useEffect(() => {
    if (currentCall && currentCall.status === 'in-progress') {
      setCallAnswered(true);
    }
  }, [currentCall?.status]);
  
  const handleStart = () => {
    if (!activeCallList) return;
    startCallSession();
  };
  
  const handlePause = () => {
    pauseCallSession();
  };
  
  const handleStop = () => {
    stopCallSession();
  };
  
  const isSessionEnabled = activeCallList && callMetrics.remaining > 0;
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Call Session Control</h3>
        
        <div className="mb-5">
          {currentCall ? (
            <div className="flex items-center p-4 bg-blue-50 rounded-lg mb-4">
              <Phone className="h-5 w-5 text-blue-600 animate-pulse mr-3" />
              <div>
                <p className="font-medium text-blue-900">
                  Currently calling: {currentCall.number}
                </p>
                <p className="text-sm text-blue-700">
                  {currentCall.name && `${currentCall.name} • `}
                  {callAnswered 
                    ? `Call duration: ${callTimer}s`
                    : 'Waiting for answer...'
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center p-4 bg-gray-50 rounded-lg mb-4">
              <p className="text-gray-500">No active call in progress</p>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 mb-1">Call progress</div>
              <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full"
                  style={{ 
                    width: `${callMetrics.total === 0 ? 0 : Math.round(((callMetrics.completed + callMetrics.failed) / callMetrics.total) * 100)}%` 
                  }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {callMetrics.completed + callMetrics.failed} of {callMetrics.total} calls completed
              </div>
            </div>
            
            <div className="flex space-x-3">
              {!isCallSessionActive ? (
                <button
                  onClick={handleStart}
                  disabled={!isSessionEnabled}
                  className={`py-2 px-4 rounded-md text-white font-medium flex items-center ${
                    isSessionEnabled
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  <Play className="h-4 w-4 mr-1" />
                  Start
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="py-2 px-4 rounded-md bg-yellow-500 hover:bg-yellow-600 text-white font-medium flex items-center"
                >
                  <Pause className="h-4 w-4 mr-1" />
                  Pause
                </button>
              )}
              
              <button
                onClick={handleStop}
                disabled={!isCallSessionActive}
                className={`py-2 px-4 rounded-md text-white font-medium flex items-center ${
                  isCallSessionActive
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                <StopCircle className="h-4 w-4 mr-1" />
                Stop
              </button>
            </div>
          </div>
        </div>
        
        {!activeCallList && (
          <div className="p-4 bg-amber-50 text-amber-800 rounded-lg text-sm">
            Please select a call list to start the calling session.
          </div>
        )}
      </div>
    </div>
  );
};

export default CallController;