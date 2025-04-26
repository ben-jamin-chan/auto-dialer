import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Clock, Check, X, Trash2 } from 'lucide-react';
import { CallList } from '../contexts/CallContext';

interface CallListCardProps {
  callList: CallList;
  onSelect: () => void;
  onDelete?: (id: string) => void;
}

const CallListCard: React.FC<CallListCardProps> = ({ callList, onSelect, onDelete }) => {
  const navigate = useNavigate();
  
  const totalNumbers = callList.phoneNumbers.length;
  const completedCalls = callList.phoneNumbers.filter(n => n.status === 'completed').length;
  const failedCalls = callList.phoneNumbers.filter(n => n.status === 'failed').length;
  const pendingCalls = callList.phoneNumbers.filter(n => n.status === 'pending').length;
  
  const formattedDate = new Date(callList.updatedAt).toLocaleDateString();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && window.confirm(`Are you sure you want to delete "${callList.name}"?`)) {
      onDelete(callList.id);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all hover:shadow-lg">
      <div className="p-5">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-lg font-semibold text-gray-900">{callList.name}</h3>
          {onDelete && (
            <button 
              onClick={handleDelete}
              className="text-red-500 hover:text-red-700 focus:outline-none"
              title="Delete call list"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
        {callList.description && (
          <p className="text-sm text-gray-500 mb-4">{callList.description}</p>
        )}
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center">
            <Phone className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">{totalNumbers} numbers</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">Updated {formattedDate}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="flex flex-col items-center p-2 bg-blue-50 rounded">
            <Check className="h-4 w-4 text-green-500 mb-1" />
            <span className="text-xs text-gray-600">{completedCalls} completed</span>
          </div>
          <div className="flex flex-col items-center p-2 bg-red-50 rounded">
            <X className="h-4 w-4 text-red-500 mb-1" />
            <span className="text-xs text-gray-600">{failedCalls} failed</span>
          </div>
          <div className="flex flex-col items-center p-2 bg-gray-50 rounded">
            <Phone className="h-4 w-4 text-blue-500 mb-1" />
            <span className="text-xs text-gray-600">{pendingCalls} pending</span>
          </div>
        </div>
        
        <div className="flex justify-between space-x-2">
          <button 
            onClick={onSelect}
            className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-md transition-colors"
          >
            Select List
          </button>
          <button 
            onClick={() => navigate('/call-session')}
            className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-md transition-colors"
          >
            Start Calling
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallListCard;