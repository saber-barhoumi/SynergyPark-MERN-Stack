// src/feature-module/modals/companyProfileModal.tsx
import React, { useState, useEffect } from 'react';
import { useCompanyProfile } from '../../hooks/useCompanyProfile';
import './companyProfileModal.css';

// Import types from the hook
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

interface CompanyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  // Basic Information
  consentGiven: boolean;
  companyName: string;
  founderName: string;
  email: string;
  phone: string;
  companyCreationDate: string;
  
  // Activity & Domain
  activityDomain: string;
  activitySubDomain: string;
  
  // Project & Progress
  projectProgress: string;
  stage: string;
  
  // Staff & Organization
  staffRange: string;
  staffPositions: string;
  
  // Approval & Status
  approval: boolean;
  requestStatus: string;
  
  // Labeling & Classification
  isLabeled: boolean;
  labelType: string;
  
  // Challenges & Barriers
  barriers: string;
  otherBarriers: string;
  
  // Support & Recommendations
  supportNeeded: string;
  supportNeededOther: string;
  recommendations: string;
  
  // Company Identity
  slogan: string;
  logo: string;
  
  // Business Information
  businessPlanSummary: string;
  marketAnalysis: string;
  targetMarket: string;
  competitors: string;
  competitiveAdvantage: string;
  riskFactors: string;
  
  // Recognition & Values
  awards: string;
  values: string;
  
  // Additional Information
  longDescription: string;
  website: string;
  address: string;
}

