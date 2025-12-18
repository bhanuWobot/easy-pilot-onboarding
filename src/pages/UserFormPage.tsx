import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/shared/Button';
import { Input } from '../components/shared/Input';
import { createUser, updateUser, getAllUsers } from '../utils/userDb';
import toast from 'react-hot-toast';

interface FormData {
  name: string;
  email: string;
  role: 'admin' | 'user';
  userType: 'Platform' | 'Partner';
  avatar: string;
}

export function UserFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    role: 'user',
    userType: 'Platform',
    avatar: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingUser, setIsFetchingUser] = useState(isEditMode);

  useEffect(() => {
    if (isEditMode) {
      loadUser();
    }
  }, [id, isEditMode]);

  const loadUser = async () => {
    try {
      setIsFetchingUser(true);
      const users = await getAllUsers();
      const user = users.find((u) => u.id === id);
      if (user) {
        setFormData({
          name: user.name,
          email: user.email,
          role: user.role,
          userType: user.userType,
          avatar: user.avatar || '',
        });
      } else {
        toast.error('User not found');
        navigate('/users');
      }
    } catch (error) {
      console.error('Error loading user:', error);
      toast.error('Failed to load user');
    } finally {
      setIsFetchingUser(false);
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
        // Update existing user
        const updated = await updateUser(id, formData);
        if (updated) {
          toast.success('User updated successfully');
          navigate(`/users/${id}`);
        } else {
          toast.error('Failed to update user');
        }
      } else {
        // Create new user
        const userData = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          userType: formData.userType,
          ...(formData.avatar && { avatar: formData.avatar }),
        };
        const newUser = await createUser(userData);
        toast.success('User created successfully');
        navigate(`/users/${newUser.id}`);
      }
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(isEditMode ? 'Failed to update user' : 'Failed to create user');
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

  if (isFetchingUser) {
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
            onClick={() => navigate(isEditMode ? `/users/${id}` : '/users')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditMode ? 'Edit User' : 'Create New User'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEditMode ? 'Update user information' : 'Add a new user to the system'}
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
                placeholder="user@example.com"
                error={errors.email}
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => handleChange('role', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Admins have full access to all features
              </p>
            </div>

            {/* User Type */}
            <div>
              <label htmlFor="userType" className="block text-sm font-medium text-gray-700 mb-2">
                User Type
              </label>
              <select
                id="userType"
                value={formData.userType}
                onChange={(e) => handleChange('userType', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="Platform">Platform</option>
                <option value="Partner">Partner</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Platform users are internal staff, Partners are external users
              </p>
            </div>

            {/* Avatar URL */}
            <div>
              <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 mb-2">
                Avatar URL (Optional)
              </label>
              <Input
                id="avatar"
                type="url"
                value={formData.avatar}
                onChange={(e) => handleChange('avatar', e.target.value)}
                placeholder="https://example.com/avatar.jpg"
              />
              <p className="mt-1 text-sm text-gray-500">
                Leave empty to use default avatar based on initials
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 justify-end mt-8 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(isEditMode ? `/users/${id}` : '/users')}
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
                <>{isEditMode ? 'Update User' : 'Create User'}</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
