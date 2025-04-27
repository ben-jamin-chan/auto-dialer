import React, { useState } from 'react';
import { Phone, Check, X, Clock, ChevronDown, Loader2 } from 'lucide-react';
import { PhoneNumber } from '../contexts/CallContext';
import { useCall } from '../contexts/CallContext';
import toast from 'react-hot-toast';

interface PhoneNumberListProps {
  phoneNumbers: PhoneNumber[];
  onRemove?: (id: string) => void;
  simpleView?: boolean;
}

const PhoneNumberList: React.FC<PhoneNumberListProps> = ({ 
  phoneNumbers, 
  onRemove,
  simpleView = false
}) => {
  const { updateCallStatus } = useCall();
  const [showStatusMenu, setShowStatusMenu] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  
  const getStatusIcon = (status: PhoneNumber['status']) => {
    switch (status) {
      case 'completed':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <X className="h-4 w-4 text-red-500" />;
      case 'declined':
        return <X className="h-4 w-4 text-orange-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />;
      default:
        return <Phone className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: PhoneNumber['status']) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'declined':
        return 'Declined';
      case 'in-progress':
        return 'In Progress';
      default:
        return 'Pending';
    }
  };

  const getStatusClass = (status: PhoneNumber['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'declined':
        return 'bg-orange-100 text-orange-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = (phoneNumber: PhoneNumber, newStatus: PhoneNumber['status']) => {
    // Set the updating state to show loading indicator
    setUpdatingStatus(phoneNumber.id);
    
    try {
      // Update the call status
      updateCallStatus(phoneNumber.id, newStatus, phoneNumber.callDuration || 0);
      
      // Show success notification
      toast.success(`Status updated to ${getStatusText(newStatus)}`);
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status. Please try again.');
    } finally {
      // Ensure the menu closes and updating state is cleared after a small delay
      // This delay gives visual feedback to the user that something happened
      setTimeout(() => {
        setUpdatingStatus(null);
        setShowStatusMenu(null);
      }, 300);
    }
  };

  const getStatusOptions = (currentStatus: PhoneNumber['status']) => {
    const allStatuses: PhoneNumber['status'][] = ['pending', 'in-progress', 'completed', 'failed', 'declined'];
    return allStatuses.filter(status => status !== currentStatus);
  };

  if (phoneNumbers.length === 0) {
    return (
      <div className="text-center py-8">
        <Phone className="h-10 w-10 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500">No phone numbers added yet.</p>
      </div>
    );
  }

  if (simpleView) {
    return (
      <div className="space-y-4">
        {phoneNumbers.map((phoneNumber) => (
          <div key={phoneNumber.id} className="flex items-center justify-between p-4 bg-white rounded-md shadow-sm">
            <div className="flex items-center">
              <div className="text-yellow-500 mr-4">
                {getStatusIcon(phoneNumber.status)}
              </div>
              <div>
                <p className="font-medium">{phoneNumber.number}</p>
                {phoneNumber.name && <p className="text-sm text-gray-500">{phoneNumber.name}</p>}
              </div>
            </div>
            
            <div className="relative">
              <button 
                onClick={() => updatingStatus ? null : setShowStatusMenu(showStatusMenu === phoneNumber.id ? null : phoneNumber.id)}
                disabled={updatingStatus !== null}
                className={`flex items-center space-x-1 px-3 py-1 ${getStatusClass(phoneNumber.status)} rounded-full text-sm ${updatingStatus ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {updatingStatus === phoneNumber.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <span>{getStatusText(phoneNumber.status)}</span>
                    <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </button>
              
              {showStatusMenu === phoneNumber.id && !updatingStatus && (
                <div className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                  <div className="py-1">
                    {getStatusOptions(phoneNumber.status).map(status => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(phoneNumber, status)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {status === 'completed' && <Check className="h-3 w-3 inline mr-2 text-green-500" />}
                        {status === 'failed' && <X className="h-3 w-3 inline mr-2 text-red-500" />}
                        {status === 'declined' && <X className="h-3 w-3 inline mr-2 text-orange-500" />}
                        {status === 'in-progress' && <Clock className="h-3 w-3 inline mr-2 text-yellow-500" />}
                        {status === 'pending' && <Phone className="h-3 w-3 inline mr-2 text-gray-400" />}
                        {getStatusText(status)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white shadow-sm rounded-lg">
      <ul className="divide-y divide-gray-200">
        {phoneNumbers.map((phoneNumber) => (
          <li key={phoneNumber.id} className="p-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="mr-4">
                  {getStatusIcon(phoneNumber.status)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {phoneNumber.number}
                  </p>
                  {phoneNumber.name && (
                    <p className="text-sm text-gray-500">{phoneNumber.name}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center">
                <div className="relative">
                  <button 
                    onClick={() => updatingStatus ? null : setShowStatusMenu(showStatusMenu === phoneNumber.id ? null : phoneNumber.id)}
                    disabled={updatingStatus !== null}
                    className={`flex items-center px-2 py-1 text-xs rounded-full ${getStatusClass(phoneNumber.status)} ${updatingStatus ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {updatingStatus === phoneNumber.id ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        {getStatusText(phoneNumber.status)}
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </>
                    )}
                  </button>
                  
                  {showStatusMenu === phoneNumber.id && !updatingStatus && (
                    <div className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                      <div className="py-1">
                        {getStatusOptions(phoneNumber.status).map(status => (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(phoneNumber, status)}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            {status === 'completed' && <Check className="h-3 w-3 inline mr-2 text-green-500" />}
                            {status === 'failed' && <X className="h-3 w-3 inline mr-2 text-red-500" />}
                            {status === 'declined' && <X className="h-3 w-3 inline mr-2 text-orange-500" />}
                            {status === 'in-progress' && <Clock className="h-3 w-3 inline mr-2 text-yellow-500" />}
                            {status === 'pending' && <Phone className="h-3 w-3 inline mr-2 text-gray-400" />}
                            {getStatusText(status)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {phoneNumber.callDuration && (
                  <span className="ml-2 text-sm text-gray-500">
                    {phoneNumber.callDuration}s
                  </span>
                )}
                {onRemove && (
                  <button
                    onClick={() => onRemove(phoneNumber.id)}
                    className="ml-4 text-red-500 hover:text-red-700"
                    disabled={updatingStatus !== null}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PhoneNumberList;