const CompanyProfileModal: React.FC<CompanyProfileModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { profileData, loading, createOrUpdateProfile, getEnums } = useCompanyProfile();
  
  const [formData, setFormData] = useState<FormData>({
    // Basic Information
    consentGiven: false,
    companyName: '',
    founderName: '',
    email: '',
    phone: '',
    companyCreationDate: '',
    
    // Activity & Domain
    activityDomain: '',
    activitySubDomain: '',
    
    // Project & Progress
    projectProgress: '',
    stage: '',
    
    // Staff & Organization
    staffRange: '',
    staffPositions: '',
    
    // Approval & Status
    approval: false,
    requestStatus: '',
    
    // Labeling & Classification
    isLabeled: false,
    labelType: '',
    
    // Challenges & Barriers
    barriers: '',
    otherBarriers: '',
    
    // Support & Recommendations
    supportNeeded: '',
    supportNeededOther: '',
    recommendations: '',
    
    // Company Identity
    slogan: '',
    logo: '',
    
    // Business Information
    businessPlanSummary: '',
    marketAnalysis: '',
    targetMarket: '',
    competitors: '',
    competitiveAdvantage: '',
    riskFactors: '',
    
    // Recognition & Values
    awards: '',
    values: '',
    
    // Additional Information
    longDescription: '',
    website: '',
    address: ''
  });

  const [enums, setEnums] = useState<{
    ActivityDomain: Record<string, string>;
    ActivitySubDomain: Record<string, string>;
    ProjectProgress: Record<string, string>;
    StaffRange: Record<string, string>;
    RequestStatus: Record<string, string>;
    CompanyStage: Record<string, string>;
    LabelType: Record<string, string>;
    SupportNeeded: Record<string, string>;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // Load enums on component mount
  useEffect(() => {
    const loadEnums = async () => {
      try {
        const enumData = await getEnums();
        setEnums(enumData);
      } catch (error) {
        console.error('Error loading enums:', error);
      }
    };

    if (isOpen) {
      loadEnums();
    }
  }, [isOpen, getEnums]);

  // Pre-populate form if profile data exists
  useEffect(() => {
    if (profileData && profileData.profile && profileData.profile !== null) {
      const profile: CompanyProfile = profileData.profile;
      setFormData({
        // Basic Information
        consentGiven: profile.consentGiven || false,
        companyName: profile.companyName || '',
        founderName: profile.founderName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        companyCreationDate: profile.companyCreationDate || '',
        
        // Activity & Domain
        activityDomain: profile.activityDomain || '',
        activitySubDomain: profile.activitySubDomain || '',
        
        // Project & Progress
        projectProgress: profile.projectProgress || '',
        stage: profile.stage || '',
        
        // Staff & Organization
        staffRange: profile.staffRange || '',
        staffPositions: profile.staffPositions || '',
        
        // Approval & Status
        approval: profile.approval || false,
        requestStatus: profile.requestStatus || '',
        
        // Labeling & Classification
        isLabeled: profile.isLabeled || false,
        labelType: profile.labelType || '',
        
        // Challenges & Barriers
        barriers: profile.barriers || '',
        otherBarriers: profile.otherBarriers || '',
        
        // Support & Recommendations
        supportNeeded: profile.supportNeeded || '',
        supportNeededOther: profile.supportNeededOther || '',
        recommendations: profile.recommendations || '',
        
        // Company Identity
        slogan: profile.slogan || '',
        logo: profile.logo || '',
        
        // Business Information
        businessPlanSummary: profile.businessPlanSummary || '',
        marketAnalysis: profile.marketAnalysis || '',
        targetMarket: profile.targetMarket || '',
        competitors: profile.competitors || '',
        competitiveAdvantage: profile.competitiveAdvantage || '',
        riskFactors: profile.riskFactors || '',
        
        // Recognition & Values
        awards: profile.awards || '',
        values: profile.values || '',
        
        // Additional Information
        longDescription: profile.longDescription || '',
        website: profile.website || '',
        address: profile.address || ''
      });
    }
  }, [profileData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createOrUpdateProfile(formData);
      onClose();
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      // Handle error (show toast, etc.)
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h4 className="modal-title">
              <i className="fas fa-building me-2"></i>
              Company Profile
            </h4>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <div className="modal-body p-0">
            {/* Navigation Tabs */}
            <ul className="nav nav-tabs nav-fill" id="profileTabs" role="tablist">
              <li className="nav-item" role="presentation">
                <button 
                  className={`nav-link ${activeTab === 'basic' ? 'active' : ''}`}
                  onClick={() => setActiveTab('basic')}
                >
                  <i className="fas fa-info-circle me-1"></i>
                  Basic Info
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button 
                  className={`nav-link ${activeTab === 'business' ? 'active' : ''}`}
                  onClick={() => setActiveTab('business')}
                >
                  <i className="fas fa-chart-line me-1"></i>
                  Business
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button 
                  className={`nav-link ${activeTab === 'team' ? 'active' : ''}`}
                  onClick={() => setActiveTab('team')}
                >
                  <i className="fas fa-users me-1"></i>
                  Team
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button 
                  className={`nav-link ${activeTab === 'challenges' ? 'active' : ''}`}
                  onClick={() => setActiveTab('challenges')}
                >
                  <i className="fas fa-exclamation-triangle me-1"></i>
                  Challenges
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button 
                  className={`nav-link ${activeTab === 'additional' ? 'active' : ''}`}
                  onClick={() => setActiveTab('additional')}
                >
                  <i className="fas fa-plus-circle me-1"></i>
                  Additional
                </button>
              </li>
            </ul>

            <form onSubmit={handleSubmit} className="p-4">
              {/* Basic Information Tab */}
              {activeTab === 'basic' && (
                <div className="tab-content">
                  <div className="row">
                    <div className="col-12 mb-3">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          name="consentGiven"
                          checked={formData.consentGiven}
                          onChange={handleInputChange}
                          required
                        />
                        <label className="form-check-label">
                          I consent to data processing and agree to the terms and conditions
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Company Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Founder Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="founderName"
                        value={formData.founderName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Email *</label>
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Phone</label>
                      <input
                        type="tel"
                        className="form-control"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Company Creation Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        name="companyCreationDate"
                        value={formData.companyCreationDate}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Website</label>
                      <input
                        type="url"
                        className="form-control"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Activity Domain *</label>
                      <select
                        className="form-select"
                        name="activityDomain"
                        value={formData.activityDomain}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Activity Domain</option>
                        {enums?.ActivityDomain && Object.entries(enums.ActivityDomain).map(([key, value]) => (
                          <option key={key} value={key}>{value}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Activity Subdomain</label>
                      <select
                        className="form-select"
                        name="activitySubDomain"
                        value={formData.activitySubDomain}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Activity Subdomain</option>
                        {enums?.ActivitySubDomain && Object.entries(enums.ActivitySubDomain).map(([key, value]) => (
                          <option key={key} value={key}>{value}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Project Progress *</label>
                      <select
                        className="form-select"
                        name="projectProgress"
                        value={formData.projectProgress}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Project Progress</option>
                        {enums?.ProjectProgress && Object.entries(enums.ProjectProgress).map(([key, value]) => (
                          <option key={key} value={key}>{value}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Company Stage</label>
                      <select
                        className="form-select"
                        name="stage"
                        value={formData.stage}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Company Stage</option>
                        {enums?.CompanyStage && Object.entries(enums.CompanyStage).map(([key, value]) => (
                          <option key={key} value={key}>{value}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Staff Range *</label>
                      <select
                        className="form-select"
                        name="staffRange"
                        value={formData.staffRange}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Staff Range</option>
                        {enums?.StaffRange && Object.entries(enums.StaffRange).map(([key, value]) => (
                          <option key={key} value={key}>{value}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Address</label>
                      <textarea
                        className="form-control"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Business Information Tab */}
              {activeTab === 'business' && (
                <div className="tab-content">
                  <div className="row">
                    <div className="col-12 mb-3">
                      <label className="form-label">Company Slogan</label>
                      <input
                        type="text"
                        className="form-control"
                        name="slogan"
                        value={formData.slogan}
                        onChange={handleInputChange}
                        placeholder="Your company's tagline or slogan"
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-12 mb-3">
                      <label className="form-label">Business Plan Summary</label>
                      <textarea
                        className="form-control"
                        name="businessPlanSummary"
                        value={formData.businessPlanSummary}
                        onChange={handleInputChange}
                        rows={4}
                        placeholder="Brief summary of your business plan"
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Target Market</label>
                      <textarea
                        className="form-control"
                        name="targetMarket"
                        value={formData.targetMarket}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="Describe your target market"
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Competitors</label>
                      <textarea
                        className="form-control"
                        name="competitors"
                        value={formData.competitors}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="List your main competitors"
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Competitive Advantage</label>
                      <textarea
                        className="form-control"
                        name="competitiveAdvantage"
                        value={formData.competitiveAdvantage}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="What makes you unique?"
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Risk Factors</label>
                      <textarea
                        className="form-control"
                        name="riskFactors"
                        value={formData.riskFactors}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="Main risk factors for your business"
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-12 mb-3">
                      <label className="form-label">Market Analysis</label>
                      <textarea
                        className="form-control"
                        name="marketAnalysis"
                        value={formData.marketAnalysis}
                        onChange={handleInputChange}
                        rows={4}
                        placeholder="Your market analysis and insights"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Team Tab */}
              {activeTab === 'team' && (
                <div className="tab-content">
                  <div className="row">
                    <div className="col-12 mb-3">
                      <label className="form-label">Staff Positions</label>
                      <textarea
                        className="form-control"
                        name="staffPositions"
                        value={formData.staffPositions}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="e.g., CEO, CTO, Developer, Designer (separate with commas)"
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          name="isLabeled"
                          checked={formData.isLabeled}
                          onChange={handleInputChange}
                        />
                        <label className="form-check-label">
                          Is your company labeled/certified?
                        </label>
                      </div>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Label Type</label>
                      <select
                        className="form-select"
                        name="labelType"
                        value={formData.labelType}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Label Type</option>
                        {enums?.LabelType && Object.entries(enums.LabelType).map(([key, value]) => (
                          <option key={key} value={key}>{value}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-12 mb-3">
                      <label className="form-label">Company Values</label>
                      <textarea
                        className="form-control"
                        name="values"
                        value={formData.values}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="What are your company's core values?"
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-12 mb-3">
                      <label className="form-label">Awards & Recognition</label>
                      <textarea
                        className="form-control"
                        name="awards"
                        value={formData.awards}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="List any awards, certifications, or recognition received"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Challenges Tab */}
              {activeTab === 'challenges' && (
                <div className="tab-content">
                  <div className="row">
                    <div className="col-12 mb-3">
                      <label className="form-label">Main Barriers/Challenges</label>
                      <textarea
                        className="form-control"
                        name="barriers"
                        value={formData.barriers}
                        onChange={handleInputChange}
                        rows={4}
                        placeholder="What are the main challenges your company faces?"
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-12 mb-3">
                      <label className="form-label">Other Barriers</label>
                      <textarea
                        className="form-control"
                        name="otherBarriers"
                        value={formData.otherBarriers}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="Any other barriers not mentioned above"
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Support Needed</label>
                      <select
                        className="form-select"
                        name="supportNeeded"
                        value={formData.supportNeeded}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Support Type</option>
                        {enums?.SupportNeeded && Object.entries(enums.SupportNeeded).map(([key, value]) => (
                          <option key={key} value={key}>{value}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Other Support Needed</label>
                      <input
                        type="text"
                        className="form-control"
                        name="supportNeededOther"
                        value={formData.supportNeededOther}
                        onChange={handleInputChange}
                        placeholder="Other types of support"
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-12 mb-3">
                      <label className="form-label">Recommendations</label>
                      <textarea
                        className="form-control"
                        name="recommendations"
                        value={formData.recommendations}
                        onChange={handleInputChange}
                        rows={4}
                        placeholder="What recommendations do you have for improvement?"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Information Tab */}
              {activeTab === 'additional' && (
                <div className="tab-content">
                  <div className="row">
                    <div className="col-12 mb-3">
                      <label className="form-label">Long Description</label>
                      <textarea
                        className="form-control"
                        name="longDescription"
                        value={formData.longDescription}
                        onChange={handleInputChange}
                        rows={6}
                        placeholder="Detailed description of your company, mission, and vision"
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          name="approval"
                          checked={formData.approval}
                          onChange={handleInputChange}
                        />
                        <label className="form-check-label">
                          I approve the data provided
                        </label>
                      </div>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Request Status</label>
                      <select
                        className="form-select"
                        name="requestStatus"
                        value={formData.requestStatus}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Status</option>
                        {enums?.RequestStatus && Object.entries(enums.RequestStatus).map(([key, value]) => (
                          <option key={key} value={key}>{value}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="d-flex justify-content-between mt-4">
                <div>
                  {activeTab !== 'basic' && (
                    <button
                      type="button"
                      className="btn btn-secondary me-2"
                      onClick={() => {
                        const tabs = ['basic', 'business', 'team', 'challenges', 'additional'];
                        const currentIndex = tabs.indexOf(activeTab);
                        if (currentIndex > 0) {
                          setActiveTab(tabs[currentIndex - 1]);
                        }
                      }}
                    >
                      <i className="fas fa-arrow-left me-1"></i>
                      Previous
                    </button>
                  )}
                </div>
                
                <div>
                  {activeTab !== 'additional' && (
                    <button
                      type="button"
                      className="btn btn-primary me-2"
                      onClick={() => {
                        const tabs = ['basic', 'business', 'team', 'challenges', 'additional'];
                        const currentIndex = tabs.indexOf(activeTab);
                        if (currentIndex < tabs.length - 1) {
                          setActiveTab(tabs[currentIndex + 1]);
                        }
                      }}
                    >
                      Next
                      <i className="fas fa-arrow-right ms-1"></i>
                    </button>
                  )}
                  
                  {activeTab === 'additional' && (
                    <button
                      type="submit"
                      className="btn btn-success me-2"
                      disabled={isSubmitting || loading}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save me-1"></i>
                          Save Profile
                        </>
                      )}
                    </button>
                  )}
                  
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={onClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfileModal;