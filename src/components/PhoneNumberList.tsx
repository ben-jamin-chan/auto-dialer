import React from 'react';
import { Phone, Check, X, Clock } from 'lucide-react';
import { PhoneNumber } from '../contexts/CallContext';

interface PhoneNumberListProps {
  phoneNumbers: PhoneNumber[];
  onRemove?: (id: string) => void;
}

const PhoneNumberList: React.FC<PhoneNumberListProps> = ({ phoneNumbers, onRemove }) => {
  const getStatusIcon = (status: PhoneNumber['status']) => {
    switch (status) {
      case 'completed':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <X className="h-4 w-4 text-red-500" />;
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
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (phoneNumbers.length === 0) {
    return (
      <div className="text-center py-8">
        <Phone className="h-10 w-10 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500">No phone numbers added yet.</p>
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
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusClass(phoneNumber.status)}`}>
                  {getStatusText(phoneNumber.status)}
                </span>
                {phoneNumber.callDuration && (
                  <span className="ml-2 text-sm text-gray-500">
                    {phoneNumber.callDuration}s
                  </span>
                )}
                {onRemove && (
                  <button
                    onClick={() => onRemove(phoneNumber.id)}
                    className="ml-4 text-red-500 hover:text-red-700"
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