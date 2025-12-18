import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useOnboardingBuilder } from '../contexts/OnboardingBuilderContext';
import { ConfigForm } from '../components/builder/ConfigForm';
import { WelcomePagePreview } from '../components/preview/WelcomePagePreview';
import { copyToClipboard } from '../utils/linkGenerator';
import { createPilot, generatePilotLink } from '../utils/db';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/shared/Button';
import { Input } from '../components/shared/Input';
import { Toggle } from '../components/shared/Toggle';

export function LinkGeneratorPage() {
  const { state: onboardingState, dispatch } = useOnboardingBuilder();
  const { state: authState } = useAuth();
  const [shareableLink, setShareableLink] = useState('');
  
  // New state for customer data collection mode
  const [enableCustomerLink, setEnableCustomerLink] = useState(false);
  
  // Basic pilot fields (internal use)
  const [pilotData, setPilotData] = useState({
    companyName: '',
    contactEmail: '',
    internalNotes: '',
    expectedCameras: '',
  });

  // Sync company name between basic form and config form
  useEffect(() => {
    if (enableCustomerLink && pilotData.companyName) {
      dispatch({
        type: 'UPDATE_CONFIG',
        payload: { pilotName: pilotData.companyName },
      });
    }
  }, [enableCustomerLink, pilotData.companyName, dispatch]);

  const handleCreatePilot = async () => {
    if (!authState.user) {
      toast.error('User not authenticated');
      return;
    }

    try {
      if (enableCustomerLink) {
        // Validate customer onboarding config
        if (!onboardingState.config.pilotName.trim()) {
          toast.error('Please enter a pilot/company name');
          return;
        }
        
        const pilot = await createPilot(onboardingState.config, authState.user.email);
        const link = generatePilotLink(pilot.id);
        setShareableLink(link);
        toast.success('Pilot created with customer onboarding link!');
      } else {
        // Validate basic pilot
        if (!pilotData.companyName.trim()) {
          toast.error('Please enter a company name');
          return;
        }
        
        const basicConfig = {
          ...onboardingState.config,
          pilotName: pilotData.companyName,
        };
        await createPilot(basicConfig, authState.user.email);
        toast.success('Pilot created successfully!');
        // Reset form
        setPilotData({
          companyName: '',
          contactEmail: '',
          internalNotes: '',
          expectedCameras: '',
        });
      }
    } catch (error) {
      toast.error('Failed to create pilot');
      console.error(error);
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
    if (enabled && pilotData.companyName) {
      dispatch({
        type: 'UPDATE_CONFIG',
        payload: { pilotName: pilotData.companyName },
      });
    } else if (!enabled && onboardingState.config.pilotName) {
      setPilotData(prev => ({
        ...prev,
        companyName: onboardingState.config.pilotName || prev.companyName,
      }));
    }
  };

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
              <Button onClick={handleCreatePilot}>
                {enableCustomerLink ? '✨ Create Pilot & Generate Link' : '➕ Create Pilot'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-8 py-8">
        {!enableCustomerLink ? (
          // Full-width basic pilot form
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Pilot Information</h2>
                
                <div className="space-y-4">
                  <Input
                    label="Company Name"
                    placeholder="Enter customer company name"
                    value={pilotData.companyName}
                    onChange={(e) => setPilotData({...pilotData, companyName: e.target.value})}
                    required
                  />
                  
                  <Input
                    label="Contact Email"
                    type="email"
                    placeholder="customer@company.com"
                    value={pilotData.contactEmail}
                    onChange={(e) => setPilotData({...pilotData, contactEmail: e.target.value})}
                  />
                  
                  <Input
                    label="Expected Cameras"
                    type="number"
                    placeholder="e.g., 10"
                    value={pilotData.expectedCameras}
                    onChange={(e) => setPilotData({...pilotData, expectedCameras: e.target.value})}
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Internal Notes
                    </label>
                    <textarea
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={4}
                      placeholder="Add any internal notes about this pilot..."
                      value={pilotData.internalNotes}
                      onChange={(e) => setPilotData({...pilotData, internalNotes: e.target.value})}
                    />
                  </div>
                </div>
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
                    Back to basic pilot form
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
