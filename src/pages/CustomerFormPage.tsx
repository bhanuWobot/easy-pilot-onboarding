import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/shared/Button';
import { Input } from '../components/shared/Input';
import { createCustomer, updateCustomer, getAllCustomers } from '../utils/customerDb';
import toast from 'react-hot-toast';

interface FormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  title: string;
  timezone: string;
}

export function CustomerFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    title: '',
    timezone: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingCustomer, setIsFetchingCustomer] = useState(isEditMode);

  useEffect(() => {
    if (isEditMode) {
      loadCustomer();
    }
  }, [id, isEditMode]);

  const loadCustomer = async () => {
    try {
      setIsFetchingCustomer(true);
      const customers = await getAllCustomers();
      const customer = customers.find((c) => c.id === id);
      if (customer) {
        setFormData({
          name: customer.name,
          email: customer.email,
          phone: customer.phone || '',
          company: customer.company || '',
          title: customer.title || '',
          timezone: customer.timezone || '',
        });
      } else {
        toast.error('Customer not found');
        navigate('/customers');
      }
    } catch (error) {
      console.error('Error loading customer:', error);
      toast.error('Failed to load customer');
    } finally {
      setIsFetchingCustomer(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsLoading(true);

    try {
      if (isEditMode && id) {
        // Update existing customer
        const customerData = {
          name: formData.name,
          email: formData.email,
          ...(formData.phone && { phone: formData.phone }),
          ...(formData.company && { company: formData.company }),
          ...(formData.title && { title: formData.title }),
          ...(formData.timezone && { timezone: formData.timezone }),
        };
        const updated = await updateCustomer(id, customerData);
        if (updated) {
          toast.success('Customer updated successfully');
          navigate(`/customers/${id}`);
        } else {
          toast.error('Failed to update customer');
        }
      } else {
        // Create new customer
        const customerData = {
          name: formData.name,
          email: formData.email,
          ...(formData.phone && { phone: formData.phone }),
          ...(formData.company && { company: formData.company }),
          ...(formData.title && { title: formData.title }),
          ...(formData.timezone && { timezone: formData.timezone }),
        };
        const newCustomer = await createCustomer(customerData);
        toast.success('Customer created successfully');
        navigate(`/customers/${newCustomer.id}`);
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      toast.error(isEditMode ? 'Failed to update customer' : 'Failed to create customer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (isFetchingCustomer) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(isEditMode ? `/customers/${id}` : '/customers')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditMode ? 'Edit Customer' : 'Create New Customer'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEditMode ? 'Update customer information' : 'Add a new customer to the system'}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter full name"
                error={errors.name}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="customer@example.com"
                error={errors.email}
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number (Optional)
              </label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="555-123-4567"
              />
            </div>

            {/* Company */}
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                Company (Optional)
              </label>
              <Input
                id="company"
                type="text"
                value={formData.company}
                onChange={(e) => handleChange('company', e.target.value)}
                placeholder="Company name"
              />
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Job Title (Optional)
              </label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g., Director of Operations"
              />
            </div>

            {/* Timezone */}
            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-2">
                Timezone (Optional)
              </label>
              <Input
                id="timezone"
                type="text"
                value={formData.timezone}
                onChange={(e) => handleChange('timezone', e.target.value)}
                placeholder="e.g., CST, PST, EST"
              />
              <p className="mt-1 text-sm text-gray-500">
                Customer's preferred timezone
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 justify-end mt-8 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(isEditMode ? `/customers/${id}` : '/customers')}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>{isEditMode ? 'Update Customer' : 'Create Customer'}</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
