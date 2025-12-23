import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/shared/Button';
import { ROICanvas, type DrawingTool } from '../components/objective/ROICanvas';
import { ROIProfileModal } from '../components/objective/ROIProfileModal';
import { ROIProfileChips } from '../components/objective/ROIProfileChips';
import { ROIToolbar } from '../components/objective/ROIToolbar';
import type { Objective } from '../types/objective';
import type { Camera, StoredCameraFrame } from '../types/camera';
import type { ROIProfile, ROIDrawing } from '../types/roi';
import type { Location } from '../types/location';
import { getObjectivesByPilot, updateObjective } from '../utils/objectiveDb';
import { getCamerasByPilot } from '../utils/cameraDb';
import { getLocationsByIds } from '../utils/locationDb';
import {
  getROIProfilesByObjectiveCamera,
  createROIProfile,
  deleteROIProfile,
  toggleProfileVisibility,
  setProfilesVisibility,
  addDrawingToProfile,
  updateDrawing,
  deleteDrawing,
} from '../utils/roiDb';
import { getPilotById } from '../utils/db';
import { useAuth } from '../contexts/AuthContext';
import type { PilotRecord } from '../types/onboarding';
import toast from 'react-hot-toast';

export function ObjectiveDetailsPage() {
  const { pilotId, objectiveId } = useParams<{ pilotId: string; objectiveId: string }>();
  const navigate = useNavigate();
  const { state: authState } = useAuth();

  const [objective, setObjective] = useState<Objective | null>(null);
  const [pilot, setPilot] = useState<PilotRecord | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<StoredCameraFrame | null>(null);
  const [roiProfiles, setRoiProfiles] = useState<ROIProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<ROIProfile | null>(null);
  const [activeTool, setActiveTool] = useState<DrawingTool>('select');
  const [selectedColor, setSelectedColor] = useState<string>('#3B82F6');
  const [selectedDrawing, setSelectedDrawing] = useState<ROIDrawing | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCommentPopover, setShowCommentPopover] = useState(false);
  const [commentPosition, setCommentPosition] = useState({ x: 0, y: 0 });
  const [commentText, setCommentText] = useState('');
  
  // Usecase state
  const [usecase, setUsecase] = useState<string>('');
  const [isEditingUsecase, setIsEditingUsecase] = useState(false);
  
  // Success Criteria state
  const [successCriteria, setSuccessCriteria] = useState<{ targetPercentage: number; description: string }>({
    targetPercentage: 90,
    description: ''
  });
  const [isEditingSuccessCriteria, setIsEditingSuccessCriteria] = useState(false);
  
  // ROI changes tracking
  const [pendingChanges, setPendingChanges] = useState<{
    type: 'add' | 'update' | 'delete';
    profileId: string;
    drawing?: Omit<ROIDrawing, 'id' | 'createdAt' | 'updatedAt'> | ROIDrawing;
    drawingId?: string;
    updates?: Partial<ROIDrawing>;
  }[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Checklist states
  type ChecklistItem = {
    id: string;
    title: string;
    description: string;
    completed: boolean;
  };
  
  const [checklists, setChecklists] = useState<ChecklistItem[]>([
    {
      id: '1',
      title: 'Verify camera installation location',
      description: 'Ensure camera is mounted at the correct height and angle',
      completed: false,
    },
    {
      id: '2',
      title: 'Configure network settings',
      description: 'Set up IP address, subnet mask, and gateway',
      completed: true,
    },
    {
      id: '3',
      title: 'Test camera feed quality',
      description: 'Check for clear image, proper lighting, and frame rate',
      completed: false,
    },
    {
      id: '4',
      title: 'Set up recording schedule',
      description: 'Configure continuous or motion-based recording',
      completed: false,
    },
  ]);
  const [aiChecklists, setAiChecklists] = useState<ChecklistItem[]>([
    {
      id: 'ai1',
      title: 'Optimize ROI coverage',
      description: 'AI detected potential blind spots in current ROI setup',
      completed: false,
    },
    {
      id: 'ai2',
      title: 'Adjust lighting conditions',
      description: 'Consider adding supplemental lighting for better detection accuracy',
      completed: false,
    },
    {
      id: 'ai3',
      title: 'Review detection zones',
      description: 'Current zones may overlap, consider consolidating',
      completed: true,
    },
    {
      id: 'ai4',
      title: 'Calibrate for peak hours',
      description: 'Fine-tune sensitivity for high-traffic periods',
      completed: false,
    },
    {
      id: 'ai5',
      title: 'Enable advanced analytics',
      description: 'System is ready for object classification and tracking',
      completed: false,
    },
  ]);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [checklistType, setChecklistType] = useState<'regular' | 'ai'>('regular');
  const [newChecklistItem, setNewChecklistItem] = useState({ title: '', description: '' });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pilotId, objectiveId]);

  const loadData = async () => {
    if (!pilotId || !objectiveId) {
      toast.error('Invalid URL parameters');
      navigate('/dashboard');
      return;
    }

    setIsLoading(true);
    try {
      // Load pilot
      const pilotData = await getPilotById(pilotId);
      if (!pilotData) {
        toast.error('Pilot not found');
        navigate('/dashboard');
        return;
      }
      setPilot(pilotData);

      // Load objective
      const objectivesData = await getObjectivesByPilot(pilotId);
      const objectiveData = objectivesData.find(obj => obj.id === objectiveId);
      if (!objectiveData) {
        toast.error('Objective not found');
        navigate(`/pilots/${pilotId}`);
        return;
      }
      setObjective(objectiveData);
      setUsecase(objectiveData.usecase || '');
      
      // Load success criteria
      if (objectiveData.successCriteria) {
        setSuccessCriteria(objectiveData.successCriteria);
      }

      // Load locations for this pilot
      if (pilotData.locationIds && pilotData.locationIds.length > 0) {
        const locationsData = await getLocationsByIds(pilotData.locationIds);
        setLocations(locationsData);
        
        // Auto-select first location
        if (locationsData.length > 0) {
          const firstLocation = locationsData[0];
          setSelectedLocation(firstLocation);
        }
      }

      // Load cameras for this pilot
      const camerasData = await getCamerasByPilot(pilotId);
      
      // Filter cameras that have primary frames
      const camerasWithFrames = camerasData.filter(
        camera => camera.frames && camera.frames.length > 0
      );
      setCameras(camerasWithFrames);

      // Auto-select first camera of first location if available
      if (camerasWithFrames.length > 0 && pilotData.locationIds && pilotData.locationIds.length > 0) {
        const locationsData = await getLocationsByIds(pilotData.locationIds);
        if (locationsData.length > 0) {
          const firstLocation = locationsData[0];
          const locationCameras = camerasWithFrames.filter(c => c.locationId === firstLocation.id);
          
          if (locationCameras.length > 0) {
            const firstCamera = locationCameras[0];
            setSelectedCamera(firstCamera);
            
            // Get primary frame or first frame
            const primaryFrame = firstCamera.frames.find(f => f.isPrimary) || firstCamera.frames[0];
            setSelectedFrame(primaryFrame);

            // Load ROI profiles for this camera
            await loadROIProfiles(objectiveId, firstCamera.id);
          }
        }
      }
    } catch (error) {
      console.error('Error loading objective details:', error);
      toast.error('Failed to load objective details');
    } finally {
      setIsLoading(false);
    }
  };

  const loadROIProfiles = async (objId: string, cameraId: string) => {
    try {
      const profiles = await getROIProfilesByObjectiveCamera(objId, cameraId);
      setRoiProfiles(profiles);
    } catch (error) {
      console.error('Error loading ROI profiles:', error);
      toast.error('Failed to load ROI profiles');
    }
  };

  const handleCameraSelect = async (camera: Camera) => {
    // Check for unsaved changes
    if (hasUnsavedChanges) {
      const confirmSwitch = window.confirm(
        'You have unsaved ROI changes. Switching cameras will discard these changes. Continue?'
      );
      if (!confirmSwitch) return;
    }

    setSelectedCamera(camera);
    
    // Get primary frame or first frame
    const primaryFrame = camera.frames.find(f => f.isPrimary) || camera.frames[0];
    setSelectedFrame(primaryFrame);

    // Reset tool and selection
    setActiveTool('select');
    setActiveProfile(null);
    setSelectedDrawing(null);
    
    // Clear pending changes
    setPendingChanges([]);
    setHasUnsavedChanges(false);

    // Load ROI profiles for this camera
    if (objectiveId) {
      await loadROIProfiles(objectiveId, camera.id);
    }
  };

  const handleLocationSelect = async (location: Location) => {
    // Check for unsaved changes
    if (hasUnsavedChanges) {
      const confirmSwitch = window.confirm(
        'You have unsaved ROI changes. Switching locations will discard these changes. Continue?'
      );
      if (!confirmSwitch) return;
    }

    setSelectedLocation(location);
    
    // Find cameras for this location
    const locationCameras = cameras.filter(c => c.locationId === location.id);
    
    if (locationCameras.length > 0) {
      const firstCamera = locationCameras[0];
      setSelectedCamera(firstCamera);
      
      const primaryFrame = firstCamera.frames.find(f => f.isPrimary) || firstCamera.frames[0];
      setSelectedFrame(primaryFrame);

      // Reset states
      setActiveTool('select');
      setActiveProfile(null);
      setSelectedDrawing(null);
      setPendingChanges([]);
      setHasUnsavedChanges(false);

      // Load ROI profiles for this camera
      if (objectiveId) {
        await loadROIProfiles(objectiveId, firstCamera.id);
      }
    } else {
      // No cameras for this location
      setSelectedCamera(null);
      setSelectedFrame(null);
      setRoiProfiles([]);
      setActiveProfile(null);
      setPendingChanges([]);
      setHasUnsavedChanges(false);
    }
  };

  const handleSaveUsecase = async () => {
    if (!objective || !authState.user) return;

    try {
      await updateObjective(objective.id, { usecase }, authState.user.id);
      setObjective({ ...objective, usecase });
      setIsEditingUsecase(false);
      toast.success('Use case saved');
    } catch {
      toast.error('Failed to save use case');
    }
  };

  const handleSaveSuccessCriteria = async () => {
    if (!objective || !authState.user) return;

    if (!successCriteria.description.trim()) {
      toast.error('Please enter a success criteria description');
      return;
    }

    if (successCriteria.targetPercentage < 1 || successCriteria.targetPercentage > 100) {
      toast.error('Target percentage must be between 1 and 100');
      return;
    }

    try {
      await updateObjective(objective.id, { successCriteria }, authState.user.id);
      setObjective({ ...objective, successCriteria });
      setIsEditingSuccessCriteria(false);
      toast.success('Success criteria saved');
    } catch {
      toast.error('Failed to save success criteria');
    }
  };

  const handleCreateProfile = async (name: string) => {
    if (!objectiveId || !selectedCamera || !authState.user) return;

    try {
      const newProfile = await createROIProfile({
        objectiveId,
        cameraId: selectedCamera.id,
        name,
        createdBy: authState.user.email,
      });

      setRoiProfiles([...roiProfiles, newProfile]);
      setActiveProfile(newProfile);
      setActiveTool('rectangle'); // Auto-select rectangle tool
      toast.success(`ROI profile "${name}" created`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create ROI profile';
      toast.error(message);
    }
  };

  const handleToggleProfile = async (profileId: string) => {
    try {
      const updatedProfile = await toggleProfileVisibility(profileId);
      if (updatedProfile) {
        setRoiProfiles(
          roiProfiles.map((p) => (p.id === profileId ? updatedProfile : p))
        );
        
        // Set as active profile if it's being made visible
        if (updatedProfile.visible) {
          setActiveProfile(updatedProfile);
          if (activeTool === 'none') {
            setActiveTool('select');
          }
        } else if (activeProfile?.id === profileId) {
          // Deactivate if current active profile is being hidden
          setActiveProfile(null);
          setActiveTool('select');
        }
      }
    } catch {
      toast.error('Failed to toggle profile visibility');
    }
  };

  const handleShowAllProfiles = async () => {
    try {
      const profileIds = roiProfiles.map((p) => p.id);
      await setProfilesVisibility(profileIds, true);
      setRoiProfiles(roiProfiles.map((p) => ({ ...p, visible: true })));
    } catch {
      toast.error('Failed to show all profiles');
    }
  };

  const handleHideAllProfiles = async () => {
    try {
      const profileIds = roiProfiles.map((p) => p.id);
      await setProfilesVisibility(profileIds, false);
      setRoiProfiles(roiProfiles.map((p) => ({ ...p, visible: false })));
    } catch {
      toast.error('Failed to hide all profiles');
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    try {
      await deleteROIProfile(profileId);
      setRoiProfiles(roiProfiles.filter((p) => p.id !== profileId));
      
      if (activeProfile?.id === profileId) {
        setActiveProfile(null);
        setActiveTool('select');
      }
      
      toast.success('ROI profile deleted');
    } catch {
      toast.error('Failed to delete profile');
    }
  };

  const handleDrawingComplete = async (drawing: Omit<ROIDrawing, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!activeProfile) return;

    // Create temporary ID for local tracking
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const tempDrawing: ROIDrawing = {
      ...drawing,
      id: tempId,
      color: drawing.color,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add to local state immediately
    setRoiProfiles(
      roiProfiles.map((p) =>
        p.id === activeProfile.id
          ? { ...p, shapes: [...p.shapes, tempDrawing] }
          : p
      )
    );

    // Track as pending change
    setPendingChanges([...pendingChanges, {
      type: 'add',
      profileId: activeProfile.id,
      drawing: tempDrawing,
    }]);
    setHasUnsavedChanges(true);
  };

  const handleDrawingUpdate = async (drawingId: string, updates: Partial<ROIDrawing>) => {
    if (!selectedProfileId) return;

    // Update local state immediately
    setRoiProfiles(
      roiProfiles.map((p) =>
        p.id === selectedProfileId
          ? {
              ...p,
              shapes: p.shapes.map((s) =>
                s.id === drawingId ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
              ),
            }
          : p
      )
    );

    // Track as pending change
    setPendingChanges([...pendingChanges, {
      type: 'update',
      profileId: selectedProfileId,
      drawingId,
      updates,
    }]);
    setHasUnsavedChanges(true);

    if (updates.comment !== undefined) {
      setShowCommentPopover(false);
    }
  };

  const handleDeleteDrawing = async () => {
    if (!selectedProfileId || !selectedDrawing) return;

    // Remove from local state immediately
    setRoiProfiles(
      roiProfiles.map((p) =>
        p.id === selectedProfileId
          ? { ...p, shapes: p.shapes.filter((s) => s.id !== selectedDrawing.id) }
          : p
      )
    );

    // Track as pending change (only if it's not a temp drawing)
    if (!selectedDrawing.id.startsWith('temp_')) {
      setPendingChanges([...pendingChanges, {
        type: 'delete',
        profileId: selectedProfileId,
        drawingId: selectedDrawing.id,
      }]);
      setHasUnsavedChanges(true);
    } else {
      // If it's a temp drawing, just remove it from pending changes
      setPendingChanges(pendingChanges.filter(
        change => !(change.type === 'add' && change.drawing && 'id' in change.drawing && change.drawing.id === selectedDrawing.id)
      ));
      if (pendingChanges.filter(
        change => !(change.type === 'add' && change.drawing && 'id' in change.drawing && change.drawing.id === selectedDrawing.id)
      ).length === 0) {
        setHasUnsavedChanges(false);
      }
    }
    
    setSelectedDrawing(null);
    setSelectedProfileId(null);
  };

  const handleUndo = () => {
    if (!activeProfile || activeProfile.shapes.length === 0) return;

    const lastShape = activeProfile.shapes[activeProfile.shapes.length - 1];
    handleDeleteSpecificShape(activeProfile.id, lastShape.id);
  };

  const handleDeleteSpecificShape = async (profileId: string, shapeId: string) => {
    // Remove from local state immediately
    setRoiProfiles(
      roiProfiles.map((p) =>
        p.id === profileId
          ? { ...p, shapes: p.shapes.filter((s) => s.id !== shapeId) }
          : p
      )
    );

    // Track as pending change (only if it's not a temp drawing)
    if (!shapeId.startsWith('temp_')) {
      setPendingChanges([...pendingChanges, {
        type: 'delete',
        profileId: profileId,
        drawingId: shapeId,
      }]);
      setHasUnsavedChanges(true);
    } else {
      // If it's a temp drawing, just remove it from pending changes
      setPendingChanges(pendingChanges.filter(
        change => !(change.type === 'add' && change.drawing && 'id' in change.drawing && change.drawing.id === shapeId)
      ));
      if (pendingChanges.filter(
        change => !(change.type === 'add' && change.drawing && 'id' in change.drawing && change.drawing.id === shapeId)
      ).length === 0) {
        setHasUnsavedChanges(false);
      }
    }
    
    if (selectedDrawing?.id === shapeId) {
      setSelectedDrawing(null);
      setSelectedProfileId(null);
    }
  };

  const handleSaveROIChanges = async () => {
    if (!authState.user) return;

    try {
      // Process all pending changes
      for (const change of pendingChanges) {
        if (change.type === 'add' && change.drawing && 'id' in change.drawing) {
          // Add new drawing
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id: _id, ...drawingData } = change.drawing;
          await addDrawingToProfile(change.profileId, drawingData);
        } else if (change.type === 'update' && change.drawingId && change.updates) {
          // Update existing drawing
          await updateDrawing(change.profileId, change.drawingId, change.updates);
        } else if (change.type === 'delete' && change.drawingId) {
          // Delete drawing
          await deleteDrawing(change.profileId, change.drawingId);
        }
      }

      // Clear pending changes and reload profiles
      setPendingChanges([]);
      setHasUnsavedChanges(false);
      
      if (objectiveId && selectedCamera) {
        await loadROIProfiles(objectiveId, selectedCamera.id);
      }

      toast.success('ROI changes saved successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save ROI changes';
      toast.error(errorMessage);
    }
  };

  const handleDiscardROIChanges = async () => {
    if (!objectiveId || !selectedCamera) return;

    const confirmDiscard = window.confirm(
      'Are you sure you want to discard all unsaved changes?'
    );
    
    if (!confirmDiscard) return;

    // Reload profiles from database
    await loadROIProfiles(objectiveId, selectedCamera.id);
    
    // Clear pending changes
    setPendingChanges([]);
    setHasUnsavedChanges(false);
    setSelectedDrawing(null);
    setSelectedProfileId(null);
    
    toast.success('Changes discarded');
  };

  const handleCanvasClick = (point: { x: number; y: number }) => {
    if (selectedDrawing && activeTool === 'select') {
      // Open comment popover
      setCommentPosition(point);
      setCommentText(selectedDrawing.comment || '');
      setShowCommentPopover(true);
    }
  };

  const handleSaveComment = () => {
    if (!selectedDrawing) return;
    handleDrawingUpdate(selectedDrawing.id, { comment: commentText });
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistItem.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      title: newChecklistItem.title,
      description: newChecklistItem.description,
      completed: false,
    };

    if (checklistType === 'regular') {
      setChecklists([...checklists, newItem]);
    } else {
      setAiChecklists([...aiChecklists, newItem]);
    }

    setNewChecklistItem({ title: '', description: '' });
    setShowChecklistModal(false);
    toast.success('Checklist item added');
  };

  const handleToggleChecklistItem = (id: string, type: 'regular' | 'ai') => {
    if (type === 'regular') {
      setChecklists(checklists.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      ));
    } else {
      setAiChecklists(aiChecklists.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      ));
    }
  };

  const handleDeleteChecklistItem = (id: string, type: 'regular' | 'ai') => {
    if (type === 'regular') {
      setChecklists(checklists.filter(item => item.id !== id));
    } else {
      setAiChecklists(aiChecklists.filter(item => item.id !== id));
    }
    toast.success('Checklist item deleted');
  };

  const handleDrawingSelect = (drawing: ROIDrawing | null, profileId: string | null) => {
    setSelectedDrawing(drawing);
    setSelectedProfileId(profileId);
    
    if (!drawing) {
      setShowCommentPopover(false);
    }
  };

  const handleToolChange = (tool: DrawingTool) => {
    setActiveTool(tool);
    
    if (tool !== 'select') {
      setSelectedDrawing(null);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!objective || !pilot) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Objective not found</p>
          <Button onClick={() => navigate(`/pilots/${pilotId}`)} className="mt-4">
            Back to Pilot
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <button
              onClick={() => navigate('/pilots')}
              className="hover:text-blue-600 transition-colors"
            >
              Pilots
            </button>
            <span>/</span>
            <button
              onClick={() => navigate(`/pilots/${pilotId}`)}
              className="hover:text-blue-600 transition-colors"
            >
              {pilot.pilotName}
            </button>
            <span>/</span>
            <span className="text-gray-900 font-medium">Objective Setup</span>
          </nav>
        </div>

        {/* Objective Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
        >
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{objective.title}</h1>
              {objective.description && (
                <p className="text-gray-600 mt-2">{objective.description}</p>
              )}
              <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                <span>Pilot: {pilot.pilotName}</span>
                <span>•</span>
                <span>Status: {objective.status}</span>
                <span>•</span>
                <span>Priority: {objective.priority}</span>
              </div>
            </div>
            <Button variant="secondary" onClick={() => navigate(`/pilots/${pilotId}`)}>
              Back to Pilot
            </Button>
          </div>
        </motion.div>

        {/* Use Case Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6"
        >
          <div className="border-b border-gray-200 px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Use Case</h2>
                <p className="text-sm text-gray-600 mt-1">Describe the objective's use case and purpose</p>
              </div>
              {!isEditingUsecase && usecase && (
                <button
                  onClick={() => setIsEditingUsecase(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                >
                  Edit
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            {isEditingUsecase || !usecase ? (
              <div className="space-y-3">
                <textarea
                  value={usecase}
                  onChange={(e) => setUsecase(e.target.value)}
                  placeholder="e.g., Monitor employee safety compliance in warehouse loading dock area..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button onClick={handleSaveUsecase} size="sm">
                    Save Use Case
                  </Button>
                  {usecase && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUsecase(objective?.usecase || '');
                        setIsEditingUsecase(false);
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-gray-800">{usecase}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Success Criteria Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6"
        >
          <div className="border-b border-gray-200 px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Success Criteria</h2>
                <p className="text-sm text-gray-600 mt-1">Define measurable goals and targets for this objective</p>
              </div>
              {!isEditingSuccessCriteria && successCriteria.description && (
                <button
                  onClick={() => setIsEditingSuccessCriteria(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                >
                  Edit
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            {isEditingSuccessCriteria || !successCriteria.description ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Target Percentage Input */}
                  <div className="md:col-span-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Target %
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={successCriteria.targetPercentage}
                        onChange={(e) => {
                          const value = Math.min(100, Math.max(1, parseInt(e.target.value) || 1));
                          setSuccessCriteria({ ...successCriteria, targetPercentage: value });
                        }}
                        className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-bold text-blue-600"
                        placeholder="90"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 font-bold text-lg">
                        %
                      </span>
                    </div>
                  </div>

                  {/* Criteria Description Input */}
                  <div className="md:col-span-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Success Criteria Description
                    </label>
                    <input
                      type="text"
                      value={successCriteria.description}
                      onChange={(e) => setSuccessCriteria({ ...successCriteria, description: e.target.value })}
                      placeholder="e.g., Accuracy on Customer wait time at checkout with full journey time"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSaveSuccessCriteria} size="sm" className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Success Criteria
                  </Button>
                  {successCriteria.description && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (objective?.successCriteria) {
                          setSuccessCriteria(objective.successCriteria);
                        }
                        setIsEditingSuccessCriteria(false);
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  {/* Percentage Badge */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <svg className="w-20 h-20" viewBox="0 0 36 36">
                        <circle
                          cx="18"
                          cy="18"
                          r="16"
                          fill="none"
                          stroke="#E5E7EB"
                          strokeWidth="3"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="16"
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="3"
                          strokeDasharray={`${successCriteria.targetPercentage}, 100`}
                          strokeLinecap="round"
                          transform="rotate(-90 18 18)"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-bold text-green-700">
                          {successCriteria.targetPercentage}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="flex-1 pt-2">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Target Success Rate
                    </h4>
                    <p className="text-base font-medium text-gray-900 leading-relaxed">
                      {successCriteria.description}
                    </p>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex-shrink-0">
                    <div className="bg-green-100 border border-green-300 rounded-lg px-3 py-2 text-center">
                      <svg className="w-6 h-6 text-green-600 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-xs font-semibold text-green-700">
                        Defined
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Camera Frame ROI Setup Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200"
        >
          {/* Section Header */}
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-xl font-bold text-gray-900">ROI Configuration</h2>
            <p className="text-sm text-gray-600 mt-1">Select location and configure regions of interest</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Step 1: Location Selector */}
            {locations.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="mt-4 text-gray-600 font-medium">No Locations Available</p>
                <p className="text-sm text-gray-500 mt-1">
                  Add locations to this pilot first
                </p>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/pilots/${pilotId}`)}
                  className="mt-4"
                >
                  Go to Pilot Details
                </Button>
              </div>
            ) : (
              <>
                <div className="bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-xl p-5">
                  <div className="mb-3">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-1">
                      <span className="flex items-center justify-center w-6 h-6 bg-green-600 text-white rounded-full text-xs font-bold">1</span>
                      Select Location
                    </h3>
                    <p className="text-xs text-gray-600">Choose the location where ROI configuration will be applied</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {locations.map((location) => {
                      const locationCameras = cameras.filter(c => c.locationId === location.id);
                      const isSelected = selectedLocation?.id === location.id;

                      return (
                        <button
                          key={location.id}
                          onClick={() => handleLocationSelect(location)}
                          className={`text-left p-4 rounded-lg border-2 transition-all ${
                            isSelected
                              ? 'border-green-500 bg-green-50 shadow-md'
                              : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="text-sm font-bold text-gray-900">{location.name}</h4>
                              <p className="text-xs text-gray-600 mt-0.5">{location.cityRegion}</p>
                            </div>
                            {isSelected && (
                              <div className="bg-green-600 text-white rounded-full p-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">
                              {locationCameras.length} camera{locationCameras.length !== 1 ? 's' : ''}
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              location.status === 'active' ? 'bg-green-100 text-green-700' :
                              location.status === 'inactive' ? 'bg-gray-100 text-gray-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {location.status}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2: Camera Selection & ROI Drawing */}
                {selectedLocation && (
                  <>
                    {cameras.filter(c => c.locationId === selectedLocation.id).length === 0 ? (
                      <div className="text-center py-12 bg-orange-50 rounded-lg border-2 border-dashed border-orange-300">
                        <svg
                          className="mx-auto h-12 w-12 text-orange-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        <p className="mt-4 text-orange-700 font-medium">No Cameras at This Location</p>
                        <p className="text-sm text-orange-600 mt-1">
                          Add cameras with frames to "{selectedLocation.name}" location first
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/pilots/${pilotId}?tab=locations`)}
                          className="mt-4"
                        >
                          Go to Locations & Cameras Tab
                        </Button>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5">
                        <div className="mb-4">
                          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-1">
                            <span className="flex items-center justify-center w-6 h-6 bg-indigo-600 text-white rounded-full text-xs font-bold">2</span>
                            Draw ROI on Camera Frame
                          </h3>
                          <p className="text-xs text-gray-600">Select camera and define regions of interest</p>
                        </div>

                        {/* Camera Selector - Always visible at the top */}
                        <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                          <label className="text-sm font-semibold text-gray-700 block mb-3">
                            Select Camera ({cameras.filter(c => c.locationId === selectedLocation.id).length} available)
                          </label>
                          <div className="flex gap-3 overflow-x-auto pb-2">
                            {cameras.filter(c => c.locationId === selectedLocation.id).map((camera) => {
                              const primaryFrame = camera.frames.find(f => f.isPrimary) || camera.frames[0];
                              const isSelected = selectedCamera?.id === camera.id;
                              
                              return (
                                <button
                                  key={camera.id}
                                  onClick={() => handleCameraSelect(camera)}
                                  className={`flex-shrink-0 relative rounded-lg overflow-hidden transition-all ${
                                    isSelected
                                      ? 'ring-4 ring-indigo-500 ring-offset-2'
                                      : 'ring-2 ring-gray-200 hover:ring-indigo-300'
                                  }`}
                                  style={{ width: '150px', height: '100px' }}
                                >
                                  <img
                                    src={primaryFrame.fileUrl}
                                    alt={camera.name}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                    <p className="text-xs font-medium text-white truncate">
                                      {camera.name}
                                    </p>
                                  </div>
                                  {isSelected && (
                                    <div className="absolute top-2 right-2 bg-indigo-600 text-white rounded-full p-1">
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                          fillRule="evenodd"
                                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {selectedCamera && selectedFrame ? (
                          <div className="bg-white rounded-lg p-5 border border-gray-200">
                            <div className="grid grid-cols-12 gap-6">
                              {/* Left Column: ROI Tools and Canvas */}
                              <div className="col-span-8 space-y-4">
                                {/* Camera Header with Create ROI Button and Save/Discard */}
                                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                                  <div>
                                    <h4 className="text-base font-semibold text-gray-900">
                                      {selectedCamera.name}
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      {roiProfiles.length} ROI profile{roiProfiles.length !== 1 ? 's' : ''} • {selectedLocation.name}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {hasUnsavedChanges && (
                                      <>
                                        <Button
                                          onClick={handleSaveROIChanges}
                                          size="sm"
                                          className="bg-green-600 hover:bg-green-700"
                                        >
                                          💾 Save Changes ({pendingChanges.length})
                                        </Button>
                                        <Button
                                          onClick={handleDiscardROIChanges}
                                          variant="outline"
                                          size="sm"
                                          className="text-red-600 border-red-300 hover:bg-red-50"
                                        >
                                          Discard
                                        </Button>
                                      </>
                                    )}
                                    <Button onClick={() => setShowProfileModal(true)} size="sm">
                                      + Create ROI Profile
                                    </Button>
                                  </div>
                                </div>

                                {roiProfiles.length === 0 ? (
                                  <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                                    </svg>
                                    <p className="text-sm text-gray-600 font-medium">No ROI Profiles Yet</p>
                                    <p className="text-xs text-gray-500 mt-1">Create your first ROI profile to start drawing regions</p>
                                    <Button
                                      onClick={() => setShowProfileModal(true)}
                                      className="mt-3"
                                      size="sm"
                                    >
                                      + Create ROI Profile
                                    </Button>
                                  </div>
                                ) : (
                                  <>
                                    {/* Drawing Toolbar - Compact */}
                                    <ROIToolbar
                                      activeTool={activeTool}
                                      onToolChange={handleToolChange}
                                      onDelete={handleDeleteDrawing}
                                      hasSelection={!!selectedDrawing}
                                      disabled={!activeProfile}
                                      selectedColor={selectedColor}
                                      onColorChange={setSelectedColor}
                                    />

                                    {/* ROI Profile Chips Above Canvas */}
                                    <ROIProfileChips
                                      profiles={roiProfiles}
                                      onToggleProfile={handleToggleProfile}
                                      onShowAll={handleShowAllProfiles}
                                      onHideAll={handleHideAllProfiles}
                                      onDeleteProfile={handleDeleteProfile}
                                    />

                                    {activeProfile && (
                                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <p className="text-xs font-semibold text-blue-900 mb-1">
                                          Active Profile:
                                        </p>
                                        <div className="flex items-center gap-2">
                                          <div
                                            className="w-4 h-4 rounded"
                                            style={{ backgroundColor: activeProfile.color }}
                                          />
                                          <span className="text-sm font-medium text-blue-900">
                                            {activeProfile.name}
                                          </span>
                                        </div>
                                        <p className="text-xs text-blue-700 mt-2">
                                          {activeProfile.shapes.length} shape{activeProfile.shapes.length !== 1 ? 's' : ''}
                                        </p>
                                      </div>
                                    )}

                                    {!activeProfile && roiProfiles.length > 0 && (
                                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                        <p className="text-xs text-yellow-800">
                                          <strong>Select a profile:</strong> Click a profile chip above to start drawing
                                        </p>
                                      </div>
                                    )}

                                    {/* Undo Button and Unsaved Changes Indicator */}
                                    {activeProfile && activeProfile.shapes.length > 0 && (
                                      <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                          <div className="text-xs text-gray-500 italic">
                                            💡 Tip: Click on a shape in <strong>Select mode</strong> to add comments
                                          </div>
                                          {hasUnsavedChanges && (
                                            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full border border-orange-300">
                                              {pendingChanges.length} unsaved change{pendingChanges.length !== 1 ? 's' : ''}
                                            </span>
                                          )}
                                        </div>
                                        <button
                                          onClick={handleUndo}
                                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                                          title="Undo last shape"
                                        >
                                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                                            />
                                          </svg>
                                          Undo
                                        </button>
                                      </div>
                                    )}

                                    {/* Canvas */}
                                    <ROICanvas
                                      frameUrl={selectedFrame.fileUrl}
                                      profiles={roiProfiles}
                                      activeProfile={activeProfile}
                                      activeTool={activeTool}
                                      onDrawingComplete={handleDrawingComplete}
                                      onDrawingSelect={handleDrawingSelect}
                                      selectedDrawing={selectedDrawing}
                                      selectedColor={selectedColor}
                                      onCanvasClick={handleCanvasClick}
                                    />

                                    {/* Other Camera Frame Options at Bottom */}
                                    {selectedCamera.frames.length > 1 && (
                                      <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">
                                          Other Frames ({selectedCamera.frames.length - 1})
                                        </label>
                                        <div className="flex gap-2 overflow-x-auto pb-2">
                                          {selectedCamera.frames
                                            .filter(f => f.id !== selectedFrame.id)
                                            .map((frame) => (
                                              <button
                                                key={frame.id}
                                                onClick={() => setSelectedFrame(frame)}
                                                className="flex-shrink-0 rounded-lg overflow-hidden ring-2 ring-gray-200 hover:ring-indigo-300 transition-all"
                                                style={{ width: '120px', height: '80px' }}
                                              >
                                                <img
                                                  src={frame.fileUrl}
                                                  alt="Camera frame"
                                                  className="w-full h-full object-cover"
                                                />
                                              </button>
                                            ))}
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>

                            {/* Right Column: Checklists */}
                            <div className="col-span-4 space-y-6">
                    {/* Regular Checklist Section */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-5 py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-base font-bold text-gray-900">Checklist</h3>
                            <p className="text-xs text-gray-600 mt-0.5">Track objective tasks and requirements</p>
                          </div>
                          <button
                            onClick={() => {
                              setChecklistType('regular');
                              setShowChecklistModal(true);
                            }}
                            className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            title="Add checklist item"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <div className="p-4 max-h-[400px] overflow-y-auto">
                        {checklists.length === 0 ? (
                          <div className="text-center py-8">
                            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                            <p className="text-sm text-gray-500">No checklist items yet</p>
                            <p className="text-xs text-gray-400 mt-1">Click + to add items</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {checklists.map((item) => (
                              <div
                                key={item.id}
                                className="group bg-gray-50 hover:bg-gray-100 rounded-lg p-3 transition-colors"
                              >
                                <div className="flex items-start gap-3">
                                  <input
                                    type="checkbox"
                                    checked={item.completed}
                                    onChange={() => handleToggleChecklistItem(item.id, 'regular')}
                                    className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <h4 className={`text-sm font-medium ${item.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                      {item.title}
                                    </h4>
                                    {item.description && (
                                      <p className={`text-xs mt-1 ${item.completed ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                                        {item.description}
                                      </p>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => handleDeleteChecklistItem(item.id, 'regular')}
                                    className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 p-1 transition-opacity"
                                    title="Delete item"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* AI Checklist Section */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200 px-5 py-4">
                        <div>
                          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            AI Checklist
                          </h3>
                          <p className="text-xs text-gray-600 mt-0.5">AI-generated recommendations</p>
                        </div>
                      </div>
                      
                      <div className="p-4 max-h-[400px] overflow-y-auto">
                        {aiChecklists.length === 0 ? (
                          <div className="text-center py-8">
                            <svg className="w-12 h-12 text-purple-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            <p className="text-sm text-gray-500">No AI checklist items yet</p>
                            <p className="text-xs text-gray-400 mt-1">Click + to add AI recommendations</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {aiChecklists.map((item) => (
                              <div
                                key={item.id}
                                className="group bg-purple-50 hover:bg-purple-100 rounded-lg p-3 transition-colors"
                              >
                                <div className="flex items-start gap-3">
                                  <input
                                    type="checkbox"
                                    checked={item.completed}
                                    onChange={() => handleToggleChecklistItem(item.id, 'ai')}
                                    className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <h4 className={`text-sm font-medium ${item.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                      {item.title}
                                    </h4>
                                    {item.description && (
                                      <p className={`text-xs mt-1 ${item.completed ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                                        {item.description}
                                      </p>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => handleDeleteChecklistItem(item.id, 'ai')}
                                    className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 p-1 transition-opacity"
                                    title="Delete item"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </>
      )}
      </>
    )}
  </div>
  </motion.div>
</div>

      {/* Profile Creation Modal */}
      <ROIProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onSubmit={handleCreateProfile}
        existingProfiles={roiProfiles}
        maxProfiles={10}
      />

      {/* Comment Popover */}
      {showCommentPopover && commentPosition && selectedDrawing && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setShowCommentPopover(false)}
          />
          
          {/* Popover */}
          <div
            className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4"
            style={{
              left: `${commentPosition.x}px`,
              top: `${commentPosition.y}px`,
              width: '300px',
              transform: 'translate(-50%, 10px)',
              maxHeight: '400px',
              overflow: 'auto',
            }}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">Shape Comment</h4>
                <button
                  onClick={() => setShowCommentPopover(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
              
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Enter comment for this ROI shape..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                rows={3}
                autoFocus
              />
              
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveComment}
                  className="flex-1"
                >
                  Save
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCommentPopover(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Checklist Modal */}
      {showChecklistModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Add {checklistType === 'ai' ? 'AI' : ''} Checklist Item
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowChecklistModal(false);
                  setNewChecklistItem({ title: '', description: '' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newChecklistItem.title}
                  onChange={(e) => setNewChecklistItem({ ...newChecklistItem, title: e.target.value })}
                  placeholder="e.g., Verify camera angle"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={newChecklistItem.description}
                  onChange={(e) => setNewChecklistItem({ ...newChecklistItem, description: e.target.value })}
                  placeholder="Add details about this checklist item..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowChecklistModal(false);
                  setNewChecklistItem({ title: '', description: '' });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleAddChecklistItem}>
                Add Item
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
