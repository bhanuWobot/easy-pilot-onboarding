import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { nanoid } from "nanoid";
import toast from "react-hot-toast";
import { useOnboardingBuilder } from "../contexts/OnboardingBuilderContext";
import { ConfigForm } from "../components/builder/ConfigForm";
import { WelcomePagePreview } from "../components/preview/WelcomePagePreview";
import { copyToClipboard } from "../utils/linkGenerator";
import { createPilot, generatePilotLink } from "../utils/db";
import { getAllCustomers, createCustomer } from "../utils/customerDb";
import { getAllUsers } from "../utils/userDb";
import { createLocations } from "../utils/locationDb";
import { getAllContacts, createContact } from "../utils/contactDb";
import { createAsset } from "../utils/assetDb";
import { createRemark } from "../utils/remarkDb";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/shared/Button";
import { Input } from "../components/shared/Input";
import { Toggle } from "../components/shared/Toggle";
import MultiSelect from "../components/shared/MultiSelect";
import type { Customer } from "../types/customer";
import type { User } from "../types/auth";
import type { CreateLocationData } from "../types/location";
import type { Contact } from "../types/contact";
import type { AssetCategory } from "../types/asset";

export function CreatePilotPage() {
  const navigate = useNavigate();
  const { state: onboardingState, dispatch } = useOnboardingBuilder();
  const { state: authState } = useAuth();
  const [shareableLink, setShareableLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // New state for customer data collection mode
  const [enableCustomerLink, setEnableCustomerLink] = useState(false);

  // Customer state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Basic pilot fields (internal use)
  const [pilotData, setPilotData] = useState({
    name: "",
    company: "",
    contactEmail: "",
    description: "",
    startDate: new Date().toISOString().split("T")[0],
    expectedEndDate: "",
    status: "active" as "draft" | "active" | "completed",
  });

  // Locations state
  const [locations, setLocations] = useState<(CreateLocationData & { tempId: string })[]>([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [newLocationData, setNewLocationData] = useState({
    name: "",
    cityRegion: "",
    cameraCount: "",
    status: "active" as "active" | "inactive" | "planned",
  });

  // Contact state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [contactSearchQuery, setContactSearchQuery] = useState("");
  const [isContactDropdownOpen, setIsContactDropdownOpen] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [newContactData, setNewContactData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    jobTitle: "",
    notes: "",
  });

  // Assets state
  const [assets, setAssets] = useState<
    Array<{
      tempId: string;
      title: string;
      description: string;
      category: AssetCategory;
      file?: File;
      fileUrl?: string;
      fileName?: string;
      fileType?: string;
      fileSize?: number;
    }>
  >([]);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [newAssetData, setNewAssetData] = useState<{
    title: string;
    description: string;
    category: AssetCategory;
    file?: File;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    fileSize?: number;
  }>({
    title: "",
    description: "",
    category: "other" as AssetCategory,
  });

  // Remarks state
  const [initialRemarks, setInitialRemarks] = useState("");

  // New customer form data
  const [newCustomerData, setNewCustomerData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    title: "",
    timezone: "",
  });

  // Load customers and users
  useEffect(() => {
    const loadData = async () => {
      try {
        const [customersData, usersData, contactsData] = await Promise.all([
          getAllCustomers(),
          getAllUsers(),
          getAllContacts(),
        ]);
        setCustomers(customersData);
        setUsers(usersData);

        // Hardcoded default contacts
        const defaultContacts: Contact[] = [
          {
            id: "default-1",
            name: "John Smith",
            email: "john.smith@company.com",
            phone: "+1 (555) 123-4567",
            company: "Tech Solutions Inc",
            jobTitle: "Operations Manager",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "default-2",
            name: "Sarah Johnson",
            email: "sarah.j@enterprise.com",
            phone: "+1 (555) 234-5678",
            company: "Enterprise Corp",
            jobTitle: "Director of IT",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "default-3",
            name: "Michael Chen",
            email: "mchen@retail.com",
            phone: "+1 (555) 345-6789",
            company: "Retail Group",
            jobTitle: "Security Lead",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "default-4",
            name: "Emily Rodriguez",
            email: "e.rodriguez@logistics.com",
            phone: "+1 (555) 456-7890",
            company: "Logistics Partners",
            jobTitle: "VP of Operations",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];

        // Merge hardcoded contacts with database contacts
        setContacts([...defaultContacts, ...contactsData]);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load customers, users, and contacts");
      }
    };
    loadData();
  }, []);

  // Sync company name between basic form and config form
  useEffect(() => {
    if (enableCustomerLink && pilotData.name) {
      dispatch({
        type: "UPDATE_CONFIG",
        payload: { pilotName: pilotData.name },
      });
    }
  }, [enableCustomerLink, pilotData.name, dispatch]);

  const handleCreatePilot = async () => {
    if (!authState.user) {
      toast.error("User not authenticated");
      return;
    }

    setIsLoading(true);
    try {
      // Validate pilot name
      if (!pilotData.name.trim()) {
        toast.error("Please enter a pilot name");
        setIsLoading(false);
        return;
      }

      // Validate at least one location
      const validLocations = locations.filter((loc) => loc.name.trim());
      if (validLocations.length === 0) {
        toast.error("Please add at least one location");
        setIsLoading(false);
        return;
      }

      // Prepare customer data if creating new customer
      let customerDataToSave = undefined;
      if (showCreateCustomer) {
        if (!newCustomerData.name.trim() || !newCustomerData.email.trim()) {
          toast.error("Please enter customer name and email");
          setIsLoading(false);
          return;
        }
        customerDataToSave = newCustomerData;
      }

      // Create locations first
      const createdLocations = await createLocations(validLocations.map(({ tempId, ...loc }) => loc));
      const locationIds = createdLocations.map((loc) => loc.id);

      // Prepare pilot record (keeping old fields for backward compatibility)
      const firstLocation = validLocations[0];
      const pilotRecord = {
        ...onboardingState.config,
        name: pilotData.name,
        company: pilotData.company,
        contactEmail: pilotData.contactEmail,
        // Old fields for backward compatibility
        location: firstLocation.cityRegion,
        locationName: firstLocation.name,
        cameraCount: firstLocation.cameraCount,
        // New fields
        locationIds,
        contactId: selectedContactId || undefined,
        assetIds: [], // Will be populated after assets are created
        startDate: pilotData.startDate,
        expectedEndDate: pilotData.expectedEndDate || undefined,
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

      // Create assets after pilot is created (so we have pilot ID)
      const validAssets = assets.filter((asset) => asset.title.trim());
      const assetIds: string[] = [];

      for (const asset of validAssets) {
        if (!asset.title.trim()) {
          continue; // Skip assets without title
        }

        // For file uploads
        if (asset.file && asset.fileUrl) {
          try {
            const createdAsset = await createAsset({
              pilotId: result.pilot.id,
              title: asset.title,
              fileName: asset.fileName || asset.file.name,
              fileType: asset.fileType || asset.file.type,
              fileSize: asset.fileSize || asset.file.size,
              fileUrl: asset.fileUrl,
              category: asset.category,
              description: asset.description,
              uploadedBy: authState.user.email,
            });
            assetIds.push(createdAsset.id);
          } catch (error) {
            console.error("Error creating asset:", error);
            toast.error(`Failed to upload asset: ${asset.title}`);
          }
        } else if (asset.title.trim()) {
          // Text-only asset without file
          try {
            const createdAsset = await createAsset({
              pilotId: result.pilot.id,
              title: asset.title,
              fileName: "text-asset",
              fileType: "text/plain",
              fileSize: 0,
              fileUrl: "",
              category: asset.category,
              description: asset.description,
              uploadedBy: authState.user.email,
            });
            assetIds.push(createdAsset.id);
          } catch (error) {
            console.error("Error creating text asset:", error);
            toast.error(`Failed to create asset: ${asset.title}`);
          }
        }
      }

      // Create initial remark if provided
      if (initialRemarks.trim()) {
        try {
          await createRemark({
            pilotId: result.pilot.id,
            text: initialRemarks,
            type: "note",
            isSystem: false,
            createdBy: authState.user.email,
          });
        } catch (error) {
          console.error("Error creating initial remark:", error);
          // Don't fail the pilot creation if remark fails
        }
      }

      if (result.customer) {
        toast.success(`Pilot created with new customer: ${result.customer.name}`);
        // Refresh customers list
        const updatedCustomers = await getAllCustomers();
        setCustomers(updatedCustomers);
        setSelectedCustomerId(result.customer.id);
        setShowCreateCustomer(false);
      } else {
        toast.success("Pilot created successfully!");
      }

      if (enableCustomerLink) {
        const link = generatePilotLink(result.pilot.id);
        setShareableLink(link);
      }

      // Navigate to pilot details page
      navigate(`/pilots/${result.pilot.id}`);
    } catch (error) {
      toast.error("Failed to create pilot");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareableLink) {
      toast.error("Please generate a link first");
      return;
    }

    try {
      await copyToClipboard(shareableLink);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy link");
      console.error(error);
    }
  };

  const handleToggleCustomerLink = (enabled: boolean) => {
    setEnableCustomerLink(enabled);
    // Sync data when toggling
    if (enabled && pilotData.name) {
      dispatch({
        type: "UPDATE_CONFIG",
        payload: { pilotName: pilotData.name },
      });
    } else if (!enabled && onboardingState.config.pilotName) {
      setPilotData((prev) => ({
        ...prev,
        name: onboardingState.config.pilotName || prev.name,
      }));
    }
  };

  const handleAddLocation = () => {
    setEditingLocationId(null);
    setNewLocationData({
      name: "",
      cityRegion: "",
      cameraCount: "",
      status: "active",
    });
    setShowLocationModal(true);
  };

  const handleSaveLocation = () => {
    if (!newLocationData.name.trim()) {
      toast.error("Location name is required");
      return;
    }

    if (editingLocationId) {
      // Edit existing location
      setLocations(locations.map((loc) => (loc.tempId === editingLocationId ? { ...loc, ...newLocationData } : loc)));
      toast.success("Location updated successfully");
    } else {
      // Add new location
      setLocations([
        ...locations,
        {
          tempId: nanoid(10),
          ...newLocationData,
        },
      ]);
      toast.success("Location added successfully");
    }

    setShowLocationModal(false);
    setEditingLocationId(null);
    setNewLocationData({
      name: "",
      cityRegion: "",
      cameraCount: "",
      status: "active",
    });
  };

  const handleEditLocation = (location: CreateLocationData & { tempId: string }) => {
    setEditingLocationId(location.tempId);
    setNewLocationData({
      name: location.name,
      cityRegion: location.cityRegion,
      cameraCount: location.cameraCount,
      status: location.status,
    });
    setShowLocationModal(true);
  };

  const handleRemoveLocation = (tempId: string) => {
    setLocations(locations.filter((loc) => loc.tempId !== tempId));
    toast.success("Location removed");
  };

  // Contact handlers
  const handleCreateContact = async () => {
    if (!newContactData.name.trim()) {
      toast.error("Contact name is required");
      return;
    }

    try {
      const contact = createContact(newContactData);
      setContacts([...contacts, contact]);
      setSelectedContactId(contact.id);
      setShowContactModal(false);
      setNewContactData({
        name: "",
        email: "",
        phone: "",
        company: "",
        jobTitle: "",
        notes: "",
      });
      toast.success("Contact created successfully");
    } catch (error) {
      console.error("Error creating contact:", error);
      toast.error("Failed to create contact");
    }
  };

  // Asset handlers
  const handleAddAsset = () => {
    setEditingAssetId(null);
    setNewAssetData({
      title: "",
      description: "",
      category: "other" as AssetCategory,
    });
    setShowAssetModal(true);
  };

  const handleEditAsset = (asset: (typeof assets)[0]) => {
    setEditingAssetId(asset.tempId);
    setNewAssetData({
      title: asset.title,
      description: asset.description,
      category: asset.category,
      file: asset.file,
      fileUrl: asset.fileUrl,
      fileName: asset.fileName,
      fileType: asset.fileType,
      fileSize: asset.fileSize,
    });
    setShowAssetModal(true);
  };

  const handleSaveAsset = () => {
    if (!newAssetData.title.trim()) {
      toast.error("Asset title is required");
      return;
    }

    if (editingAssetId) {
      // Edit existing asset
      setAssets(assets.map((asset) => (asset.tempId === editingAssetId ? { ...asset, ...newAssetData } : asset)));
      toast.success("Asset updated successfully");
    } else {
      // Add new asset
      setAssets([
        ...assets,
        {
          tempId: nanoid(10),
          ...newAssetData,
        },
      ]);
      toast.success("Asset added successfully");
    }

    setShowAssetModal(false);
    setEditingAssetId(null);
    setNewAssetData({
      title: "",
      description: "",
      category: "other" as AssetCategory,
    });
  };

  const handleAssetModalFileChange = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setNewAssetData({
        ...newAssetData,
        file: file,
        fileUrl: base64String,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAsset = (tempId: string) => {
    setAssets(assets.filter((asset) => asset.tempId !== tempId));
    toast.success("Asset removed");
  };

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(contactSearchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(contactSearchQuery.toLowerCase()) ||
      contact.company?.toLowerCase().includes(contactSearchQuery.toLowerCase())
  );

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
                  ? "Configure customer onboarding experience and generate shareable link"
                  : "Set up a new customer pilot project"}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {shareableLink && (
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-lg px-4 py-2">
                  <span className="text-xs text-gray-600 max-w-xs truncate">{shareableLink}</span>
                  <Button size="sm" onClick={handleCopyLink}>
                    📋 Copy
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Customer Link</span>
                  <Toggle enabled={enableCustomerLink} onChange={handleToggleCustomerLink} />
                </div>
              </div>
              {/* <Button onClick={handleCreatePilot} disabled={isLoading}>
                {isLoading
                  ? "⏳ Creating..."
                  : enableCustomerLink
                  ? "Create Pilot & Generate Link"
                  : "Create Pilot"}
              </Button> */}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-8 py-8 pb-32">
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
                    onChange={(e) => setPilotData({ ...pilotData, name: e.target.value })}
                    required
                  />

                  <Input
                    label="Company"
                    placeholder="Enter customer company name"
                    value={pilotData.company}
                    onChange={(e) => setPilotData({ ...pilotData, company: e.target.value })}
                    required
                  />

                  <Input
                    label="Company Email"
                    type="email"
                    placeholder="customer@company.com"
                    value={pilotData.contactEmail}
                    onChange={(e) => setPilotData({ ...pilotData, contactEmail: e.target.value })}
                    required
                  />

                  <Input
                    label="Start Date"
                    type="date"
                    value={pilotData.startDate}
                    onChange={(e) => setPilotData({ ...pilotData, startDate: e.target.value })}
                  />

                  <Input
                    label="Expected End Date"
                    type="date"
                    value={pilotData.expectedEndDate}
                    onChange={(e) => setPilotData({ ...pilotData, expectedEndDate: e.target.value })}
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    placeholder="Brief description of the pilot project..."
                    value={pilotData.description}
                    onChange={(e) => setPilotData({ ...pilotData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              {/* Locations Section */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Locations</h3>
                  <Button variant="outline" onClick={handleAddLocation} className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Location
                  </Button>
                </div>

                {locations.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <svg
                      className="w-12 h-12 mx-auto text-gray-400 mb-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
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
                    <p className="text-sm text-gray-500">No locations added yet</p>
                    <p className="text-xs text-gray-400 mt-1">Click "Add Location" to add a location</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {locations.map((location) => (
                      <div
                        key={location.tempId}
                        className="group bg-white rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-all shadow-sm hover:shadow-md p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <svg
                                className="w-5 h-5 text-blue-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
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
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-gray-900">{location.name}</h4>
                                <span
                                  className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                    location.status === "active"
                                      ? "bg-green-100 text-green-700"
                                      : location.status === "inactive"
                                      ? "bg-gray-100 text-gray-700"
                                      : "bg-yellow-100 text-yellow-700"
                                  }`}
                                >
                                  {location.status.charAt(0).toUpperCase() + location.status.slice(1)}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600">
                                <span>{location.cityRegion || "No city/region"}</span>
                                <span className="mx-2">•</span>
                                <span>{location.cameraCount || "No camera count"}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => handleEditLocation(location)}
                              className="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50"
                              title="Edit location"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveLocation(location.tempId)}
                              className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50"
                              title="Remove location"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Customer Association */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Association</h3>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Select Customer</label>
                      <button
                        type="button"
                        onClick={() => setShowCustomerModal(true)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        + Create New Customer
                      </button>
                    </div>

                    {/* Dropdown Button */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                        className="w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors flex items-center justify-between"
                      >
                        {selectedCustomerId ? (
                          <div>
                            <div className="font-medium text-gray-900">
                              {customers.find((c) => c.id === selectedCustomerId)?.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {customers.find((c) => c.id === selectedCustomerId)?.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500">Select a customer...</span>
                        )}
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            isCustomerDropdownOpen ? "transform rotate-180" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Dropdown Menu */}
                      {isCustomerDropdownOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
                          {/* Search Input */}
                          <div className="p-2 border-b border-gray-200">
                            <input
                              type="text"
                              placeholder="Search customers..."
                              value={customerSearchQuery}
                              onChange={(e) => setCustomerSearchQuery(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>

                          {/* Customer List */}
                          <div className="max-h-64 overflow-y-auto">
                            {(customerSearchQuery ? filteredCustomers : customers).length > 0 ? (
                              (customerSearchQuery ? filteredCustomers : customers).map((customer) => (
                                <button
                                  key={customer.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedCustomerId(customer.id);
                                    setCustomerSearchQuery("");
                                    setIsCustomerDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                                    selectedCustomerId === customer.id ? "bg-blue-50" : ""
                                  }`}
                                >
                                  <div className="font-medium text-gray-900">{customer.name}</div>
                                  <div className="text-sm text-gray-500">
                                    {customer.email} {customer.company && `• ${customer.company}`}
                                  </div>
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-sm text-gray-500">No customers found</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
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

              {/* Contact Name */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Primary Contact</h3>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Select Contact</label>
                      <button
                        type="button"
                        onClick={() => setShowContactModal(true)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        + Create New Contact
                      </button>
                    </div>

                    {/* Dropdown Button */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsContactDropdownOpen(!isContactDropdownOpen)}
                        className="w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors flex items-center justify-between"
                      >
                        {selectedContactId ? (
                          <div>
                            <div className="font-medium text-gray-900">
                              {contacts.find((c) => c.id === selectedContactId)?.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {contacts.find((c) => c.id === selectedContactId)?.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500">Select a contact...</span>
                        )}
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            isContactDropdownOpen ? "transform rotate-180" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Dropdown Menu */}
                      {isContactDropdownOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
                          {/* Search Input */}
                          <div className="p-2 border-b border-gray-200">
                            <input
                              type="text"
                              placeholder="Search contacts..."
                              value={contactSearchQuery}
                              onChange={(e) => setContactSearchQuery(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>

                          {/* Contact List */}
                          <div className="max-h-64 overflow-y-auto">
                            {(contactSearchQuery ? filteredContacts : contacts).length > 0 ? (
                              (contactSearchQuery ? filteredContacts : contacts).map((contact) => (
                                <button
                                  key={contact.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedContactId(contact.id);
                                    setContactSearchQuery("");
                                    setIsContactDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                                    selectedContactId === contact.id ? "bg-blue-50" : ""
                                  }`}
                                >
                                  <div className="font-medium text-gray-900">{contact.name}</div>
                                  <div className="text-sm text-gray-500">
                                    {contact.email} {contact.company && `• ${contact.company}`}
                                  </div>
                                  {contact.jobTitle && <div className="text-xs text-gray-400">{contact.jobTitle}</div>}
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-sm text-gray-500">No contacts found</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Assets Section */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Assets</h3>
                  <Button variant="outline" onClick={handleAddAsset} className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Asset
                  </Button>
                </div>

                {assets.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <svg
                      className="w-12 h-12 mx-auto text-gray-400 mb-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-sm text-gray-500">No assets added yet</p>
                    <p className="text-xs text-gray-400 mt-1">Click "Add Asset" to upload files or add text assets</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {assets.map((asset) => (
                      <div
                        key={asset.tempId}
                        className="group bg-white rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-all shadow-sm hover:shadow-md p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                              <svg
                                className="w-5 h-5 text-purple-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-gray-900">{asset.title}</h4>
                                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                                  {asset.category.charAt(0).toUpperCase() + asset.category.slice(1)}
                                </span>
                              </div>
                              {asset.fileName && (
                                <div className="text-sm text-gray-600 mb-1">
                                  📎 {asset.fileName} ({(asset.fileSize! / 1024).toFixed(1)} KB)
                                </div>
                              )}
                              {asset.description && <p className="text-sm text-gray-600">{asset.description}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => handleEditAsset(asset)}
                              className="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50"
                              title="Edit asset"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveAsset(asset.tempId)}
                              className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50"
                              title="Remove asset"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Initial Remarks */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Initial Remarks</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add notes or comments about this pilot
                  </label>
                  <textarea
                    placeholder="Enter any initial notes, comments, or important information about this pilot..."
                    value={initialRemarks}
                    onChange={(e) => setInitialRemarks(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    This will be saved as a note and will appear in the pilot's activity log
                  </p>
                </div>
              </div>
            </div>

            {/* Fixed Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-lg z-50">
              <div className="max-w-4xl mx-auto px-8 py-4">
                <div className="flex items-center justify-end gap-3">
                  <Button variant="outline" onClick={() => navigate("/pilots")}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreatePilot} disabled={isLoading}>
                    {isLoading
                      ? "⏳ Creating..."
                      : enableCustomerLink
                      ? "Create Pilot & Generate Link"
                      : "Create Pilot"}
                  </Button>
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

      {/* Asset Modal */}
      {showAssetModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{editingAssetId ? "Edit Asset" : "Add New Asset"}</h2>
              <button
                type="button"
                onClick={() => {
                  setShowAssetModal(false);
                  setEditingAssetId(null);
                  setNewAssetData({
                    title: "",
                    description: "",
                    category: "other" as AssetCategory,
                  });
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
                value={newAssetData.title}
                onChange={(e) => setNewAssetData({ ...newAssetData, title: e.target.value })}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={newAssetData.category}
                  onChange={(e) =>
                    setNewAssetData({
                      ...newAssetData,
                      category: e.target.value as AssetCategory,
                    })
                  }
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
                <label className="block text-sm font-medium text-gray-700 mb-2">File Upload</label>
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleAssetModalFileChange(file);
                    }
                  }}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {newAssetData.fileName && (
                  <div className="mt-2 flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                      />
                    </svg>
                    <span className="text-sm text-gray-700">{newAssetData.fileName}</span>
                    <span className="text-xs text-gray-500">({(newAssetData.fileSize! / 1024).toFixed(1)} KB)</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  placeholder="Describe this asset..."
                  value={newAssetData.description}
                  onChange={(e) => setNewAssetData({ ...newAssetData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAssetModal(false);
                  setEditingAssetId(null);
                  setNewAssetData({
                    title: "",
                    description: "",
                    category: "other" as AssetCategory,
                  });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveAsset}>{editingAssetId ? "Update Asset" : "Add Asset"}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingLocationId ? "Edit Location" : "Add New Location"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowLocationModal(false);
                  setEditingLocationId(null);
                  setNewLocationData({
                    name: "",
                    cityRegion: "",
                    cameraCount: "",
                    status: "active",
                  });
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
                label="Location Name"
                placeholder="e.g., Main Office, Warehouse A"
                value={newLocationData.name}
                onChange={(e) => setNewLocationData({ ...newLocationData, name: e.target.value })}
                required
              />

              <Input
                label="City/Region"
                placeholder="e.g., Mumbai, Maharashtra"
                value={newLocationData.cityRegion}
                onChange={(e) => setNewLocationData({ ...newLocationData, cityRegion: e.target.value })}
              />

              <Input
                label="Camera Count"
                placeholder="e.g., 11-to-20"
                value={newLocationData.cameraCount}
                onChange={(e) => setNewLocationData({ ...newLocationData, cameraCount: e.target.value })}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={newLocationData.status}
                  onChange={(e) =>
                    setNewLocationData({
                      ...newLocationData,
                      status: e.target.value as "active" | "inactive" | "planned",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="planned">Planned</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowLocationModal(false);
                  setEditingLocationId(null);
                  setNewLocationData({
                    name: "",
                    cityRegion: "",
                    cameraCount: "",
                    status: "active",
                  });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveLocation}>{editingLocationId ? "Update Location" : "Add Location"}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Create New Contact</h2>
              <button
                type="button"
                onClick={() => {
                  setShowContactModal(false);
                  setNewContactData({
                    name: "",
                    email: "",
                    phone: "",
                    company: "",
                    jobTitle: "",
                    notes: "",
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Name"
                placeholder="John Doe"
                value={newContactData.name}
                onChange={(e) => setNewContactData({ ...newContactData, name: e.target.value })}
                required
              />

              <Input
                label="Email"
                type="email"
                placeholder="john@company.com"
                value={newContactData.email}
                onChange={(e) => setNewContactData({ ...newContactData, email: e.target.value })}
              />

              <Input
                label="Phone"
                value={newContactData.phone}
                onChange={(e) => setNewContactData({ ...newContactData, phone: e.target.value })}
              />

              <Input
                label="Company"
                placeholder="Company Name"
                value={newContactData.company}
                onChange={(e) => setNewContactData({ ...newContactData, company: e.target.value })}
              />

              <Input
                label="Job Title"
                placeholder="Director of Operations"
                value={newContactData.jobTitle}
                onChange={(e) => setNewContactData({ ...newContactData, jobTitle: e.target.value })}
              />

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  placeholder="Additional notes about this contact..."
                  value={newContactData.notes}
                  onChange={(e) => setNewContactData({ ...newContactData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowContactModal(false);
                  setNewContactData({
                    name: "",
                    email: "",
                    phone: "",
                    company: "",
                    jobTitle: "",
                    notes: "",
                  });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateContact}>Create Contact</Button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Create New Customer</h2>
              <button
                type="button"
                onClick={() => {
                  setShowCustomerModal(false);
                  setNewCustomerData({
                    name: "",
                    email: "",
                    phone: "",
                    company: "",
                    title: "",
                    timezone: "",
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Name"
                placeholder="John Doe"
                value={newCustomerData.name}
                onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
                required
              />

              <Input
                label="Email"
                type="email"
                placeholder="john@company.com"
                value={newCustomerData.email}
                onChange={(e) => setNewCustomerData({ ...newCustomerData, email: e.target.value })}
                required
              />

              <Input
                label="Phone"
                value={newCustomerData.phone}
                onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
              />

              <Input
                label="Company"
                placeholder="Company Name"
                value={newCustomerData.company}
                onChange={(e) => setNewCustomerData({ ...newCustomerData, company: e.target.value })}
              />

              <Input
                label="Title"
                placeholder="Director of Operations"
                value={newCustomerData.title}
                onChange={(e) => setNewCustomerData({ ...newCustomerData, title: e.target.value })}
              />

              <Input
                label="Timezone"
                placeholder="EST, PST, CST"
                value={newCustomerData.timezone}
                onChange={(e) => setNewCustomerData({ ...newCustomerData, timezone: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCustomerModal(false);
                  setNewCustomerData({
                    name: "",
                    email: "",
                    phone: "",
                    company: "",
                    title: "",
                    timezone: "",
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!newCustomerData.name.trim() || !newCustomerData.email.trim()) {
                    toast.error("Customer name and email are required");
                    return;
                  }

                  try {
                    const customer = await createCustomer(newCustomerData);
                    const updatedCustomers = await getAllCustomers();
                    setCustomers(updatedCustomers);
                    setSelectedCustomerId(customer.id);
                    setShowCustomerModal(false);
                    setNewCustomerData({
                      name: "",
                      email: "",
                      phone: "",
                      company: "",
                      title: "",
                      timezone: "",
                    });
                    toast.success("Customer created successfully");
                  } catch (error) {
                    console.error("Error creating customer:", error);
                    toast.error("Failed to create customer");
                  }
                }}
              >
                Create Customer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
