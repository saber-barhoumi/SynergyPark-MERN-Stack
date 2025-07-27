// src/hooks/useCompanyProfile.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Type definitions
interface User {
  id?: string;
  userId?: string;
  _id?: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

interface CompanyProfile {
  _id?: string;
  userId: string;
  
  // Basic Information
  consentGiven: boolean;
  companyName: string;
  founderName: string;
  email: string;
  phone?: string;
  companyCreationDate: string;
  
  // Activity & Domain
  activityDomain: string;
  activitySubDomain?: string;
  
  // Project & Progress
  projectProgress: string;
  stage?: string;
  
  // Staff & Organization
  staffRange: string;
  staffPositions?: string;
  
  // Approval & Status
  approval?: boolean;
  requestStatus?: string;
  responseDate?: string;
  
  // Labeling & Classification
  isLabeled?: boolean;
  labelType?: string;
  
  // Challenges & Barriers
  barriers?: string;
  otherBarriers?: string;
  
  // Support & Recommendations
  supportNeeded?: string;
  supportNeededOther?: string;
  recommendations?: string;
  
  // Company Identity
  slogan?: string;
  logo?: string;
  
  // Business Information
  businessPlanSummary?: string;
  marketAnalysis?: string;
  targetMarket?: string;
  competitors?: string;
  competitiveAdvantage?: string;
  riskFactors?: string;
  
  // Recognition & Values
  awards?: string;
  values?: string;
  
  // Additional Information
  longDescription?: string;
  website?: string;
  address?: string;
  
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

interface ProfileData {
  isStartup: boolean;
  hasProfile: boolean;
  isProfileComplete: boolean;
  profile: CompanyProfile | null;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface EnumData {
  ActivityDomain: Record<string, string>;
  ActivitySubDomain: Record<string, string>;
  ProjectProgress: Record<string, string>;
  StaffRange: Record<string, string>;
  RequestStatus: Record<string, string>;
  CompanyStage: Record<string, string>;
  LabelType: Record<string, string>;
  SupportNeeded: Record<string, string>;
}

interface CompanyProfileFormData {
  // Basic Information
  consentGiven: boolean;
  companyName: string;
  founderName: string;
  email: string;
  phone?: string;
  companyCreationDate: string;
  
  // Activity & Domain
  activityDomain: string;
  activitySubDomain?: string;
  
  // Project & Progress
  projectProgress: string;
  stage?: string;
  
  // Staff & Organization
  staffRange: string;
  staffPositions?: string;
  
  // Approval & Status
  approval?: boolean;
  requestStatus?: string;
  
  // Labeling & Classification
  isLabeled?: boolean;
  labelType?: string;
  
  // Challenges & Barriers
  barriers?: string;
  otherBarriers?: string;
  
  // Support & Recommendations
  supportNeeded?: string;
  supportNeededOther?: string;
  recommendations?: string;
  
  // Company Identity
  slogan?: string;
  logo?: string;
  
  // Business Information
  businessPlanSummary?: string;
  marketAnalysis?: string;
  targetMarket?: string;
  competitors?: string;
  competitiveAdvantage?: string;
  riskFactors?: string;
  
  // Recognition & Values
  awards?: string;
  values?: string;
  
  // Additional Information
  longDescription?: string;
  website?: string;
  address?: string;
}

interface UseCompanyProfileReturn {
  profileData: ProfileData | null;
  loading: boolean;
  error: string | null;
  shouldShowModal: boolean;
  refreshProfileData: () => void;
  createOrUpdateProfile: (profileData: CompanyProfileFormData) => Promise<{ success: boolean; data: CompanyProfile }>;
  getEnums: () => Promise<EnumData>;
  checkProfileCompletion: () => Promise<void>;
}

export const useCompanyProfile = (): UseCompanyProfileReturn => {
  const { user, isAuthenticated } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldShowModal, setShouldShowModal] = useState<boolean>(false);

  const checkProfileCompletion = async (): Promise<void> => {
    // Check for user ID in multiple possible properties
    const userId = user?.userId || user?.id || user?._id;
    
    if (!userId || !isAuthenticated) {
      console.log('[useCompanyProfile] No user ID or not authenticated');
      console.log('[useCompanyProfile] User object:', user);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('[useCompanyProfile] Checking profile for user:', userId);
      console.log('[useCompanyProfile] User object keys:', Object.keys(user || {}));
      
      const response = await fetch(`${API_URL}/api/company-profile/check/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // Get more detailed error information
        let errorMessage: string;
        try {
          const errorData: ApiResponse<any> = await response.json();
          errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
        } catch {
          errorMessage = `HTTP error! status: ${response.status}`;
        }
        console.error('[useCompanyProfile] HTTP Error:', response.status, errorMessage);
        throw new Error(errorMessage);
      }

      const data: ApiResponse<ProfileData> = await response.json();
      console.log('[useCompanyProfile] Profile check response:', data);

      if (data.success) {
        setProfileData(data.data);
        
        // Show modal if user is STARTUP and profile is incomplete
        const shouldShow = data.data.isStartup && !data.data.isProfileComplete;
        setShouldShowModal(shouldShow);
        
        console.log('[useCompanyProfile] Should show modal:', shouldShow);
      } else {
        throw new Error(data.message || 'Failed to check profile completion');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('[useCompanyProfile] Error checking profile:', err);
      setError(errorMessage);
      setShouldShowModal(false);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfileData = (): void => {
    console.log('[useCompanyProfile] Refreshing profile data');
    checkProfileCompletion();
  };

  const createOrUpdateProfile = async (profileData: CompanyProfileFormData): Promise<{ success: boolean; data: CompanyProfile }> => {
    const userId = user?.userId || user?.id || user?._id;
    
    if (!userId || !isAuthenticated) {
      throw new Error('User not authenticated');
    }

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      console.log('[useCompanyProfile] Creating/updating profile:', profileData);
      
      const response = await fetch(`${API_URL}/api/company-profile/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });

      const data: ApiResponse<CompanyProfile> = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      if (data.success) {
        console.log('[useCompanyProfile] Profile saved successfully');
        // Refresh profile data after successful save
        await checkProfileCompletion();
        return { success: true, data: data.data };
      } else {
        throw new Error(data.message || 'Failed to save profile');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('[useCompanyProfile] Error saving profile:', err);
      throw new Error(errorMessage);
    }
  };

  const getEnums = async (): Promise<EnumData> => {
    try {
      const response = await fetch(`${API_URL}/api/company-profile/enums`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data: ApiResponse<EnumData> = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to fetch enums');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('[useCompanyProfile] Error fetching enums:', err);
      throw new Error(errorMessage);
    }
  };

  // Check profile completion when user changes or component mounts
  useEffect(() => {
    const userId = user?.userId || user?.id || user?._id;
    
    if (userId && isAuthenticated) {
      console.log('[useCompanyProfile] User authenticated, checking profile completion');
      checkProfileCompletion();
    } else {
      console.log('[useCompanyProfile] User not authenticated, clearing state');
      setProfileData(null);
      setShouldShowModal(false);
      setError(null);
    }
    // Dependencies should include all possible user ID properties
  }, [user?.userId, user?.id, user?._id, isAuthenticated]);

  return {
    profileData,
    loading,
    error,
    shouldShowModal,
    refreshProfileData,
    createOrUpdateProfile,
    getEnums,
    checkProfileCompletion
  };
};