import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useOnboardingBuilder } from '../contexts/OnboardingBuilderContext';
import { ConfigForm } from '../components/builder/ConfigForm';
import { WelcomePagePreview } from '../components/preview/WelcomePagePreview';
import { copyToClipboard } from '../utils/linkGenerator';
import { createPilot, generatePilotLink } from '../utils/db';
import { getAllCustomers } from '../utils/customerDb';
import { getAllUsers } from '../utils/userDb';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/shared/Button';
import { Input } from '../components/shared/Input';
import { Toggle } from '../components/shared/Toggle';
import MultiSelect from '../components/shared/MultiSelect';
import type { Customer } from '../types/customer';
import type { User } from '../types/auth';

export function CreatePilotPage() {
  const navigate = useNavigate();
  const { state: onboardingState, dispatch } = useOnboardingBuilder();
  const { state: authState } = useAuth();
  const [shareableLink, setShareableLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // New state for customer data collection mode
  const [enableCustomerLink, setEnableCustomerLink] = useState(false);
  
  // Customer state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  
  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  
  // Basic pilot fields (internal use)
  const [pilotData, setPilotData] = useState({
    name: '',
    company: '',
    contactEmail: '',
    location: '',
    locationName: '',
    cameraCount: '',
    startDate: new Date().toISOString().split('T')[0],
    status: 'active' as 'draft' | 'active' | 'completed',
  });
  
  // New customer form data
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    title: '',
    timezone: '',
  });

  // Load customers and users
  useEffect(() => {
    const loadData = async () => {
      try {
        const [customersData, usersData] = await Promise.all([
          getAllCustomers(),
          getAllUsers(),
        ]);
        setCustomers(customersData);
        setUsers(usersData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load customers and users');
      }
    };
    loadData();
  }, []);

  // Sync company name between basic form and config form
  useEffect(() => {
    if (enableCustomerLink && pilotData.name) {
      dispatch({
        type: 'UPDATE_CONFIG',
        payload: { pilotName: pilotData.name },
      });
    }
  }, [enableCustomerLink, pilotData.name, dispatch]);

  const handleCreatePilot = async () => {
    if (!authState.user) {
      toast.error('User not authenticated');
      return;
    }

    setIsLoading(true);
    try {
      // Validate pilot name
      if (!pilotData.name.trim()) {
        toast.error('Please enter a pilot name');
        setIsLoading(false);
        return;
      }

      // Validate location name
      if (!pilotData.locationName.trim()) {
        toast.error('Please enter a location name');
        setIsLoading(false);
        return;
      }

      // Prepare customer data if creating new customer
      let customerDataToSave = undefined;
      if (showCreateCustomer) {
        if (!newCustomerData.name.trim() || !newCustomerData.email.trim()) {
          toast.error('Please enter customer name and email');
          setIsLoading(false);
          return;
        }
        customerDataToSave = newCustomerData;
      }

      // Prepare pilot record
      const pilotRecord = {
        ...onboardingState.config,
        name: pilotData.name,
        company: pilotData.company,
        contactEmail: pilotData.contactEmail,
        location: pilotData.location,
        locationName: pilotData.locationName,
        cameraCount: pilotData.cameraCount,
        startDate: pilotData.startDate,
        status: pilotData.status,
        customerId: selectedCustomerId || undefined,
        assignedUserIds: selectedUserIds,
        createdBy: authState.user.email,
      };

      const result = await createPilot(pilotRecord, customerDataToSave);
      
      if (result.errors && result.errors.length > 0) {
        toast.error(result.errors[0].message);
        setIsLoading(false);
        return;
      }

      if (result.customer) {
        toast.success(`Pilot created with new customer: ${result.customer.name}`);
        // Refresh customers list
        const updatedCustomers = await getAllCustomers();
        setCustomers(updatedCustomers);
        setSelectedCustomerId(result.customer.id);
        setShowCreateCustomer(false);
      } else {
        toast.success('Pilot created successfully!');
      }

      if (enableCustomerLink) {
        const link = generatePilotLink(result.pilot.id);
        setShareableLink(link);
      }
      
      // Navigate to pilot details page
      navigate(`/pilots/${result.pilot.id}`);
    } catch (error) {
      toast.error('Failed to create pilot');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareableLink) {
      toast.error('Please generate a link first');
      return;
    }

    try {
      await copyToClipboard(shareableLink);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
      console.error(error);
    }
  };

  const handleToggleCustomerLink = (enabled: boolean) => {
    setEnableCustomerLink(enabled);
    // Sync data when toggling
    if (enabled && pilotData.name) {
      dispatch({
        type: 'UPDATE_CONFIG',
        payload: { pilotName: pilotData.name },
      });
    } else if (!enabled && onboardingState.config.pilotName) {
      setPilotData(prev => ({
        ...prev,
        name: onboardingState.config.pilotName || prev.name,
      }));
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
      customer.company?.toLowerCase().includes(customerSearchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New Pilot</h1>
              <p className="text-sm text-gray-600 mt-1">
                {enableCustomerLink 
                  ? 'Configure customer onboarding experience and generate shareable link'
                  : 'Set up a new customer pilot project'
                }
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {shareableLink && (
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-lg px-4 py-2">
                  <span className="text-xs text-gray-600 max-w-xs truncate">
                    {shareableLink}
                  </span>
                  <Button size="sm" onClick={handleCopyLink}>
                    📋 Copy
                  </Button>
                </div>
              )}
              <Button onClick={handleCreatePilot} disabled={isLoading}>
                {isLoading 
                  ? '⏳ Creating...' 
                  : enableCustomerLink 
                    ? '✨ Create Pilot & Generate Link' 
                    : '➕ Create Pilot'
                }
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-8 py-8">
        {!enableCustomerLink ? (
          // Full-width enhanced pilot form
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200 space-y-6">
              {/* Basic Pilot Information */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Pilot Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Pilot Name"
                    placeholder="e.g., Retail Security Enhancement"
                    value={pilotData.name}
                    onChange={(e) => setPilotData({...pilotData, name: e.target.value})}
                    required
                  />
                  
                  <Input
                    label="Company"
                    placeholder="Enter customer company name"
                    value={pilotData.company}
                    onChange={(e) => setPilotData({...pilotData, company: e.target.value})}
                    required
                  />
                  
                  <Input
                    label="Contact Email"
                    type="email"
                    placeholder="customer@company.com"
                    value={pilotData.contactEmail}
                    onChange={(e) => setPilotData({...pilotData, contactEmail: e.target.value})}
                    required
                  />
                  
                  <Input
                    label="Start Date"
                    type="date"
                    value={pilotData.startDate}
                    onChange={(e) => setPilotData({...pilotData, startDate: e.target.value})}
                  />
                </div>
              </div>

              {/* Location Information */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Location Name"
                    placeholder="e.g., Downtown Store, Factory Floor 2"
                    value={pilotData.locationName}
                    onChange={(e) => setPilotData({...pilotData, locationName: e.target.value})}
                    required
                  />
                  
                  <Input
                    label="City/Region"
                    placeholder="e.g., Mumbai, Maharashtra"
                    value={pilotData.location}
                    onChange={(e) => setPilotData({...pilotData, location: e.target.value})}
                  />
                  
                  <Input
                    label="Camera Count"
                    placeholder="e.g., 11-to-20"
                    value={pilotData.cameraCount}
                    onChange={(e) => setPilotData({...pilotData, cameraCount: e.target.value})}
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={pilotData.status}
                      onChange={(e) => setPilotData({...pilotData, status: e.target.value as any})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Customer Association */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Association</h3>
                
                <div className="space-y-4">
                  {!showCreateCustomer ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Select Existing Customer
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowCreateCustomer(true)}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          + Create New Customer
                        </button>
                      </div>
                      
                      <input
                        type="text"
                        placeholder="Search customers..."
                        value={customerSearchQuery}
                        onChange={(e) => setCustomerSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 mb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      
                      <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                        {filteredCustomers.length > 0 ? (
                          filteredCustomers.map((customer) => (
                            <label
                              key={customer.id}
                              className={`flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 ${
                                selectedCustomerId === customer.id ? 'bg-blue-50' : ''
                              }`}
                            >
                              <input
                                type="radio"
                                name="customer"
                                value={customer.id}
                                checked={selectedCustomerId === customer.id}
                                onChange={() => setSelectedCustomerId(customer.id)}
                                className="w-4 h-4 text-blue-600"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{customer.name}</div>
                                <div className="text-sm text-gray-500">{customer.email}</div>
                                {customer.company && (
                                  <div className="text-xs text-gray-400">{customer.company}</div>
                                )}
                              </div>
                            </label>
                          ))
                        ) : (
                          <div className="p-4 text-center text-gray-500 text-sm">
                            No customers found
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900">Create New Customer</h4>
                        <button
                          type="button"
                          onClick={() => setShowCreateCustomer(false)}
                          className="text-sm text-gray-600 hover:text-gray-900"
                        >
                          Cancel
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          label="Name"
                          placeholder="John Doe"
                          value={newCustomerData.name}
                          onChange={(e) => setNewCustomerData({...newCustomerData, name: e.target.value})}
                          required
                        />
                        
                        <Input
                          label="Email"
                          type="email"
                          placeholder="john@company.com"
                          value={newCustomerData.email}
                          onChange={(e) => setNewCustomerData({...newCustomerData, email: e.target.value})}
                          required
                        />
                        
                        <Input
                          label="Phone"
                          placeholder="+1 234 567 8900"
                          value={newCustomerData.phone}
                          onChange={(e) => setNewCustomerData({...newCustomerData, phone: e.target.value})}
                        />
                        
                        <Input
                          label="Company"
                          placeholder="Company Name"
                          value={newCustomerData.company}
                          onChange={(e) => setNewCustomerData({...newCustomerData, company: e.target.value})}
                        />
                        
                        <Input
                          label="Title"
                          placeholder="Director of Operations"
                          value={newCustomerData.title}
                          onChange={(e) => setNewCustomerData({...newCustomerData, title: e.target.value})}
                        />
                        
                        <Input
                          label="Timezone"
                          placeholder="EST, PST, CST"
                          value={newCustomerData.timezone}
                          onChange={(e) => setNewCustomerData({...newCustomerData, timezone: e.target.value})}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Assigned Users */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Assigned Users</h3>
                <MultiSelect
                  users={users}
                  selectedUserIds={selectedUserIds}
                  onChange={setSelectedUserIds}
                  placeholder="Select users to assign to this pilot..."
                />
              </div>

              {/* Toggle for Customer Data Collection */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-gray-900">Customer Onboarding Link</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Generate a personalized link to collect camera details from the customer
                    </p>
                  </div>
                  <Toggle
                    enabled={enableCustomerLink}
                    onChange={handleToggleCustomerLink}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Split-screen with preview
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 h-[calc(100vh-160px)]">
            {/* Left: Customer Onboarding Config */}
            <div className="lg:col-span-2 overflow-auto">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                {/* Back to basic mode */}
                <div className="mb-6 pb-4 border-b border-gray-200">
                  <button
                    onClick={() => handleToggleCustomerLink(false)}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to pilot form
                  </button>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900">Customer Welcome Page</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Configure the branding and messaging for the customer-facing onboarding page
                  </p>
                </div>
                
                <ConfigForm />
              </div>
            </div>

            {/* Right: Live Preview */}
            <div className="lg:col-span-3 overflow-hidden">
              <div className="h-full">
                <WelcomePagePreview config={onboardingState.config} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
