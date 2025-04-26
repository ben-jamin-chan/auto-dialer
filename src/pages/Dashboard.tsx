import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, CheckCircle, XCircle, Clock, List, PlayCircle } from 'lucide-react';
import { useCall } from '../contexts/CallContext';
import StatCard from '../components/StatCard';
import CallListCard from '../components/CallListCard';
import CallController from '../components/CallController';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { callLists, callMetrics, activeCallList, setActiveCallList, isCallSessionActive, deleteCallList } = useCall();
  
  // Get the most recently updated call lists (max 2)
  const recentCallLists = [...callLists]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 2);
  
  const handleDeleteCallList = (listId: string) => {
    deleteCallList(listId);
  };
  
  return (
    <div className="p-7">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your automated calling system</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Numbers"
          value={callMetrics.total}
          icon={Phone}
          color="bg-blue-600"
          subtext={activeCallList ? `in "${activeCallList.name}"` : 'No list selected'}
        />
        <StatCard
          title="Completed Calls"
          value={callMetrics.completed}
          icon={CheckCircle}
          color="bg-green-600"
          subtext="Successfully connected"
        />
        <StatCard
          title="Failed Calls"
          value={callMetrics.failed}
          icon={XCircle}
          color="bg-red-600"
          subtext="Unable to connect"
        />
        <StatCard
          title="Pending Calls"
          value={callMetrics.remaining}
          icon={Clock}
          color="bg-purple-600"
          subtext="Waiting to be dialed"
        />
      </div>
      
      {isCallSessionActive && (
        <div className="mb-8">
          <CallController />
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Recent Call Lists</h2>
            <button
              onClick={() => navigate('/call-lists')}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              View All <List className="ml-1 h-4 w-4" />
            </button>
          </div>
          
          {recentCallLists.length > 0 ? (
            <div className="space-y-4">
              {recentCallLists.map(callList => (
                <CallListCard
                  key={callList.id}
                  callList={callList}
                  onSelect={() => setActiveCallList(callList.id)}
                  onDelete={handleDeleteCallList}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <List className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 mb-4">No call lists created yet</p>
              <button
                onClick={() => navigate('/call-lists')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Call List
              </button>
            </div>
          )}
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Call Session</h2>
            <button
              onClick={() => navigate('/call-session')}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              Start Session <PlayCircle className="ml-1 h-4 w-4" />
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-medium text-gray-900 mb-4">Active Call List</h3>
            
            {activeCallList ? (
              <div>
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <div className="flex items-center mb-2">
                    <Phone className="h-5 w-5 text-blue-700 mr-2" />
                    <h4 className="font-medium text-blue-900">{activeCallList.name}</h4>
                  </div>
                  <p className="text-sm text-blue-700 mb-2">
                    {activeCallList.phoneNumbers.length} phone numbers
                  </p>
                  <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full" 
                      style={{ 
                        width: `${Math.round(((callMetrics.completed + callMetrics.failed) / callMetrics.total) * 100)}%` 
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-blue-700">
                    <span>{callMetrics.completed + callMetrics.failed} completed</span>
                    <span>{callMetrics.remaining} remaining</span>
                  </div>
                </div>
                
                <button
                  onClick={() => navigate('/call-session')}
                  className="w-full py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center"
                >
                  <PlayCircle className="mr-2 h-5 w-5" />
                  {isCallSessionActive ? 'Manage Active Session' : 'Start Calling'}
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <Phone className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 mb-4">No call list selected</p>
                <button
                  onClick={() => navigate('/call-lists')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Select Call List
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;