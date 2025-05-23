import React, { useState, useEffect, useRef } from 'react';
import { Plus, Upload, Phone, X } from 'lucide-react';
import { useCall } from '../contexts/CallContext';
import CallListCard from '../components/CallListCard';
import PhoneNumberList from '../components/PhoneNumberList';

const CallLists: React.FC = () => {
  const { 
    callLists, 
    activeCallList, 
    addCallList, 
    setActiveCallList, 
    addPhoneNumber, 
    removePhoneNumber, 
    importPhoneNumbers,
    deleteCallList 
  } = useCall();
  
  const [showNewListForm, setShowNewListForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [newListPhoneNumbers, setNewListPhoneNumbers] = useState<string>('');
  
  const [showAddNumberForm, setShowAddNumberForm] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [newPhoneName, setNewPhoneName] = useState('');
  const [multiplePhoneNumbers, setMultiplePhoneNumbers] = useState<string>('');
  
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  
  // Reference to store pending numbers for a newly created list
  const pendingOperation = useRef<{
    action: 'create_list',
    listName: string,
    listDescription: string,
    numbers: { number: string; name?: string }[]
  } | null>(null);

  // Track previous length of callLists to detect additions
  const prevCallListsLength = useRef(callLists.length);
  
  // Effect to handle the creation of a new list with numbers
  useEffect(() => {
    // Check if we have a pending operation and the callLists length has increased
    if (pendingOperation.current && pendingOperation.current.action === 'create_list' 
        && callLists.length > prevCallListsLength.current) {
      
      // Find the newly created list
      const newList = callLists[callLists.length - 1];
      if (newList) {
        // Set as active list
        setActiveCallList(newList.id);
        
        // Add phone numbers if any
        if (pendingOperation.current.numbers.length > 0) {
          importPhoneNumbers(newList.id, pendingOperation.current.numbers);
        }
        
        // Clear the pending operation
        pendingOperation.current = null;
      }
    }
    
    // Update the previous length reference
    prevCallListsLength.current = callLists.length;
  }, [callLists, importPhoneNumbers, setActiveCallList]);
  
  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (newListName.trim()) {
      const listName = newListName.trim();
      const listDescription = newListDescription.trim();
      
      // Parse phone numbers
      const numbersToAdd = newListPhoneNumbers.trim() ? 
        newListPhoneNumbers
          .split('\n')
          .filter(line => line.trim())
          .map(line => {
            const [number, name] = line.split(',').map(item => item.trim());
            return { number, name };
          })
          .filter(item => item.number) : [];
      
      // Store the operation details for the useEffect to handle
      pendingOperation.current = {
        action: 'create_list',
        listName,
        listDescription,
        numbers: numbersToAdd
      };
      
      // Add the call list
      addCallList(listName, listDescription);
      
      // Reset form fields
      setNewListName('');
      setNewListDescription('');
      setNewListPhoneNumbers('');
      setShowNewListForm(false);
    }
  };
  
  const handleAddNumber = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeCallList && newPhoneNumber.trim()) {
      addPhoneNumber(activeCallList.id, newPhoneNumber.trim(), newPhoneName.trim());
      setNewPhoneNumber('');
      setNewPhoneName('');
    }
  };

  const handleAddMultipleNumbers = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activeCallList || !multiplePhoneNumbers.trim()) return;
    
    const numbers = multiplePhoneNumbers
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [number, name] = line.split(',').map(item => item.trim());
        return { number, name };
      })
      .filter(item => item.number);
      
    if (numbers.length > 0) {
      importPhoneNumbers(activeCallList.id, numbers);
      setMultiplePhoneNumbers('');
      setShowAddNumberForm(false);
    }
  };
  
  const handleCsvImport = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!csvFile || !activeCallList) return;
    
    setIsImporting(true);
    
    try {
      const text = await csvFile.text();
      const lines = text.split('\n');
      
      const phoneNumbersToImport = lines
        .filter(line => line.trim())
        .map(line => {
          const [number, name] = line.split(',').map(item => item.trim());
          return { number, name };
        })
        .filter(item => item.number); // Filter out any rows with empty numbers
      
      if (phoneNumbersToImport.length > 0) {
        importPhoneNumbers(activeCallList.id, phoneNumbersToImport);
      }
      
      setCsvFile(null);
    } catch (error) {
      console.error('Error importing CSV:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDeleteCallList = (listId: string) => {
    deleteCallList(listId);
  };
  
  return (
    <div className="p-7">
      <div className="flex justify-between items-center mb-6 ">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Call Lists</h1>
          <p className="text-gray-600">Manage your call lists and phone numbers</p>
        </div>
        <button
          onClick={() => setShowNewListForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Call List
        </button>
      </div>
      
      {showNewListForm && (
        <div className="bg-white rounded-lg shadow-md p-5 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Create New Call List</h2>
            <button
              onClick={() => setShowNewListForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={handleCreateList}>
            <div className="mb-4">
              <label htmlFor="list-name" className="block text-sm font-medium text-gray-700 mb-1">
                List Name
              </label>
              <input
                id="list-name"
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter list name"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="list-description" className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <textarea
                id="list-description"
                value={newListDescription}
                onChange={(e) => setNewListDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter a description for this list"
                rows={3}
              />
            </div>

            <div className="mb-6">
              <label htmlFor="list-phone-numbers" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Numbers (optional)
              </label>
              <textarea
                id="list-phone-numbers"
                value={newListPhoneNumbers}
                onChange={(e) => setNewListPhoneNumbers(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter phone numbers, one per line. Format: number,name (optional)"
                rows={5}
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter each phone number on a new line. You can add a name by adding a comma after the number.
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowNewListForm(false)}
                className="mr-3 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Create List
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <h2 className="text-xl font-medium text-gray-900 mb-4">Your Call Lists</h2>
          
          {callLists.length > 0 ? (
            <div className="space-y-4">
              {callLists.map(list => (
                <CallListCard
                  key={list.id}
                  callList={list}
                  onSelect={() => setActiveCallList(list.id)}
                  onDelete={handleDeleteCallList}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <Phone className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No call lists created yet</p>
              <button
                onClick={() => setShowNewListForm(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Your First List
              </button>
            </div>
          )}
        </div>
        
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-5">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {activeCallList ? `Phone Numbers in "${activeCallList.name}"` : 'Select a call list'}
            </h2>
            
            {activeCallList ? (
              <>
                <div className="mb-6">
                  <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <button
                      onClick={() => setShowAddNumberForm(!showAddNumberForm)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {showAddNumberForm ? 'Hide Form' : 'Add Phone Numbers'}
                    </button>
                    
                    <label className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center cursor-pointer">
                      <Upload className="mr-2 h-4 w-4" />
                      Import CSV
                      <input
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={(e) => e.target.files && setCsvFile(e.target.files[0])}
                      />
                    </label>
                  </div>
                  
                  {showAddNumberForm && (
                    <div className="bg-gray-50 p-4 rounded-md mb-4">
                      <div className="mb-4">
                        <h3 className="text-md font-medium text-gray-700 mb-2">Add Single Number</h3>
                        <form onSubmit={handleAddNumber} className="flex flex-col sm:flex-row gap-3">
                          <div className="flex-1">
                            <label htmlFor="phone-number" className="block text-sm font-medium text-gray-700 mb-1">
                              Phone Number
                            </label>
                            <input
                              id="phone-number"
                              type="tel"
                              value={newPhoneNumber}
                              onChange={(e) => setNewPhoneNumber(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              placeholder="+1 (234) 567-8900"
                            />
                          </div>
                          <div className="flex-1">
                            <label htmlFor="phone-name" className="block text-sm font-medium text-gray-700 mb-1">
                              Name (optional)
                            </label>
                            <input
                              id="phone-name"
                              type="text"
                              value={newPhoneName}
                              onChange={(e) => setNewPhoneName(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Contact name"
                            />
                          </div>
                          <div className="flex items-end">
                            <button
                              type="submit"
                              disabled={!newPhoneNumber.trim()}
                              className="h-10 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                            >
                              Add
                            </button>
                          </div>
                        </form>
                      </div>
                      
                      <div className="border-t border-gray-200 pt-4">
                        <h3 className="text-md font-medium text-gray-700 mb-2">Add Multiple Numbers</h3>
                        <form onSubmit={handleAddMultipleNumbers}>
                          <div className="mb-2">
                            <label htmlFor="multiple-numbers" className="block text-sm font-medium text-gray-700 mb-1">
                              Phone Numbers (one per line)
                            </label>
                            <textarea
                              id="multiple-numbers"
                              value={multiplePhoneNumbers}
                              onChange={(e) => setMultiplePhoneNumbers(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter phone numbers, one per line. Format: number,name (optional)"
                              rows={5}
                            />
                            <p className="mt-1 text-sm text-gray-500">
                              Enter each phone number on a new line. You can add a name by adding a comma after the number.
                            </p>
                          </div>
                          <div className="flex justify-end">
                            <button
                              type="submit"
                              disabled={!multiplePhoneNumbers.trim()}
                              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                            >
                              Add All Numbers
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                  
                  {csvFile && (
                    <div className="bg-blue-50 p-3 rounded-md mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Upload className="h-4 w-4 text-blue-600 mr-2" />
                          <span className="text-sm text-blue-700">{csvFile.name}</span>
                        </div>
                        <div className="flex items-center">
                          <button
                            onClick={() => setCsvFile(null)}
                            className="text-blue-600 hover:text-blue-800 mr-2"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <button
                            onClick={handleCsvImport}
                            disabled={isImporting}
                            className={`px-3 py-1 text-xs rounded-md ${
                              isImporting
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {isImporting ? 'Importing...' : 'Import'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <PhoneNumberList
                  phoneNumbers={activeCallList.phoneNumbers}
                  onRemove={(id) => removePhoneNumber(activeCallList.id, id)}
                  listView={true}
                />
              </>
            ) : (
              <div className="text-center py-8">
                <Phone className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">Select a call list to manage phone numbers</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallLists;