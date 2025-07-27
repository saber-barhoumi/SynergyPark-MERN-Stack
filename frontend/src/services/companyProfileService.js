const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class CompanyProfileService {
  static async getEnums() {
    try {
      const response = await fetch(`${API_URL}/api/company-profile/enums`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching enums:', error);
      throw error;
    }
  }

  static async checkProfileCompletion(userId) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/company-profile/check/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking profile completion:', error);
      throw error;
    }
  }

  static async getCompanyProfile(userId) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/company-profile/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting company profile:', error);
      throw error;
    }
  }

  static async createOrUpdateCompanyProfile(userId, profileData) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/company-profile/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating/updating company profile:', error);
      throw error;
    }
  }

  static async getAllCompanyProfiles() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/company-profile/admin/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting all company profiles:', error);
      throw error;
    }
  }

  static async updateRequestStatus(profileId, requestStatus) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/company-profile/admin/${profileId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ requestStatus })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating request status:', error);
      throw error;
    }
  }
}

export default CompanyProfileService; 