/**
 * Pilots List Page
 * Shows all pilots assigned to the logged-in user
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { PilotCard } from '../components/dashboard/PilotCard';
import { Button } from '../components/shared/Button';
import { useAuth } from '../contexts/AuthContext';
import { getAllPilots } from '../utils/db';
import type { PilotRecord } from '../types/onboarding';
import toast from 'react-hot-toast';

export function PilotsPage() {
  const { state: authState } = useAuth();
  const [pilots, setPilots] = useState<PilotRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadPilots();
  }, []);

  const loadPilots = async () => {
    try {
      setIsLoading(true);
      const allPilots = await getAllPilots();
      
      // Filter pilots assigned to the current user
      const userPilots = allPilots.filter(pilot => {
        // Show all pilots if admin, otherwise only assigned pilots
        if (authState.user?.role === 'admin') {
          return true;
        }
        return pilot.assignedUserIds?.includes(authState.user?.id || '');
      });
      
      // Sort by most recently updated
      userPilots.sort((a, b) => 
        new Date(b.updatedAt || b.createdAt).getTime() - 
        new Date(a.updatedAt || a.createdAt).getTime()
      );
      
      setPilots(userPilots);
    } catch (error) {
      console.error('Error loading pilots:', error);
      toast.error('Failed to load pilots');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter pilots based on search and status
  const filteredPilots = pilots.filter(pilot => {
    const matchesSearch = 
      (pilot.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pilot.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pilot.contactEmail || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || pilot.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: pilots.length,
    active: pilots.filter(p => p.status === 'active').length,
    inProgress: pilots.filter(p => p.status === 'draft').length,
    completed: pilots.filter(p => p.status === 'completed').length,
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h2 className="text-3xl font-bold text-gray-900">My Pilots</h2>
            <p className="text-gray-600 mt-1">
              {pilots.length} pilot{pilots.length !== 1 ? 's' : ''} assigned to you
            </p>
          </div>
          
          <Link to="/pilots/create">
            <Button variant="primary" className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Pilot
            </Button>
          </Link>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <button
            onClick={() => setStatusFilter('all')}
            className={`bg-white rounded-xl shadow-md border p-6 text-left transition-all hover:shadow-lg ${
              statusFilter === 'all' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pilots</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </button>

          <button
            onClick={() => setStatusFilter('active')}
            className={`bg-white rounded-xl shadow-md border p-6 text-left transition-all hover:shadow-lg ${
              statusFilter === 'active' ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.active}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </button>

          <button
            onClick={() => setStatusFilter('draft')}
            className={`bg-white rounded-xl shadow-md border p-6 text-left transition-all hover:shadow-lg ${
              statusFilter === 'draft' ? 'border-gray-500 ring-2 ring-gray-200' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Draft</p>
                <p className="text-3xl font-bold text-gray-600 mt-2">{stats.inProgress}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </button>

          <button
            onClick={() => setStatusFilter('completed')}
            className={`bg-white rounded-xl shadow-md border p-6 text-left transition-all hover:shadow-lg ${
              statusFilter === 'completed' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </button>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-6"
        >
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, company, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </motion.div>

        {/* Pilots Grid */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          {filteredPilots.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPilots.map((pilot, index) => (
                <motion.div
                  key={pilot.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.4 + index * 0.05 }}
                >
                  <PilotCard pilot={pilot} onDelete={loadPilots} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm || statusFilter !== 'all' ? 'No pilots found' : 'No pilots yet'}
              </h4>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Get started by creating your first pilot'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Link to="/pilots/create">
                  <Button variant="primary">Create Pilot</Button>
                </Link>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
