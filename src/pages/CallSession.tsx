import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useCall } from '../contexts/CallContext';
import CallController from '../components/CallController';
import PhoneNumberList from '../components/PhoneNumberList';
import StatCard from '../components/StatCard';

const CallSession: React.FC = () => {
  const navigate = useNavigate();
  const { activeCallList, callMetrics, isCallSessionActive } = useCall();
  
  // If there's no active call list, redirect to call lists page
  useEffect(() => {
    if (!activeCallList) {
      navigate('/call-lists');
    }
  }, [activeCallList, navigate]);
  
  if (!activeCallList) {
    return null;
  }
  
  return (
    <div className="p-7">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Call Session</h1>
        <p className="text-gray-600">
          Manage your automated calling session for "{activeCallList.name}"
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Numbers"
          value={callMetrics.total}
          icon={Phone}
          color="bg-blue-600"
        />
        <StatCard
          title="Completed Calls"
          value={callMetrics.completed}
          icon={CheckCircle}
          color="bg-green-600"
        />
        <StatCard
          title="Failed Calls"
          value={callMetrics.failed}
          icon={XCircle}
          color="bg-red-600"
        />
        <StatCard
          title="Pending Calls"
          value={callMetrics.remaining}
          icon={Clock}
          color="bg-purple-600"
        />
      </div>
      
      <div className="mb-8">
        <CallController />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white rounded-lg shadow-md p-5">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Active Call List</h2>
          
          <div className="flex flex-col">
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">List Name</h3>
              <p className="text-base font-semibold text-gray-900">{activeCallList.name}</p>
            </div>
            
            {activeCallList.description && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
                <p className="text-base text-gray-900">{activeCallList.description}</p>
              </div>
            )}
            
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Call Progress</h3>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                <div 
                  className="h-full bg-blue-600 rounded-full" 
                  style={{ 
                    width: `${callMetrics.total === 0 ? 0 : Math.round(((callMetrics.completed + callMetrics.failed) / callMetrics.total) * 100)}%` 
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>{Math.round((callMetrics.completed + callMetrics.failed) / callMetrics.total * 100) || 0}% complete</span>
                <span>{callMetrics.completed + callMetrics.failed} / {callMetrics.total}</span>
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Session Status</h3>
              <div className={`flex items-center text-sm ${isCallSessionActive ? 'text-green-600' : 'text-gray-600'}`}>
                <div className={`h-2 w-2 rounded-full mr-2 ${isCallSessionActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                {isCallSessionActive ? 'Active' : 'Inactive'}
              </div>
            </div>
            
            {!isCallSessionActive && callMetrics.remaining > 0 && (
              <div className="bg-blue-50 text-blue-700 p-3 rounded-md text-sm mb-4">
                <p>
                  You have {callMetrics.remaining} pending calls. Use the Call Controller to start the session.
                </p>
              </div>
            )}
            
            {callMetrics.remaining === 0 && callMetrics.total > 0 && (
              <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm">
                <p>
                  All calls have been completed! You can create a new call list or select a different one.
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-5">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Phone Numbers</h2>
            
            <PhoneNumberList phoneNumbers={activeCallList.phoneNumbers} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallSession;