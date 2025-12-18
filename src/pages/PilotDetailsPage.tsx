import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/shared/Button';
import { Input } from '../components/shared/Input';
import { FileUploadZone } from '../components/shared/FileUploadZone';
import { ImagePreview } from '../components/shared/ImagePreview';
import { useAuth } from '../contexts/AuthContext';
import { getPilotById, updatePilot } from '../utils/db';
import { getObjectivesByPilot, createObjective, updateObjective, deleteObjective, calculatePilotProgress } from '../utils/objectiveDb';
import { getCamerasByPilot, createCamera, updateCamera, deleteCamera, addFrameToCamera, removeFrameFromCamera, setPrimaryFrame } from '../utils/cameraDb';
import { getAssetsByPilot, createAsset, deleteAsset } from '../utils/assetDb';
import { getRemarksByPilot } from '../utils/remarkDb';
import { getAllUsers } from '../utils/userDb';
import { getCustomerByEmail } from '../utils/customerDb';
import type { PilotRecord } from '../types/onboarding';
import type { Objective, ObjectiveStatus, ObjectivePriority } from '../types/objective';
import type { Camera } from '../types/camera';
import type { Asset } from '../types/asset';
import type { Remark } from '../types/remark';
import type { User } from '../types/auth';
import type { CameraStatus } from '../types/camera';
import type { AssetCategory } from '../types/asset';
import { getObjectiveStatusBadgeStyle, getObjectiveStatusDisplayText } from '../types/objective';
import { getCameraStatusBadgeStyle } from '../types/camera';
import { getAssetCategoryIcon, getAssetCategoryColor } from '../types/asset';
import { getRemarkTypeIcon } from '../types/remark';
import { getStatusBadgeStyle } from '../types/pilot';
import toast from 'react-hot-toast';

type Tab = 'overview' | 'objectives' | 'cameras' | 'assets' | 'activity';

export function PilotDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state: authState } = useAuth();
  
  const [pilot, setPilot] = useState<PilotRecord | null>(null);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [remarks, setRemarks] = useState<Remark[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isLoading, setIsLoading] = useState(true);
  
  // Objective form state
  const [showObjectiveForm, setShowObjectiveForm] = useState(false);
  const [newObjective, setNewObjective] = useState({
    title: '',
    description: '',
    priority: 'medium' as ObjectivePriority,
  });
  
  // Camera form state
  const [showCameraForm, setShowCameraForm] = useState(false);
  const [newCamera, setNewCamera] = useState({
    name: '',
    comments: '',
    status: 'planned' as CameraStatus,
  });
  const [selectedCameraForFrames, setSelectedCameraForFrames] = useState<string | null>(null);
  
  // Asset form state
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [newAsset, setNewAsset] = useState({
    category: 'other' as AssetCategory,
    description: '',
    remarks: '',
  });

  // Load pilot data
  const loadPilotData = useCallback(async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      const [pilotData, objectivesData, camerasData, assetsData, remarksData, usersData] = await Promise.all([
        getPilotById(id),
        getObjectivesByPilot(id),
        getCamerasByPilot(id),
        getAssetsByPilot(id),
        getRemarksByPilot(id),
        getAllUsers(),
      ]);
      
      if (!pilotData) {
        toast.error('Pilot not found');
        navigate('/dashboard');
        return;
      }
      
      setPilot(pilotData);
      setObjectives(objectivesData);
      setCameras(camerasData);
      setAssets(assetsData);
      setRemarks(remarksData);
      setUsers(usersData);
      
      // Load customer if available (for future use)
      if (pilotData.customerId && pilotData.contactEmail) {
        getCustomerByEmail(pilotData.contactEmail).catch(console.error);
      }
    } catch (error) {
      console.error('Error loading pilot data:', error);
      toast.error('Failed to load pilot data');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadPilotData();
  }, [loadPilotData]);

  // Auto-update pilot progress based on objectives
  useEffect(() => {
    if (pilot && objectives.length > 0) {
      const progress = calculatePilotProgress(objectives);
      if (progress !== pilot.progress) {
        updatePilot(pilot.id, { progress }).catch(console.error);
      }
    }
  }, [objectives, pilot]);

  const handleCreateObjective = async () => {
    if (!pilot || !authState.user) return;
    
    if (!newObjective.title.trim()) {
      toast.error('Please enter an objective title');
      return;
    }
    
    try {
      const created = await createObjective({
        pilotId: pilot.id,
        title: newObjective.title,
        description: newObjective.description,
        status: 'pending',
        priority: newObjective.priority,
        progress: 0,
        createdBy: authState.user.email,
      });
      
      setObjectives([...objectives, created]);
      setNewObjective({ title: '', description: '', priority: 'medium' });
      setShowObjectiveForm(false);
      toast.success('Objective added');
      await loadPilotData(); // Reload to get activity log
    } catch (error) {
      console.error('Error creating objective:', error);
      toast.error('Failed to create objective');
    }
  };

  const handleUpdateObjectiveStatus = async (objectiveId: string, status: ObjectiveStatus) => {
    if (!authState.user) return;
    
    try {
      const updated = await updateObjective(objectiveId, { 
        status,
        completedAt: status === 'completed' ? new Date().toISOString() : undefined 
      }, authState.user.email);
      
      if (updated) {
        setObjectives(objectives.map(o => o.id === objectiveId ? updated : o));
        await loadPilotData(); // Reload to get activity log
      }
    } catch (error) {
      console.error('Error updating objective:', error);
      toast.error('Failed to update objective');
    }
  };

  const handleDeleteObjective = async (objectiveId: string) => {
    if (!authState.user || !window.confirm('Are you sure you want to delete this objective?')) return;
    
    try {
      await deleteObjective(objectiveId, authState.user.email);
      setObjectives(objectives.filter(o => o.id !== objectiveId));
      toast.success('Objective deleted');
      await loadPilotData(); // Reload to get activity log
    } catch (error) {
      console.error('Error deleting objective:', error);
      toast.error('Failed to delete objective');
    }
  };

  // Camera handlers
  const handleCreateCamera = async () => {
    if (!pilot || !authState.user) return;
    
    if (!newCamera.name.trim()) {
      toast.error('Please enter camera name');
      return;
    }
    
    try {
      const created = await createCamera({
        pilotId: pilot.id,
        name: newCamera.name,
        location: '', // Keep location as empty string for backward compatibility
        status: newCamera.status,
        notes: newCamera.comments || undefined,
        frames: [],
        createdBy: authState.user.email,
      });
      
      setCameras([...cameras, created]);
      setNewCamera({ name: '', comments: '', status: 'planned' });
      setShowCameraForm(false);
      toast.success('Camera added');
    } catch (error) {
      console.error('Error creating camera:', error);
      toast.error('Failed to create camera');
    }
  };

  const handleAddCameraFrames = async (cameraId: string, files: File[]) => {
    if (!authState.user) return;
    
    try {
      let updatedCamera = cameras.find(c => c.id === cameraId);
      if (!updatedCamera) return;
      
      for (const file of files) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        
        const fileUrl = await base64Promise;
        const result = await addFrameToCamera(cameraId, {
          fileName: file.name,
          fileUrl,
          fileSize: file.size,
          isPrimary: updatedCamera.frames.length === 0, // First frame is primary
        });
        
        if (result) updatedCamera = result;
      }
      
      setCameras(cameras.map(c => c.id === cameraId ? updatedCamera! : c));
      toast.success(`${files.length} frame(s) uploaded`);
    } catch (error) {
      console.error('Error adding frames:', error);
      toast.error('Failed to upload frames');
    }
  };

  const handleRemoveFrame = async (cameraId: string, frameId: string) => {
    try {
      const updated = await removeFrameFromCamera(cameraId, frameId);
      if (updated) {
        setCameras(cameras.map(c => c.id === cameraId ? updated : c));
        toast.success('Frame removed');
      }
    } catch (error) {
      console.error('Error removing frame:', error);
      toast.error('Failed to remove frame');
    }
  };

  const handleSetPrimaryFrame = async (cameraId: string, frameId: string) => {
    try {
      const updated = await setPrimaryFrame(cameraId, frameId);
      if (updated) {
        setCameras(cameras.map(c => c.id === cameraId ? updated : c));
        toast.success('Primary frame set');
      }
    } catch (error) {
      console.error('Error setting primary frame:', error);
      toast.error('Failed to set primary frame');
    }
  };

  const handleUpdateCameraStatus = async (cameraId: string, status: CameraStatus) => {
    try {
      const updated = await updateCamera(cameraId, { status });
      if (updated) {
        setCameras(cameras.map(c => c.id === cameraId ? updated : c));
      }
    } catch (error) {
      console.error('Error updating camera:', error);
      toast.error('Failed to update camera');
    }
  };

  const handleUpdateCameraName = async (cameraId: string, name: string) => {
    try {
      const updated = await updateCamera(cameraId, { name });
      if (updated) {
        setCameras(cameras.map(c => c.id === cameraId ? updated : c));
      }
    } catch (error) {
      console.error('Error updating camera:', error);
      toast.error('Failed to update camera');
    }
  };

  const handleUpdateCameraComments = async (cameraId: string, notes: string) => {
    try {
      const updated = await updateCamera(cameraId, { notes });
      if (updated) {
        setCameras(cameras.map(c => c.id === cameraId ? updated : c));
      }
    } catch (error) {
      console.error('Error updating camera:', error);
      toast.error('Failed to update camera');
    }
  };

  const handleDeleteCamera = async (cameraId: string) => {
    if (!window.confirm('Are you sure you want to delete this camera?')) return;
    
    try {
      await deleteCamera(cameraId);
      setCameras(cameras.filter(c => c.id !== cameraId));
      toast.success('Camera deleted');
    } catch (error) {
      console.error('Error deleting camera:', error);
      toast.error('Failed to delete camera');
    }
  };

  // Asset handlers
  const handleUploadAssets = async (files: File[]) => {
    if (!pilot || !authState.user) return;
    
    try {
      const uploadedAssets = [];
      
      for (const file of files) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        
        const fileUrl = await base64Promise;
        const asset = await createAsset({
          pilotId: pilot.id,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileUrl,
          category: newAsset.category,
          description: newAsset.description || undefined,
          remarks: newAsset.remarks || undefined,
          uploadedBy: authState.user.email,
        });
        
        uploadedAssets.push(asset);
      }
      
      setAssets([...assets, ...uploadedAssets]);
      setNewAsset({ category: 'other', description: '', remarks: '' });
      setShowAssetForm(false);
      toast.success(`${uploadedAssets.length} asset(s) uploaded`);
      await loadPilotData(); // Reload to get activity log
    } catch (error) {
      console.error('Error uploading assets:', error);
      toast.error('Failed to upload assets');
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!authState.user || !window.confirm('Are you sure you want to delete this asset?')) return;
    
    try {
      await deleteAsset(assetId, authState.user.email);
      setAssets(assets.filter(a => a.id !== assetId));
      toast.success('Asset deleted');
      await loadPilotData(); // Reload to get activity log
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast.error('Failed to delete asset');
    }
  };

  const handleDownloadAsset = (asset: Asset) => {
    const link = document.createElement('a');
    link.href = asset.fileUrl;
    link.download = asset.fileName;
    link.click();
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

  if (!pilot) {
    return null;
  }

  const progress = calculatePilotProgress(objectives);
  const assignedUsers = users.filter(u => pilot.assignedUserIds?.includes(u.id));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{pilot.name}</h1>
                <p className="text-gray-600 mt-1">{pilot.company}</p>
              </div>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusBadgeStyle(pilot.status as any)}`}>
              {pilot.status}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm font-semibold text-gray-900">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full"
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{objectives.length}</div>
              <div className="text-sm text-gray-600">Objectives</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">{cameras.length}</div>
              <div className="text-sm text-gray-600">Cameras</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{assets.length}</div>
              <div className="text-sm text-gray-600">Assets</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600">{assignedUsers.length}</div>
              <div className="text-sm text-gray-600">Team Members</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex gap-8 px-6">
              {(['overview', 'objectives', 'cameras', 'assets', 'activity'] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Overview content */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Pilot Information</h3>
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Location:</dt>
                          <dd className="font-medium text-gray-900">{pilot.locationName}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600">City/Region:</dt>
                          <dd className="font-medium text-gray-900">{pilot.location || 'N/A'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Start Date:</dt>
                          <dd className="font-medium text-gray-900">{new Date(pilot.startDate).toLocaleDateString()}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Camera Count:</dt>
                          <dd className="font-medium text-gray-900">{pilot.cameraCount || 'TBD'}</dd>
                        </div>
                      </dl>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Team</h3>
                      <div className="space-y-2">
                        {assignedUsers.map((user) => (
                          <div key={user.id} className="flex items-center gap-2">
                            {user.avatar && <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full" />}
                            <span className="text-sm">{user.name}</span>
                            <span className="text-xs text-gray-500">({user.userType})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recent Objectives */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Recent Objectives</h3>
                    <div className="space-y-2">
                      {objectives.slice(0, 3).map((obj) => (
                        <div key={obj.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium">{obj.title}</span>
                          <span className={`px-2 py-1 text-xs rounded-full border ${getObjectiveStatusBadgeStyle(obj.status)}`}>
                            {getObjectiveStatusDisplayText(obj.status)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'objectives' && (
                <motion.div
                  key="objectives"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Objectives</h3>
                    <Button size="sm" onClick={() => setShowObjectiveForm(!showObjectiveForm)}>
                      {showObjectiveForm ? 'Cancel' : '+ Add Objective'}
                    </Button>
                  </div>

                  {showObjectiveForm && (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <Input
                        label="Title"
                        placeholder="e.g., Wait time reduction"
                        value={newObjective.title}
                        onChange={(e) => setNewObjective({ ...newObjective, title: e.target.value })}
                      />
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                        <textarea
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={3}
                          placeholder="Add details..."
                          value={newObjective.description}
                          onChange={(e) => setNewObjective({ ...newObjective, description: e.target.value })}
                        />
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button onClick={handleCreateObjective}>Add Objective</Button>
                        <Button variant="secondary" onClick={() => setShowObjectiveForm(false)}>Cancel</Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {objectives.map((obj) => (
                      <div key={obj.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{obj.title}</h4>
                            {obj.description && <p className="text-sm text-gray-600 mt-1">{obj.description}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={obj.status}
                              onChange={(e) => handleUpdateObjectiveStatus(obj.id, e.target.value as ObjectiveStatus)}
                              className="text-sm border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="pending">Pending</option>
                              <option value="in-progress">In Progress</option>
                              <option value="completed">Completed</option>
                              <option value="blocked">Blocked</option>
                            </select>
                            <button
                              onClick={() => handleDeleteObjective(obj.id)}
                              className="text-red-600 hover:text-red-700 p-1"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'cameras' && (
                <motion.div
                  key="cameras"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Cameras ({cameras.length})</h3>
                    <Button onClick={() => setShowCameraForm(!showCameraForm)}>
                      {showCameraForm ? 'Cancel' : '+ Add Camera'}
                    </Button>
                  </div>

                  {showCameraForm && (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <h4 className="font-medium text-gray-900 mb-3">New Camera</h4>
                      <div className="mb-3">
                        <Input
                          label="Camera Name"
                          placeholder="e.g., Entrance Camera"
                          value={newCamera.name}
                          onChange={(e) => setNewCamera({ ...newCamera, name: e.target.value })}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Comments (Optional)</label>
                        <textarea
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={2}
                          placeholder="Add any description or notes about this camera..."
                          value={newCamera.comments}
                          onChange={(e) => setNewCamera({ ...newCamera, comments: e.target.value })}
                        />
                      </div>
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                          value={newCamera.status}
                          onChange={(e) => setNewCamera({ ...newCamera, status: e.target.value as CameraStatus })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="planned">Planned</option>
                          <option value="installed">Installed</option>
                          <option value="configured">Configured</option>
                          <option value="active">Active</option>
                          <option value="issue">Issue</option>
                        </select>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button onClick={handleCreateCamera}>Add Camera</Button>
                        <Button variant="secondary" onClick={() => setShowCameraForm(false)}>Cancel</Button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {cameras.map((camera) => (
                      <div key={camera.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={camera.name}
                              onChange={(e) => handleUpdateCameraName(camera.id, e.target.value)}
                              className="text-lg font-semibold text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none w-full mb-2"
                            />
                            <textarea
                              value={camera.notes || ''}
                              onChange={(e) => handleUpdateCameraComments(camera.id, e.target.value)}
                              placeholder="Add comments or description..."
                              className="text-sm text-gray-600 bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none w-full rounded px-2 py-1"
                              rows={2}
                            />
                          </div>
                          <button
                            onClick={() => handleDeleteCamera(camera.id)}
                            className="text-red-600 hover:text-red-700 p-1"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                          <select
                            value={camera.status}
                            onChange={(e) => handleUpdateCameraStatus(camera.id, e.target.value as CameraStatus)}
                            className={`text-sm px-3 py-1 rounded border ${getCameraStatusBadgeStyle(camera.status)}`}
                          >
                            <option value="planned">Planned</option>
                            <option value="installed">Installed</option>
                            <option value="configured">Configured</option>
                            <option value="active">Active</option>
                            <option value="issue">Issue</option>
                          </select>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700">
                              Frames ({camera.frames.length})
                            </label>
                            <button
                              onClick={() => setSelectedCameraForFrames(
                                selectedCameraForFrames === camera.id ? null : camera.id
                              )}
                              className="text-xs text-blue-600 hover:text-blue-700"
                            >
                              {selectedCameraForFrames === camera.id ? 'Close' : '+ Add Frames'}
                            </button>
                          </div>

                          {selectedCameraForFrames === camera.id && (
                            <div className="mb-3">
                              <FileUploadZone
                                onFilesSelected={(files) => handleAddCameraFrames(camera.id, files)}
                                accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] }}
                                multiple={true}
                              />
                            </div>
                          )}

                          {camera.frames.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                              {camera.frames.map((frame) => (
                                <ImagePreview
                                  key={frame.id}
                                  src={frame.fileUrl}
                                  alt={frame.fileName}
                                  isPrimary={frame.isPrimary}
                                  onSetPrimary={() => handleSetPrimaryFrame(camera.id, frame.id)}
                                  onRemove={() => handleRemoveFrame(camera.id, frame.id)}
                                />
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 italic">No frames uploaded</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {cameras.length === 0 && !showCameraForm && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-500">No cameras added yet</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'assets' && (
                <motion.div
                  key="assets"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Assets ({assets.length})</h3>
                    <Button onClick={() => setShowAssetForm(!showAssetForm)}>
                      {showAssetForm ? 'Cancel' : '+ Upload Assets'}
                    </Button>
                  </div>

                  {showAssetForm && (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 space-y-4">
                      <h4 className="font-medium text-gray-900">Upload Assets</h4>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <select
                          value={newAsset.category}
                          onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value as AssetCategory })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="contract">Contract</option>
                          <option value="diagram">Diagram</option>
                          <option value="photo">Photo</option>
                          <option value="report">Report</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                        <Input
                          placeholder="Brief description..."
                          value={newAsset.description}
                          onChange={(e) => setNewAsset({ ...newAsset, description: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Remarks (Optional)</label>
                        <textarea
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={2}
                          placeholder="Additional notes..."
                          value={newAsset.remarks}
                          onChange={(e) => setNewAsset({ ...newAsset, remarks: e.target.value })}
                        />
                      </div>

                      <FileUploadZone
                        onFilesSelected={handleUploadAssets}
                        accept={{
                          'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
                          'application/pdf': ['.pdf'],
                          'application/msword': ['.doc', '.docx'],
                          'application/vnd.ms-excel': ['.xls', '.xlsx'],
                          'text/*': ['.txt', '.csv'],
                        }}
                        multiple={true}
                        maxSize={50 * 1024 * 1024}
                      >
                        <div className="space-y-2">
                          <div className="text-4xl">📎</div>
                          <p className="text-gray-700 font-medium">
                            Drag & drop files here, or click to select
                          </p>
                          <p className="text-sm text-gray-500">
                            Multiple files supported • Max 50MB per file
                          </p>
                          <p className="text-xs text-gray-400">
                            Supports: Images, PDFs, Documents, Spreadsheets
                          </p>
                        </div>
                      </FileUploadZone>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {assets.map((asset) => (
                      <div key={asset.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <span className={`text-xs px-2 py-1 rounded border ${getAssetCategoryColor(asset.category)}`}>
                            {getAssetCategoryIcon(asset.category)} {asset.category}
                          </span>
                          <button
                            onClick={() => handleDeleteAsset(asset.id)}
                            className="text-red-600 hover:text-red-700 p-1"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>

                        {asset.fileType.startsWith('image/') && (
                          <img
                            src={asset.fileUrl}
                            alt={asset.fileName}
                            className="w-full h-32 object-cover rounded mb-3"
                          />
                        )}

                        <h4 className="font-medium text-gray-900 text-sm mb-1 truncate" title={asset.fileName}>
                          {asset.fileName}
                        </h4>
                        
                        {asset.description && (
                          <p className="text-xs text-gray-600 mb-2">{asset.description}</p>
                        )}
                        
                        {asset.remarks && (
                          <p className="text-xs text-gray-500 italic mb-2">"{asset.remarks}"</p>
                        )}

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                          <span className="text-xs text-gray-500">
                            {(asset.fileSize / 1024).toFixed(1)} KB
                          </span>
                          <button
                            onClick={() => handleDownloadAsset(asset)}
                            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {assets.length === 0 && !showAssetForm && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-500">No assets uploaded yet</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'activity' && (
                <motion.div
                  key="activity"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {remarks.filter(r => r.isSystem).map((remark) => {
                    const user = users.find(u => u.email === remark.createdBy);
                    const userName = user ? user.name : remark.createdBy;
                    
                    return (
                      <div key={remark.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <span className="text-xl">{getRemarkTypeIcon(remark.type)}</span>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">
                            <span className="font-medium text-blue-600">{userName}</span> {remark.text}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(remark.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {remarks.filter(r => r.isSystem).length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No activity yet</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
