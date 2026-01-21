import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/shared/Button';
import { Input } from '../components/shared/Input';
import { FileUploadZone } from '../components/shared/FileUploadZone';
import { useAuth } from '../contexts/AuthContext';
import { getPilotById, updatePilot, deletePilot } from "../utils/db";
import {
  getObjectivesByPilot,
  createObjective,
  updateObjective,
  deleteObjective,
  calculatePilotProgress,
} from "../utils/objectiveDb";
import {
  getCamerasByPilot,
  createCamera,
  updateCamera,
  deleteCamera,
  addFrameToCamera,
  removeFrameFromCamera,
  setPrimaryFrame,
} from "../utils/cameraDb";
import { getAssetsByPilot, createAsset, deleteAsset } from "../utils/assetDb";
import { getRemarksByPilot } from "../utils/remarkDb";
import { getAllUsers } from "../utils/userDb";
import { getCustomerByEmail } from "../utils/customerDb";
import { getLocationsByIds } from "../utils/locationDb";
import { 
  getTopLevelComments, 
  getRepliesForComment, 
  addPilotComment,
  initPilotCommentDatabase 
} from "../utils/pilotCommentDb";
import type { PilotComment } from "../types/pilotComment";
import type { PilotRecord } from "../types/onboarding";
import type { Objective, ObjectiveStatus, ObjectivePriority } from "../types/objective";
import type { Camera } from "../types/camera";
import type { Asset } from "../types/asset";
import type { Remark } from "../types/remark";
import type { User } from "../types/auth";
import type { Location } from "../types/location";
import type { CameraStatus } from "../types/camera";
import type { AssetCategory } from "../types/asset";
import { getObjectiveStatusBadgeStyle, getObjectiveStatusDisplayText } from "../types/objective";
import { getCameraStatusBadgeStyle } from "../types/camera";
import { getAssetCategoryIcon, getAssetCategoryColor } from "../types/asset";
// import { getRemarkTypeIcon } from "../types/remark";
import { getStatusBadgeStyle, type PilotStatus } from "../types/pilot";
import toast from "react-hot-toast";
import jsPDF from "jspdf";

// Helper functions for activity timeline
function getActivityEmoji(type: string): string {
  const emojiMap: Record<string, string> = {
    note: '📝',
    issue: '⚠️',
    update: '✨',
    resolution: '✅',
    activity: '📌',
    objective: '🎯',
    camera: '📷',
    asset: '📎',
  };
  return emojiMap[type] || '📌';
}

function getActivityColor(type: string): string {
  const colorMap: Record<string, string> = {
    note: 'bg-blue-500',
    issue: 'bg-red-500',
    update: 'bg-green-500',
    resolution: 'bg-purple-500',
    activity: 'bg-gray-500',
    objective: 'bg-indigo-500',
    camera: 'bg-orange-500',
    asset: 'bg-cyan-500',
  };
  return colorMap[type] || 'bg-gray-500';
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

type Tab = "overview" | "objectives" | "locations" | "assets" | "activity" | "comments";

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
  const [locations, setLocations] = useState<Location[]>([]);

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  
  // Comments state
  const [comments, setComments] = useState<PilotComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Objective modal state
  const [showObjectiveModal, setShowObjectiveModal] = useState(false);
  const [newObjective, setNewObjective] = useState({
    title: "",
    description: "",
    priority: "medium" as ObjectivePriority,
  });

  // Camera modal state
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [editingCameraId, setEditingCameraId] = useState<string | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [newCamera, setNewCamera] = useState({
    name: "",
    comments: "",
    status: "planned" as CameraStatus,
    frames: [] as File[],
  });
  const [selectedCameraForFrames, setSelectedCameraForFrames] = useState<string | null>(null);

  // AI Summary modal state
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // Asset modal state
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [newAsset, setNewAsset] = useState({
    title: "",
    category: "other" as AssetCategory,
    description: "",
    remarks: "",
  });

  // Move asset to camera modal state
  const [showMoveAssetModal, setShowMoveAssetModal] = useState(false);
  const [selectedAssetToMove, setSelectedAssetToMove] = useState<Asset | null>(null);
  const [selectedCameraForMove, setSelectedCameraForMove] = useState<string | null>(null);

  // Edit pilot details modal state
  const [showEditPilotModal, setShowEditPilotModal] = useState(false);
  const [editPilotData, setEditPilotData] = useState({
    startDate: "",
    expectedEndDate: "",
  });

  // Load pilot data
  const loadPilotData = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      
      // Initialize pilot comment database
      await initPilotCommentDatabase();
      
      const [pilotData, objectivesData, camerasData, assetsData, remarksData, usersData] = await Promise.all([
        getPilotById(id),
        getObjectivesByPilot(id),
        getCamerasByPilot(id),
        getAssetsByPilot(id),
        getRemarksByPilot(id),
        getAllUsers(),
      ]);

      if (!pilotData) {
        toast.error("Pilot not found");
        navigate("/dashboard");
        return;
      }

      setPilot(pilotData);
      setObjectives(objectivesData);
      setCameras(camerasData);
      setAssets(assetsData);
      setRemarks(remarksData);
      setUsers(usersData);

      // Load comments
      const commentsData = getTopLevelComments(id);
      setComments(commentsData);

      // Load locations if available
      if (pilotData.locationIds && pilotData.locationIds.length > 0) {
        const locationsData = await getLocationsByIds(pilotData.locationIds);
        setLocations(locationsData);
      }

      // Load customer if available (for future use)
      if (pilotData.customerId && pilotData.contactEmail) {
        getCustomerByEmail(pilotData.contactEmail).catch(console.error);
      }
    } catch (error) {
      console.error("Error loading pilot data:", error);
      toast.error("Failed to load pilot data");
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
      toast.error("Please enter an objective title");
      return;
    }

    try {
      const created = await createObjective({
        pilotId: pilot.id,
        title: newObjective.title,
        description: newObjective.description,
        status: "pending",
        priority: newObjective.priority,
        progress: 0,
        createdBy: authState.user.email,
      });

      setObjectives([...objectives, created]);
      setNewObjective({ title: "", description: "", priority: "medium" });
      setShowObjectiveModal(false);
      toast.success("Objective added");
      await loadPilotData(); // Reload to get activity log
    } catch (error) {
      console.error("Error creating objective:", error);
      toast.error("Failed to create objective");
    }
  };

  const handleUpdateObjectiveStatus = async (objectiveId: string, status: ObjectiveStatus) => {
    if (!authState.user) return;

    try {
      const updated = await updateObjective(
        objectiveId,
        {
          status,
          completedAt: status === "completed" ? new Date().toISOString() : undefined,
        },
        authState.user.email
      );

      if (updated) {
        setObjectives(objectives.map((o) => (o.id === objectiveId ? updated : o)));
        await loadPilotData(); // Reload to get activity log
      }
    } catch (error) {
      console.error("Error updating objective:", error);
      toast.error("Failed to update objective");
    }
  };

  const handleDeleteObjective = async (objectiveId: string) => {
    if (!authState.user || !window.confirm("Are you sure you want to delete this objective?")) return;

    try {
      await deleteObjective(objectiveId, authState.user.email);
      setObjectives(objectives.filter((o) => o.id !== objectiveId));
      toast.success("Objective deleted");
      await loadPilotData(); // Reload to get activity log
    } catch (error) {
      console.error("Error deleting objective:", error);
      toast.error("Failed to delete objective");
    }
  };

  // Camera handlers
  const handleCreateCamera = async () => {
    if (!pilot || !authState.user) return;

    if (!newCamera.name.trim()) {
      toast.error("Please enter camera name");
      return;
    }

    if (!selectedLocationId) {
      toast.error("Please select a location");
      return;
    }

    try {
      const created = await createCamera({
        pilotId: pilot.id,
        locationId: selectedLocationId,
        name: newCamera.name,
        location: "", // Keep location as empty string for backward compatibility
        status: newCamera.status,
        notes: newCamera.comments || undefined,
        frames: [],
        createdBy: authState.user.email,
      });

      // Upload frames if any
      if (newCamera.frames.length > 0) {
        await handleAddCameraFrames(created.id, newCamera.frames);
      }

      // Reload to get updated camera with frames
      await loadPilotData();
      setNewCamera({ name: "", comments: "", status: "planned", frames: [] });
      setShowCameraModal(false);
      toast.success("Camera added successfully");
    } catch (error) {
      console.error("Error creating camera:", error);
      toast.error("Failed to create camera");
    }
  };

  const handleUpdateCamera = async () => {
    if (!pilot || !authState.user || !editingCameraId) return;

    if (!newCamera.name.trim()) {
      toast.error("Please enter camera name");
      return;
    }

    try {
      const cameraToUpdate = cameras.find((c) => c.id === editingCameraId);
      if (!cameraToUpdate) return;

      const updated = await updateCamera(editingCameraId, {
        name: newCamera.name,
        status: newCamera.status,
        notes: newCamera.comments || undefined,
      });

      if (updated) {
        setCameras(cameras.map((c) => (c.id === editingCameraId ? updated : c)));
      }
      setNewCamera({ name: "", comments: "", status: "planned", frames: [] });
      setEditingCameraId(null);
      setShowCameraModal(false);
      toast.success("Camera updated successfully");
    } catch (error) {
      console.error("Error updating camera:", error);
      toast.error("Failed to update camera");
    }
  };

  const handleAddCameraFrames = async (cameraId: string, files: File[]) => {
    if (!authState.user) return;

    try {
      let updatedCamera = cameras.find((c) => c.id === cameraId);
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

      setCameras(cameras.map((c) => (c.id === cameraId ? updatedCamera! : c)));
      toast.success(`${files.length} frame(s) uploaded`);
    } catch (error) {
      console.error("Error adding frames:", error);
      toast.error("Failed to upload frames");
    }
  };

  const handleRemoveFrame = async (cameraId: string, frameId: string) => {
    try {
      const updated = await removeFrameFromCamera(cameraId, frameId);
      if (updated) {
        setCameras(cameras.map((c) => (c.id === cameraId ? updated : c)));
        toast.success("Frame removed");
      }
    } catch (error) {
      console.error("Error removing frame:", error);
      toast.error("Failed to remove frame");
    }
  };

  const handleSetPrimaryFrame = async (cameraId: string, frameId: string) => {
    try {
      const updated = await setPrimaryFrame(cameraId, frameId);
      if (updated) {
        setCameras(cameras.map((c) => (c.id === cameraId ? updated : c)));
        toast.success("Primary frame set");
      }
    } catch (error) {
      console.error("Error setting primary frame:", error);
      toast.error("Failed to set primary frame");
    }
  };

  const handleDeleteCamera = async (cameraId: string) => {
    if (!window.confirm("Are you sure you want to delete this camera?")) return;

    try {
      await deleteCamera(cameraId);
      setCameras(cameras.filter((c) => c.id !== cameraId));
      toast.success("Camera deleted");
    } catch (error) {
      console.error("Error deleting camera:", error);
      toast.error("Failed to delete camera");
    }
  };

  // Asset handlers
  const handleDeleteAsset = async (assetId: string) => {
    if (!authState.user || !window.confirm("Are you sure you want to delete this asset?")) return;

    try {
      await deleteAsset(assetId, authState.user.email);
      setAssets(assets.filter((a) => a.id !== assetId));
      toast.success("Asset deleted");
      await loadPilotData(); // Reload to get activity log
    } catch (error) {
      console.error("Error deleting asset:", error);
      toast.error("Failed to delete asset");
    }
  };

  const handleDownloadAsset = (asset: Asset) => {
    const link = document.createElement("a");
    link.href = asset.fileUrl;
    link.download = asset.fileName;
    link.click();
  };

  const handleMoveAssetToCamera = async () => {
    if (!selectedAssetToMove || !selectedCameraForMove || !authState.user) return;

    // Only allow moving image assets
    if (!selectedAssetToMove.fileType.startsWith("image/")) {
      toast.error("Only image assets can be moved to camera frames");
      return;
    }

    try {
      // Add the asset as a frame to the selected camera
      const result = await addFrameToCamera(selectedCameraForMove, {
        fileName: selectedAssetToMove.fileName,
        fileUrl: selectedAssetToMove.fileUrl,
        fileSize: selectedAssetToMove.fileSize,
        isPrimary: false,
      });

      if (result) {
        // Update cameras state
        setCameras(cameras.map((c) => (c.id === selectedCameraForMove ? result : c)));
        
        // Delete the asset from assets
        await deleteAsset(selectedAssetToMove.id, authState.user.email);
        setAssets(assets.filter((a) => a.id !== selectedAssetToMove.id));
        
        toast.success(`Moved to camera frame successfully`);
        setShowMoveAssetModal(false);
        setSelectedAssetToMove(null);
        setSelectedCameraForMove(null);
        
        // Reload data to reflect in activity
        await loadPilotData();
      }
    } catch (error) {
      console.error("Error moving asset to camera:", error);
      toast.error("Failed to move asset to camera");
    }
  };

  const handleDeletePilot = async () => {
    if (
      !pilot ||
      !window.confirm(`Are you sure you want to delete the pilot "${pilot.name}"? This action cannot be undone.`)
    )
      return;

    try {
      await deletePilot(pilot.id);
      toast.success("Pilot deleted successfully");
      navigate("/pilots");
    } catch (error) {
      console.error("Error deleting pilot:", error);
      toast.error("Failed to delete pilot");
    }
  };

  const handleUpdatePilotDates = async () => {
    if (!pilot) return;

    try {
      await updatePilot(pilot.id, {
        startDate: editPilotData.startDate,
        expectedEndDate: editPilotData.expectedEndDate || undefined,
      });
      setPilot({
        ...pilot,
        startDate: editPilotData.startDate,
        expectedEndDate: editPilotData.expectedEndDate || undefined,
      });
      setShowEditPilotModal(false);
      toast.success("Pilot dates updated successfully");
    } catch (error) {
      console.error("Error updating pilot:", error);
      toast.error("Failed to update pilot dates");
    }
  };

  // Comment handlers
  const handleAddComment = async () => {
    if (!pilot || !authState.user || !newComment.trim()) return;

    try {
      const comment = await addPilotComment({
        pilotId: pilot.id,
        userId: authState.user.id,
        userName: authState.user.name,
        content: newComment,
      });

      setComments([comment, ...comments]);
      setNewComment("");
      toast.success("Comment added");
      await loadPilotData(); // Reload to get activity log
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    }
  };

  const handleAddReply = async (parentId: string) => {
    if (!pilot || !authState.user || !replyContent.trim()) return;

    try {
      await addPilotComment({
        pilotId: pilot.id,
        userId: authState.user.id,
        userName: authState.user.name,
        content: replyContent,
        parentId,
      });

      // Reload comments to get the new reply
      const updatedComments = getTopLevelComments(pilot.id);
      setComments(updatedComments);
      setReplyContent("");
      setReplyingTo(null);
      toast.success("Reply added");
      await loadPilotData(); // Reload to get activity log
    } catch (error) {
      console.error("Error adding reply:", error);
      toast.error("Failed to add reply");
    }
  };

  const handleExportPDF = async () => {
    if (!pilot) return;

    try {
      toast.loading("Generating PDF...", { id: "pdf-export" });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = margin;

      // Helper function to add text with word wrap
      const addText = (text: string, fontSize: number, isBold: boolean = false) => {
        pdf.setFontSize(fontSize);
        pdf.setFont("helvetica", isBold ? "bold" : "normal");
        const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin);
        
        if (yPosition + (lines.length * fontSize * 0.35) > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        
        pdf.text(lines, margin, yPosition);
        yPosition += lines.length * fontSize * 0.35 + 3;
      };

      const addSection = (title: string) => {
        yPosition += 5;
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.setFillColor(59, 130, 246);
        pdf.rect(margin, yPosition - 5, pageWidth - 2 * margin, 8, "F");
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.text(title, margin + 2, yPosition);
        pdf.setTextColor(0, 0, 0);
        yPosition += 10;
      };

      // Title
      pdf.setFillColor(37, 99, 235);
      pdf.rect(0, 0, pageWidth, 40, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text(pilot.name, margin, 15);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(pilot.company, margin, 25);
      pdf.setFontSize(10);
      pdf.text(`Status: ${pilot.status.toUpperCase()}`, margin, 32);
      pdf.setTextColor(0, 0, 0);
      yPosition = 50;

      // Overview Section
      addSection("PILOT OVERVIEW");
      addText(`Contact: ${pilot.contactPerson} (${pilot.contactEmail})`, 10);
      addText(`Phone: ${pilot.contactEmail}`, 10);
      addText(`Location: ${pilot.locationName || "N/A"}`, 10);
      addText(`Start Date: ${pilot.startDate ? new Date(pilot.startDate).toLocaleDateString() : "Not set"}`, 10);
      addText(`Expected End Date: ${pilot.expectedEndDate ? new Date(pilot.expectedEndDate).toLocaleDateString() : "Not set"}`, 10);
      addText(`Progress: ${progress}%`, 10, true);

      // Objectives Section
      if (objectives.length > 0) {
        addSection("OBJECTIVES");
        objectives.forEach((obj, index) => {
          addText(`${index + 1}. ${obj.title}`, 10, true);
          addText(`   Status: ${obj.status} | Priority: ${obj.priority} | Progress: ${obj.progress}%`, 9);
          if (obj.description) {
            addText(`   ${obj.description}`, 9);
          }
          yPosition += 2;
        });
      }

      // Locations & Cameras Section
      if (locations.length > 0) {
        addSection("LOCATIONS & CAMERAS");
        locations.forEach((location) => {
          addText(`Location: ${location.name}`, 10, true);
          addText(`   City/Region: ${location.cityRegion}`, 9);
          
          const locationCameras = cameras.filter(c => c.locationId === location.id);
          if (locationCameras.length > 0) {
            addText(`   Cameras (${locationCameras.length}):`, 9, true);
            locationCameras.forEach((camera) => {
              addText(`   - ${camera.name} [${camera.status}] (${camera.frames.length} frames)`, 9);
              if (camera.notes) {
                addText(`     Notes: ${camera.notes}`, 8);
              }
            });
          }
          yPosition += 3;
        });
      }

      // Assets Section
      if (assets.length > 0) {
        addSection("ASSETS");
        const assetsByCategory: Record<string, Asset[]> = {};
        assets.forEach(asset => {
          if (!assetsByCategory[asset.category]) {
            assetsByCategory[asset.category] = [];
          }
          assetsByCategory[asset.category].push(asset);
        });

        Object.entries(assetsByCategory).forEach(([category, categoryAssets]) => {
          addText(`${category.toUpperCase()} (${categoryAssets.length}):`, 10, true);
          categoryAssets.forEach((asset) => {
            addText(`- ${asset.title || asset.fileName}`, 9);
            if (asset.description) {
              addText(`  ${asset.description}`, 8);
            }
          });
          yPosition += 2;
        });
      }

      // Team Members Section
      if (assignedUsers.length > 0) {
        addSection("TEAM MEMBERS");
        assignedUsers.forEach((user) => {
          addText(`- ${user.name} (${user.email}) - ${user.role}`, 10);
        });
      }

      // Activity Section
      const systemRemarks = remarks.filter(r => r.isSystem).slice(0, 10);
      if (systemRemarks.length > 0) {
        addSection("RECENT ACTIVITY (Last 10)");
        systemRemarks.forEach((remark) => {
          const date = new Date(remark.createdAt);
          addText(`${date.toLocaleDateString()} ${date.toLocaleTimeString()}`, 9, true);
          addText(`${remark.text}`, 9);
          yPosition += 2;
        });
      }

      // Footer
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const totalPages = (pdf as any).internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text(
          `Generated on ${new Date().toLocaleDateString()} | Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
      }

      // Save the PDF
      pdf.save(`${pilot.name.replace(/\s+/g, "_")}_Pilot_Report.pdf`);
      toast.success("PDF exported successfully", { id: "pdf-export" });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF", { id: "pdf-export" });
    }
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
  const assignedUsers = users.filter((u) => pilot.assignedUserIds?.includes(u.id));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Action Buttons at Top */}
          <div className="mb-4 pb-4 border-b border-gray-200 flex justify-end gap-3">
            <button
              onClick={() => window.open('https://dev.wobot.ai/home', '_blank')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              title="Open Wobot Dashboard"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              Wobot Dashboard
            </button>
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              title="Export pilot details as PDF"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export as PDF
            </button>
            <button
              onClick={() => setShowSummaryModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              AI Summarize
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/pilots/${id}`);
                toast.success("Link copied to clipboard!");
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy Shareable Link
            </button>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/dashboard")}
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
            <div className="flex items-center gap-3">
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusBadgeStyle(
                  pilot.status as PilotStatus
                )}`}
              >
                {pilot.status}
              </span>
              <button
                onClick={handleDeletePilot}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Pilot"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
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
              {(["overview", "objectives", "locations", "assets", "activity", "comments"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab === "locations" ? "Locations & Cameras" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  {/* Main Information Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Pilot Information Card */}
                    <div className="lg:col-span-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Pilot Information</h3>
                      </div>
                      <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg p-4 border border-blue-100">
                          <dt className="text-sm font-medium text-gray-600 mb-1">Company</dt>
                          <dd className="text-base font-semibold text-gray-900">{pilot.company}</dd>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-blue-100">
                          <dt className="text-sm font-medium text-gray-600 mb-1">Contact Email</dt>
                          <dd className="text-base font-semibold text-blue-600">{pilot.contactEmail}</dd>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-blue-100 md:col-span-2">
                          <dt className="text-sm font-medium text-gray-600 mb-2">Locations</dt>
                          {locations.length > 0 ? (
                            <div className="space-y-2">
                              {locations.map((loc) => (
                                <div key={loc.id} className="flex items-center justify-between bg-blue-50 rounded-lg p-2 border border-blue-100">
                                  <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <div>
                                      <span className="text-sm font-semibold text-gray-900">{loc.name}</span>
                                      <span className="text-xs text-gray-600 ml-2">• {loc.cityRegion}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${
                                      loc.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                                      loc.status === 'inactive' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                                      'bg-yellow-50 text-yellow-700 border-yellow-200'
                                    }`}>
                                      {loc.status}
                                    </span>
                                    <span className="text-xs text-gray-500">{loc.cameraCount} cameras</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <dd className="text-sm text-gray-500 italic">
                              {pilot.locationName || pilot.location || "No locations added yet"}
                            </dd>
                          )}
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-blue-100">
                          <div className="flex items-center justify-between mb-1">
                            <dt className="text-sm font-medium text-gray-600">Start Date</dt>
                            <button
                              onClick={() => {
                                setEditPilotData({
                                  startDate: pilot.startDate,
                                  expectedEndDate: pilot.expectedEndDate || "",
                                });
                                setShowEditPilotModal(true);
                              }}
                              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                              Edit
                            </button>
                          </div>
                          <dd className="text-base font-semibold text-gray-900">
                            {new Date(pilot.startDate).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </dd>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-blue-100">
                          <div className="flex items-center justify-between mb-1">
                            <dt className="text-sm font-medium text-gray-600">Expected End Date</dt>
                            <button
                              onClick={() => {
                                setEditPilotData({
                                  startDate: pilot.startDate,
                                  expectedEndDate: pilot.expectedEndDate || "",
                                });
                                setShowEditPilotModal(true);
                              }}
                              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                              Edit
                            </button>
                          </div>
                          <dd className="text-base font-semibold text-gray-900">
                            {pilot.expectedEndDate 
                              ? new Date(pilot.expectedEndDate).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })
                              : "Not set"}
                          </dd>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-blue-100">
                          <dt className="text-sm font-medium text-gray-600 mb-1">Camera Count</dt>
                          <dd className="text-base font-semibold text-gray-900">{pilot.cameraCount || "TBD"}</dd>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-blue-100">
                          <dt className="text-sm font-medium text-gray-600 mb-1">Created By</dt>
                          <dd className="text-base font-semibold text-gray-900">{pilot.createdBy}</dd>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-blue-100">
                          <dt className="text-sm font-medium text-gray-600 mb-1">Created At</dt>
                          <dd className="text-base font-semibold text-gray-900">
                            {new Date(pilot.createdAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    {/* Team Members Card */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Team Members</h3>
                      </div>
                      <div className="space-y-3">
                        {assignedUsers.length > 0 ? (
                          assignedUsers.map((user) => (
                            <div key={user.id} className="bg-white rounded-lg p-4 border border-purple-100">
                              <div className="flex items-center gap-3">
                                {user.avatar ? (
                                  <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full" />
                                ) : (
                                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                    {user.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-900">{user.name}</p>
                                  <p className="text-sm text-gray-600">{user.email}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                                      {user.userType}
                                    </span>
                                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                                      {user.role}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="bg-white rounded-lg p-4 border border-purple-100 text-center">
                            <p className="text-sm text-gray-500 italic">No team members assigned yet</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Recent Objectives */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                            />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Recent Objectives</h3>
                      </div>
                      <button
                        onClick={() => setActiveTab("objectives")}
                        className="text-sm text-green-600 hover:text-green-700 font-medium"
                      >
                        View All →
                      </button>
                    </div>
                    <div className="space-y-3">
                      {objectives.length > 0 ? (
                        objectives.slice(0, 3).map((obj) => (
                          <div key={obj.id} className="bg-white rounded-lg p-4 border border-green-100">
                            <div className="flex items-center justify-between">
                              <span className="text-base font-semibold text-gray-900">{obj.title}</span>
                              <span
                                className={`px-3 py-1 text-xs font-medium rounded-full border ${getObjectiveStatusBadgeStyle(
                                  obj.status
                                )}`}
                              >
                                {getObjectiveStatusDisplayText(obj.status)}
                              </span>
                            </div>
                            {obj.description && (
                              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{obj.description}</p>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="bg-white rounded-lg p-8 border border-green-100 text-center">
                          <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                          <p className="text-sm text-gray-500 italic">No objectives added yet</p>
                          <button
                            onClick={() => setActiveTab("objectives")}
                            className="mt-3 text-sm text-green-600 hover:text-green-700 font-medium"
                          >
                            Add Your First Objective
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cameras and Assets Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Cameras Overview */}
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                          <h3 className="text-lg font-bold text-gray-900">Cameras ({cameras.length})</h3>
                        </div>
                        <button
                          onClick={() => setActiveTab("locations")}
                          className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                        >
                          View All →
                        </button>
                      </div>
                      {cameras.length > 0 ? (
                        <div className="space-y-3">
                          {cameras.slice(0, 4).map((camera) => (
                            <div key={camera.id} className="bg-white rounded-lg p-4 border border-orange-100">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="text-base font-semibold text-gray-900">{camera.name}</h4>
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded border ${getCameraStatusBadgeStyle(
                                    camera.status
                                  )}`}
                                >
                                  {camera.status}
                                </span>
                              </div>
                              {camera.notes && (
                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{camera.notes}</p>
                              )}
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                <span>
                                  {camera.frames.length} frame{camera.frames.length !== 1 ? "s" : ""}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-white rounded-lg p-8 border border-orange-100 text-center">
                          <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                          <p className="text-sm text-gray-500 italic">No cameras added yet</p>
                          <button
                            onClick={() => setActiveTab("locations")}
                            className="mt-3 text-sm text-orange-600 hover:text-orange-700 font-medium"
                          >
                            Add Your First Camera
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Assets Overview */}
                    <div className="bg-gradient-to-br from-cyan-50 to-sky-50 rounded-xl p-6 border border-cyan-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-cyan-600 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                          <h3 className="text-lg font-bold text-gray-900">Assets ({assets.length})</h3>
                        </div>
                        <button
                          onClick={() => setActiveTab("assets")}
                          className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
                        >
                          View All →
                        </button>
                      </div>
                      {assets.length > 0 ? (
                        <div className="space-y-3">
                          {assets.slice(0, 5).map((asset) => (
                            <div key={asset.id} className="bg-white rounded-lg p-4 border border-cyan-100">
                              <div className="flex items-start gap-3">
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded border ${getAssetCategoryColor(
                                    asset.category
                                  )}`}
                                >
                                  {getAssetCategoryIcon(asset.category)} {asset.category}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-semibold text-gray-900 truncate" title={asset.fileName}>
                                    {asset.fileName}
                                  </h4>
                                  {asset.description && (
                                    <p className="text-xs text-gray-600 mt-1 line-clamp-1">{asset.description}</p>
                                  )}
                                  <div className="mt-1 text-xs text-gray-500">
                                    {(asset.fileSize / 1024).toFixed(1)} KB •{" "}
                                    {new Date(asset.uploadedAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-white rounded-lg p-8 border border-cyan-100 text-center">
                          <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                          </svg>
                          <p className="text-sm text-gray-500 italic">No assets uploaded yet</p>
                          <button
                            onClick={() => setActiveTab("assets")}
                            className="mt-3 text-sm text-cyan-600 hover:text-cyan-700 font-medium"
                          >
                            Upload Your First Asset
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "objectives" && (
                <motion.div
                  key="objectives"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Objectives</h3>
                    <Button size="sm" onClick={() => setShowObjectiveModal(true)}>
                      + Add Objective
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {objectives.map((obj) => (
                      <div
                        key={obj.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{obj.title}</h4>
                            {obj.description && <p className="text-sm text-gray-600 mt-1">{obj.description}</p>}
                            
                            {/* Success Criteria Display */}
                            {obj.successCriteria && (
                              <div className="mt-3 flex items-center gap-2 text-xs">
                                <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-md px-2 py-1">
                                  <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="font-semibold text-green-700">Target: {obj.successCriteria.targetPercentage}%</span>
                                </div>
                                <span className="text-gray-600 line-clamp-1">{obj.successCriteria.description}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={obj.status}
                              onChange={(e) => handleUpdateObjectiveStatus(obj.id, e.target.value as ObjectiveStatus)}
                              className="text-sm border border-gray-300 rounded px-3 py-2"
                            >
                              <option value="pending">Pending</option>
                              <option value="in-progress">In Progress</option>
                              <option value="completed">Completed</option>
                              <option value="blocked">Blocked</option>
                            </select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/pilots/${id}/objectives/${obj.id}`)}
                            >
                              Setup
                            </Button>
                            <button
                              onClick={() => handleDeleteObjective(obj.id)}
                              className="text-red-600 hover:text-red-700 p-2"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "locations" && (
                <motion.div
                  key="locations"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Locations & Cameras</h3>
                    <div className="text-sm text-gray-600">
                      {locations.length} location{locations.length !== 1 ? 's' : ''} • {cameras.length} camera{cameras.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {locations.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
                      <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">No Locations Yet</h4>
                      <p className="text-sm text-gray-600 mb-4">Locations need to be added during pilot creation</p>
                      <p className="text-xs text-gray-500">Edit pilot details to add locations</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {locations.map((location) => {
                        const locationCameras = cameras.filter(c => c.locationId === location.id);
                        
                        return (
                          <div key={location.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            {/* Location Header */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                  </div>
                                  <div>
                                    <h4 className="text-lg font-bold text-gray-900">{location.name}</h4>
                                    <p className="text-sm text-gray-600">{location.cityRegion}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <div className="text-2xl font-bold text-blue-600">{locationCameras.length}</div>
                                    <div className="text-xs text-gray-600">Camera{locationCameras.length !== 1 ? 's' : ''}</div>
                                  </div>
                                  <span className={`px-3 py-1 text-xs font-medium rounded-full border ${
                                    location.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                                    location.status === 'inactive' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                                    'bg-yellow-50 text-yellow-700 border-yellow-200'
                                  }`}>
                                    {location.status}
                                  </span>
                                  <Button 
                                    size="sm" 
                                    onClick={() => {
                                      setSelectedLocationId(location.id);
                                      setShowCameraModal(true);
                                    }}
                                  >
                                    + Add Camera
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {/* Cameras Grid */}
                            <div className="p-6">
                              {locationCameras.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {locationCameras.map((camera) => (
                                    <div
                                      key={camera.id}
                                      className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-all shadow-sm hover:shadow-md"
                                    >
                                      {/* Camera Header */}
                                      <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1 min-w-0">
                                          <h5 className="text-base font-semibold text-gray-900 truncate">{camera.name}</h5>
                                          {camera.notes && (
                                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{camera.notes}</p>
                                          )}
                                        </div>
                                        <div className="flex gap-1 ml-2">
                                          <button
                                            onClick={() => {
                                              setEditingCameraId(camera.id);
                                              setSelectedLocationId(camera.locationId);
                                              setNewCamera({
                                                name: camera.name,
                                                comments: camera.notes || "",
                                                status: camera.status,
                                                frames: [],
                                              });
                                              setShowCameraModal(true);
                                            }}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                            title="Edit camera"
                                          >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                          </button>
                                          <button
                                            onClick={() => handleDeleteCamera(camera.id)}
                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                            title="Delete camera"
                                          >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                          </button>
                                        </div>
                                      </div>

                                      {/* Status Badge */}
                                      <div className="mb-3">
                                        <span className={`px-2 py-1 text-xs font-medium rounded border ${getCameraStatusBadgeStyle(camera.status)}`}>
                                          {camera.status}
                                        </span>
                                      </div>

                                      {/* Frames Section */}
                                      <div>
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-xs font-medium text-gray-700">
                                            Frames ({camera.frames.length})
                                          </span>
                                          <button
                                            onClick={() => setSelectedCameraForFrames(selectedCameraForFrames === camera.id ? null : camera.id)}
                                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                          >
                                            {selectedCameraForFrames === camera.id ? "Close" : "+ Add"}
                                          </button>
                                        </div>

                                        {selectedCameraForFrames === camera.id && (
                                          <div className="mb-2">
                                            <FileUploadZone
                                              onFilesSelected={(files) => {
                                                handleAddCameraFrames(camera.id, files);
                                                setSelectedCameraForFrames(null);
                                              }}
                                              accept={{ "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"] }}
                                              multiple={true}
                                              maxSize={10 * 1024 * 1024}
                                            >
                                              <div className="space-y-1">
                                                <div className="text-xl">📸</div>
                                                <p className="text-[10px] text-gray-700 font-medium">Upload frames</p>
                                                <p className="text-[9px] text-gray-500">Drag & drop or click</p>
                                              </div>
                                            </FileUploadZone>
                                          </div>
                                        )}

                                        {camera.frames.length > 0 ? (
                                          <div className="grid grid-cols-3 gap-1.5">
                                            {camera.frames.slice(0, 6).map((frame) => (
                                              <div key={frame.id} className="relative group">
                                                <img
                                                  src={frame.fileUrl}
                                                  alt={frame.fileName}
                                                  className="w-full h-16 object-cover rounded border border-gray-200"
                                                />
                                                {frame.isPrimary && (
                                                  <div className="absolute top-0.5 left-0.5 bg-blue-600 text-white text-[10px] px-1 py-0.5 rounded">
                                                    Primary
                                                  </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                                  {!frame.isPrimary && (
                                                    <button
                                                      onClick={() => handleSetPrimaryFrame(camera.id, frame.id)}
                                                      className="p-1 bg-white rounded text-blue-600 hover:bg-blue-50"
                                                      title="Set as primary"
                                                    >
                                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                      </svg>
                                                    </button>
                                                  )}
                                                  <button
                                                    onClick={() => handleRemoveFrame(camera.id, frame.id)}
                                                    className="p-1 bg-white rounded text-red-600 hover:bg-red-50"
                                                    title="Remove frame"
                                                  >
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                  </button>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <p className="text-xs text-gray-500 italic">No frames</p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                  <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                  <p className="text-sm text-gray-600 font-medium">No cameras at this location</p>
                                  <button
                                    onClick={() => {
                                      setSelectedLocationId(location.id);
                                      setShowCameraModal(true);
                                    }}
                                    className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                                  >
                                    + Add Your First Camera
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "assets" && (
                <motion.div
                  key="assets"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Assets ({assets.length})</h3>
                    <Button onClick={() => setShowAssetModal(true)}>+ Upload Assets</Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {assets.map((asset) => (
                      <div
                        key={asset.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <span className={`text-xs px-2 py-1 rounded border ${getAssetCategoryColor(asset.category)}`}>
                            {getAssetCategoryIcon(asset.category)} {asset.category}
                          </span>
                          <div className="flex items-center gap-1">
                            {asset.fileType.startsWith("image/") && (
                              <button
                                onClick={() => {
                                  setSelectedAssetToMove(asset);
                                  setShowMoveAssetModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-700 p-1"
                                title="Move to Camera Frame"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                  />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteAsset(asset.id)}
                              className="text-red-600 hover:text-red-700 p-1"
                              title="Delete Asset"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {asset.fileType.startsWith("image/") && (
                          <img
                            src={asset.fileUrl}
                            alt={asset.fileName}
                            className="w-full h-32 object-cover rounded mb-3"
                          />
                        )}

                        <h4 className="font-medium text-gray-900 text-sm mb-1 truncate" title={asset.fileName}>
                          {asset.fileName}
                        </h4>

                        {asset.description && <p className="text-xs text-gray-600 mb-2">{asset.description}</p>}

                        {asset.remarks && <p className="text-xs text-gray-500 italic mb-2">"{asset.remarks}"</p>}

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                          <span className="text-xs text-gray-500">{(asset.fileSize / 1024).toFixed(1)} KB</span>
                          <button
                            onClick={() => handleDownloadAsset(asset)}
                            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                              />
                            </svg>
                            Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {assets.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <p className="text-gray-500">No assets uploaded yet</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "activity" && (
                <motion.div
                  key="activity"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {remarks.filter((r) => r.isSystem).length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Activity Yet</h3>
                      <p className="text-gray-500">Activity will appear here as you work on this pilot</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute left-[104px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-purple-200 to-pink-200"></div>

                      <div className="space-y-6">
                        {remarks
                          .filter((r) => r.isSystem)
                          .map((remark, index) => {
                            const user = users.find((u) => u.email === remark.createdBy);
                            const userName = user ? user.name : remark.createdBy.split('@')[0];
                            const activityEmoji = getActivityEmoji(remark.type);
                            const activityColor = getActivityColor(remark.type);

                            return (
                              <motion.div
                                key={remark.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="relative flex items-start gap-4"
                              >
                                {/* Accurate time on left */}
                                <div className="w-20 flex-shrink-0 text-right pt-1">
                                  <span className="text-xs font-medium text-gray-600">{formatDate(remark.createdAt)}</span>
                                </div>

                                {/* Timeline dot */}
                                <div
                                  className={`w-5 h-5 flex-shrink-0 rounded-full border-4 border-white shadow-lg ${activityColor} relative z-10`}
                                ></div>

                                {/* Activity card */}
                                <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all">
                                  <div className="p-4">
                                    {/* Header with emoji and content */}
                                    <div className="flex items-start gap-3 mb-3">
                                      <span className="text-2xl flex-shrink-0 mt-0.5">{activityEmoji}</span>
                                      <div className="flex-1">
                                        <p className="text-gray-800 leading-relaxed">{remark.text}</p>
                                      </div>
                                    </div>

                                    {/* Footer with user and relative time */}
                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                      <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                          <span className="text-white text-xs font-semibold">
                                            {userName.charAt(0).toUpperCase()}
                                          </span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">{userName}</span>
                                      </div>
                                      <span className="text-xs text-gray-500">{formatRelativeTime(remark.createdAt)}</span>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "comments" && (
                <motion.div
                  key="comments"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {/* Header with comment count */}
                  <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      Conversations
                      {comments.length > 0 && (
                        <span className="ml-2 px-2.5 py-0.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                          {comments.length}
                        </span>
                      )}
                    </h3>
                  </div>

                  {/* Comments List */}
                  {comments.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Comments Yet</h3>
                      <p className="text-gray-500 mb-4">Be the first to start a conversation about this pilot</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {comments.map((comment) => {
                        const replies = getRepliesForComment(comment.id);
                        const isReplying = replyingTo === comment.id;

                        return (
                          <div key={comment.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            {/* Main Comment */}
                            <div className="p-6">
                              <div className="flex items-start gap-4">
                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                                  <span className="text-white text-sm font-semibold">
                                    {comment.userName.charAt(0).toUpperCase()}
                                  </span>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-3 mb-2">
                                    <span className="font-semibold text-gray-900">{comment.userName}</span>
                                    <span className="text-sm text-gray-500">{formatRelativeTime(comment.createdAt)}</span>
                                    {comment.updatedAt && (
                                      <span className="text-xs text-gray-400 italic">(edited)</span>
                                    )}
                                  </div>
                                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{comment.content}</p>

                                  {/* Reply Button */}
                                  <button
                                    onClick={() => setReplyingTo(isReplying ? null : comment.id)}
                                    className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                                      />
                                    </svg>
                                    {isReplying ? "Cancel" : "Reply"}
                                  </button>

                                  {/* Reply Input */}
                                  {isReplying && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="mt-4 space-y-3"
                                    >
                                      <textarea
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        placeholder="Write your reply..."
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                        autoFocus
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                                            handleAddReply(comment.id);
                                          }
                                        }}
                                      />
                                      <div className="flex justify-end gap-2">
                                        <button
                                          onClick={() => {
                                            setReplyingTo(null);
                                            setReplyContent("");
                                          }}
                                          className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          onClick={() => handleAddReply(comment.id)}
                                          disabled={!replyContent.trim()}
                                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                                        >
                                          Reply
                                        </button>
                                      </div>
                                    </motion.div>
                                  )}
                                </div>
                              </div>

                              {/* Replies */}
                              {replies.length > 0 && (
                                <div className="mt-6 ml-14 space-y-4 pl-6 border-l-2 border-gray-200">
                                  {replies.map((reply) => (
                                    <div key={reply.id} className="flex items-start gap-3">
                                      {/* Reply Avatar */}
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                                        <span className="text-white text-xs font-semibold">
                                          {reply.userName.charAt(0).toUpperCase()}
                                        </span>
                                      </div>

                                      {/* Reply Content */}
                                      <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                          <span className="font-semibold text-gray-900 text-sm">{reply.userName}</span>
                                          <span className="text-xs text-gray-500">{formatRelativeTime(reply.createdAt)}</span>
                                          {reply.updatedAt && (
                                            <span className="text-xs text-gray-400 italic">(edited)</span>
                                          )}
                                        </div>
                                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{reply.content}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Sticky Add Comment Section at Bottom */}
                  <div className="sticky bottom-0 bg-white pt-4 mt-6 border-t-2 border-gray-200">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4">
                      <div className="flex items-start gap-3">
                        {/* User Avatar */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm font-semibold">
                            {authState.user?.name.charAt(0).toUpperCase() || "U"}
                          </span>
                        </div>

                        {/* Input Area */}
                        <div className="flex-1">
                          <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Share updates, ask questions, or provide feedback..."
                            rows={2}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                                handleAddComment();
                              }
                            }}
                          />
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              💡 {navigator.platform.includes("Mac") ? "Cmd" : "Ctrl"} + Enter to send
                            </span>
                            <button
                              onClick={handleAddComment}
                              disabled={!newComment.trim()}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                              Post
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Objective Modal */}
      {showObjectiveModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Add New Objective</h2>
              <button
                type="button"
                onClick={() => {
                  setShowObjectiveModal(false);
                  setNewObjective({ title: "", description: "", priority: "medium" });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <Input
                label="Title"
                placeholder="e.g., Wait time reduction"
                value={newObjective.title}
                onChange={(e) => setNewObjective({ ...newObjective, title: e.target.value })}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={newObjective.priority}
                  onChange={(e) => setNewObjective({ ...newObjective, priority: e.target.value as ObjectivePriority })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                <textarea
                  placeholder="Add details about this objective..."
                  value={newObjective.description}
                  onChange={(e) => setNewObjective({ ...newObjective, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowObjectiveModal(false);
                  setNewObjective({ title: "", description: "", priority: "medium" });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateObjective}>Add Objective</Button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{editingCameraId ? "Edit Camera" : "Add New Camera"}</h2>
              <button
                type="button"
                onClick={() => {
                  setShowCameraModal(false);
                  setEditingCameraId(null);
                  setNewCamera({ name: "", comments: "", status: "planned", frames: [] });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-5">
              <Input
                label="Camera Name"
                placeholder="e.g., Entrance Camera, Footfall Counting"
                value={newCamera.name}
                onChange={(e) => setNewCamera({ ...newCamera, name: e.target.value })}
                required
              />

              <div>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Comments (Optional)</label>
                <textarea
                  placeholder="Add any description or notes about this camera..."
                  value={newCamera.comments}
                  onChange={(e) => setNewCamera({ ...newCamera, comments: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {!editingCameraId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload Frames (Optional)</label>
                  <FileUploadZone
                    onFilesSelected={(files) => {
                      setNewCamera({ ...newCamera, frames: files });
                      toast.success(`${files.length} frame(s) selected`);
                    }}
                    accept={{ "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"] }}
                    multiple={true}
                    maxSize={10 * 1024 * 1024}
                  >
                    <div className="space-y-2">
                      <div className="text-4xl">📸</div>
                      <p className="text-gray-700 font-medium">Upload camera frames</p>
                      <p className="text-sm text-gray-500">Multiple files supported • Max 10MB per file</p>
                      <p className="text-xs text-gray-400">Drag & drop or click to select</p>
                    </div>
                  </FileUploadZone>
                  {newCamera.frames.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-700 font-medium">
                        ✓ {newCamera.frames.length} frame(s) ready to upload
                      </p>
                      <button
                        type="button"
                        onClick={() => setNewCamera({ ...newCamera, frames: [] })}
                        className="text-xs text-blue-600 hover:text-blue-700 mt-1"
                      >
                        Clear selection
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCameraModal(false);
                  setEditingCameraId(null);
                  setNewCamera({ name: "", comments: "", status: "planned", frames: [] });
                }}
              >
                Cancel
              </Button>
              <Button onClick={editingCameraId ? handleUpdateCamera : handleCreateCamera}>
                {editingCameraId ? "Update Camera" : "Add Camera"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Asset Modal */}
      {showAssetModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Upload Assets</h2>
              <button
                type="button"
                onClick={() => {
                  setShowAssetModal(false);
                  setNewAsset({ title: "", category: "other", description: "", remarks: "" });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <Input
                label="Title"
                placeholder="Asset title"
                value={newAsset.title}
                onChange={(e) => setNewAsset({ ...newAsset, title: e.target.value })}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={newAsset.category}
                  onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value as AssetCategory })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="contract">📄 Contract</option>
                  <option value="diagram">📊 Diagram</option>
                  <option value="photo">📷 Photo</option>
                  <option value="report">📈 Report</option>
                  <option value="other">📎 Other</option>
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
                  placeholder="Additional notes..."
                  value={newAsset.remarks}
                  onChange={(e) => setNewAsset({ ...newAsset, remarks: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <FileUploadZone
                onFilesSelected={async (files) => {
                  if (!pilot?.id || !authState.user || files.length === 0) return;

                  const file = files[0];
                  try {
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                      const base64String = reader.result as string;

                      const asset = await createAsset({
                        pilotId: pilot.id,
                        title: newAsset.title || file.name,
                        fileName: file.name,
                        fileType: file.type,
                        fileSize: file.size,
                        fileUrl: base64String,
                        category: newAsset.category,
                        description: newAsset.description,
                        remarks: newAsset.remarks,
                        uploadedBy: authState.user!.email,
                      });

                      setAssets([...assets, asset]);
                      toast.success("Asset uploaded successfully");
                      setShowAssetModal(false);
                      setNewAsset({ title: "", category: "other", description: "", remarks: "" });
                    };
                    reader.readAsDataURL(file);
                  } catch (error) {
                    console.error("Error uploading asset:", error);
                    toast.error("Failed to upload asset");
                  }
                }}
                accept={{
                  "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
                  "application/pdf": [".pdf"],
                  "application/msword": [".doc", ".docx"],
                  "application/vnd.ms-excel": [".xls", ".xlsx"],
                  "text/*": [".txt", ".csv"],
                }}
                multiple={false}
                maxSize={50 * 1024 * 1024}
              >
                <div className="space-y-2">
                  <div className="text-4xl">📎</div>
                  <p className="text-gray-700 font-medium">Drag & drop file here, or click to select</p>
                  <p className="text-sm text-gray-500">Max 50MB per file</p>
                  <p className="text-xs text-gray-400">Supports: Images, PDFs, Documents, Spreadsheets</p>
                </div>
              </FileUploadZone>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAssetModal(false);
                  setNewAsset({ title: "", category: "other", description: "", remarks: "" });
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* AI Summary Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">AI-Generated Summary</h2>
                  <p className="text-xs text-gray-500">Pilot overview and activity analysis</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSummaryModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Executive Summary */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">📊 Executive Summary</h3>
                <p className="text-gray-700 leading-relaxed">
                  The <strong>{pilot?.name}</strong> pilot is currently in <strong>{pilot?.status}</strong> status with{" "}
                  <strong>{objectives.length}</strong> objectives defined. The project shows promising progress with{" "}
                  {cameras.length} cameras deployed across {pilot?.locationName}. The team has uploaded {assets.length}{" "}
                  assets and maintained active collaboration through {remarks.length} activity entries. Overall progress
                  stands at <strong>{progress}%</strong> completion.
                </p>
              </div>

              {/* Key Metrics */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">📈 Key Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">{objectives.length}</div>
                    <div className="text-sm text-gray-600">Objectives</div>
                    <div className="text-xs text-gray-500 mt-1">2 in progress</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <div className="text-2xl font-bold text-purple-600">{cameras.length}</div>
                    <div className="text-sm text-gray-600">Cameras</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {cameras.filter((c) => c.status === "active").length} active
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="text-2xl font-bold text-green-600">{assets.length}</div>
                    <div className="text-sm text-gray-600">Assets</div>
                    <div className="text-xs text-gray-500 mt-1">Documents & media</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <div className="text-2xl font-bold text-orange-600">{assignedUsers.length}</div>
                    <div className="text-sm text-gray-600">Team Members</div>
                    <div className="text-xs text-gray-500 mt-1">Actively involved</div>
                  </div>
                </div>
              </div>

              {/* Activity Timeline */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">⏱️ Activity Timeline</h3>
                <div className="space-y-3">
                  <div className="flex gap-4 pb-3 border-b border-gray-200">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">Pilot Created</span>
                        <span className="text-xs text-gray-500">2 days ago</span>
                      </div>
                      <p className="text-sm text-gray-600">Initial pilot setup completed with basic configuration</p>
                    </div>
                  </div>

                  <div className="flex gap-4 pb-3 border-b border-gray-200">
                    <div className="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">Cameras Added</span>
                        <span className="text-xs text-gray-500">1 day ago</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {cameras.length} camera(s) configured with frames uploaded
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 pb-3 border-b border-gray-200">
                    <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">Objectives Defined</span>
                        <span className="text-xs text-gray-500">18 hours ago</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Team established {objectives.length} key objective(s) for tracking
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 pb-3 border-b border-gray-200">
                    <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">Assets Uploaded</span>
                        <span className="text-xs text-gray-500">12 hours ago</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {assets.length} asset(s) added including contracts, diagrams, and photos
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-2 h-2 bg-pink-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">Team Collaboration</span>
                        <span className="text-xs text-gray-500">6 hours ago</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Active discussions and updates with {assignedUsers.length} team member(s)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">💡 AI Recommendations</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">•</span>
                    <span>Complete ROI configuration for all camera frames to maximize analytics accuracy</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">•</span>
                    <span>Update objective status regularly to maintain accurate progress tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">•</span>
                    <span>Schedule regular team syncs to align on priorities and blockers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">•</span>
                    <span>Consider adding more documentation assets for better stakeholder visibility</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
              <button
                onClick={() => setShowSummaryModal(false)}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move Asset to Camera Modal */}
      {showMoveAssetModal && selectedAssetToMove && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Move Asset to Camera Frame</h2>
              <button
                type="button"
                onClick={() => {
                  setShowMoveAssetModal(false);
                  setSelectedAssetToMove(null);
                  setSelectedCameraForMove(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Asset Preview */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-3">Moving asset:</p>
              <div className="flex items-center gap-4">
                {selectedAssetToMove.fileType.startsWith("image/") && (
                  <img
                    src={selectedAssetToMove.fileUrl}
                    alt={selectedAssetToMove.fileName}
                    className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                  />
                )}
                <div>
                  <p className="font-medium text-gray-900">{selectedAssetToMove.fileName}</p>
                  <p className="text-sm text-gray-500">{(selectedAssetToMove.fileSize / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            </div>

            {/* Camera Selection */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Camera to add this frame to:
                </label>
                
                {locations.length > 0 ? (
                  <div className="space-y-4">
                    {locations.map((location) => {
                      const locationCameras = cameras.filter((c) => c.locationId === location.id);
                      if (locationCameras.length === 0) return null;

                      return (
                        <div key={location.id} className="border border-gray-200 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            {location.name}
                          </h4>
                          <div className="space-y-2">
                            {locationCameras.map((camera) => (
                              <label
                                key={camera.id}
                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                  selectedCameraForMove === camera.id
                                    ? "bg-blue-50 border-2 border-blue-500"
                                    : "bg-white border border-gray-200 hover:border-blue-300"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="camera"
                                  value={camera.id}
                                  checked={selectedCameraForMove === camera.id}
                                  onChange={(e) => setSelectedCameraForMove(e.target.value)}
                                  className="w-4 h-4 text-blue-600"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                      />
                                    </svg>
                                    <span className="font-medium text-gray-900">{camera.name}</span>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {camera.frames.length} frame(s) • {camera.status}
                                  </p>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No locations or cameras available.</p>
                    <p className="text-sm mt-2">Please add cameras to locations first.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-yellow-800">Note</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    This will move the asset to the selected camera's frames and remove it from the assets list.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowMoveAssetModal(false);
                  setSelectedAssetToMove(null);
                  setSelectedCameraForMove(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleMoveAssetToCamera} disabled={!selectedCameraForMove}>
                Move to Camera
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Pilot Details Modal */}
      {showEditPilotModal && pilot && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Edit Pilot Dates</h2>
              <button
                type="button"
                onClick={() => setShowEditPilotModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={editPilotData.startDate}
                  onChange={(e) => setEditPilotData({ ...editPilotData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expected End Date</label>
                <input
                  type="date"
                  value={editPilotData.expectedEndDate}
                  onChange={(e) => setEditPilotData({ ...editPilotData, expectedEndDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Optional: Leave empty if not determined yet</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowEditPilotModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdatePilotDates}>
                Update Dates
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
