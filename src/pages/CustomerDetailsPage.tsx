import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/shared/Button';
import { getAllCustomers, deleteCustomer } from '../utils/customerDb';
import { getPilotsByCustomer } from '../utils/db';
import { getAllUsers } from '../utils/userDb';
import type { Customer } from '../types/customer';
import type { PilotRecord } from '../types/onboarding';
import type { User } from '../types/auth';
import { getStatusBadgeStyle, getStatusDisplayText } from '../types/pilot';
import toast from 'react-hot-toast';

export function CustomerDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [pilots, setPilots] = useState<PilotRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadCustomer();
  }, [id]);

  const loadCustomer = async () => {
    try {
      setIsLoading(true);
      const [customers, allUsers] = await Promise.all([
        getAllCustomers(),
        getAllUsers(),
      ]);
      
      const foundCustomer = customers.find((c) => c.id === id);
      if (foundCustomer) {
        setCustomer(foundCustomer);
        setUsers(allUsers);
        
        // Load pilots for this customer
        const customerPilots = await getPilotsByCustomer(foundCustomer.id);
        setPilots(customerPilots);
      } else {
        toast.error('Customer not found');
        navigate('/customers');
      }
    } catch (error) {
      console.error('Error loading customer:', error);
      toast.error('Failed to load customer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!customer) return;

    try {
      const success = await deleteCustomer(customer.id);
      if (success) {
        toast.success('Customer deleted successfully');
        navigate('/customers');
      } else {
        toast.error('Failed to delete customer');
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Failed to delete customer');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!customer) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/customers')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Customer Details</h1>
              <p className="text-gray-600 mt-1">View and manage customer information</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => navigate(`/customers/${customer.id}/edit`)}>
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Customer
            </Button>
            <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Customer
            </Button>
          </div>
        </div>

        {/* Customer Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-green-600 to-teal-600 px-8 py-12">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl font-bold text-green-600">
                {customer.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <div className="text-white">
                <h2 className="text-3xl font-bold mb-2">{customer.name}</h2>
                <p className="text-green-100 text-lg">{customer.email}</p>
                {customer.title && customer.company && (
                  <p className="text-green-100 mt-1">
                    {customer.title} at {customer.company}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer ID */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Customer ID</label>
                <p className="text-lg text-gray-900">{customer.id}</p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
                <p className="text-lg text-gray-900">{customer.email}</p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                <p className="text-lg text-gray-900">{customer.name}</p>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
                <p className="text-lg text-gray-900">{customer.phone || 'Not provided'}</p>
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Company</label>
                <p className="text-lg text-gray-900">{customer.company || 'Not provided'}</p>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Job Title</label>
                <p className="text-lg text-gray-900">{customer.title || 'Not provided'}</p>
              </div>

              {/* Timezone */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Timezone</label>
                <p className="text-lg text-gray-900">{customer.timezone || 'Not provided'}</p>
              </div>

              {/* Created At */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Created At</label>
                <p className="text-lg text-gray-900">
                  {new Date(customer.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Section (Placeholder) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Associated Pilots</h3>
            <Button 
              size="sm" 
              onClick={() => navigate('/pilots/create')}
            >
              + Create New Pilot
            </Button>
          </div>
          
          {pilots.length > 0 ? (
            <div className="space-y-4">
              {pilots.map((pilot) => {
                const assignedUsers = users.filter(u => pilot.assignedUserIds?.includes(u.id));
                
                return (
                  <div 
                    key={pilot.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
                    onClick={() => navigate(`/pilots/${pilot.id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-lg">{pilot.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{pilot.company}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadgeStyle(pilot.status as any)}`}>
                        {getStatusDisplayText(pilot.status as any)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                      <div>
                        <span className="text-gray-500">Location:</span>
                        <span className="ml-2 text-gray-900 font-medium">{pilot.locationName || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Cameras:</span>
                        <span className="ml-2 text-gray-900 font-medium">{pilot.cameraCount || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Start Date:</span>
                        <span className="ml-2 text-gray-900 font-medium">
                          {new Date(pilot.startDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Created:</span>
                        <span className="ml-2 text-gray-900 font-medium">
                          {new Date(pilot.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    {assignedUsers.length > 0 && (
                      <div className="border-t border-gray-100 pt-3">
                        <span className="text-sm text-gray-500 mb-2 block">Assigned Users:</span>
                        <div className="flex flex-wrap gap-2">
                          {assignedUsers.map(user => (
                            <span 
                              key={user.id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-200"
                            >
                              {user.avatar && (
                                <img src={user.avatar} alt={user.name} className="w-4 h-4 rounded-full" />
                              )}
                              <span className="font-medium">{user.name}</span>
                              <span className="opacity-75">({user.userType})</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500 mb-4">No pilots associated with this customer</p>
              <Button 
                size="sm" 
                variant="secondary"
                onClick={() => navigate('/pilots/create')}
              >
                Create First Pilot
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Customer</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <strong>{customer.name}</strong>? This will permanently remove the customer and all associated data.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                Delete Customer
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
