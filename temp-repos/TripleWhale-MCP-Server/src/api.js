import axios from 'axios';
    import { config } from './config.js';

    // Create axios instance with default headers
    const api = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey
      }
    });

    /**
     * Get blended stats table data
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} - API response
     */
    export async function getBlendedStatsTable(params) {
      try {
        const response = await api.post(`/shops/${config.shopId}/blended-stats-table`, params);
        return response.data;
      } catch (error) {
        console.error('Error fetching blended stats table:', error.response?.data || error.message);
        throw error;
      }
    }

    /**
     * Get shop information
     * @returns {Promise<Object>} - API response
     */
    export async function getShopInfo() {
      try {
        const response = await api.get(`/shops/${config.shopId}`);
        return response.data;
      } catch (error) {
        console.error('Error fetching shop info:', error.response?.data || error.message);
        throw error;
      }
    }

    /**
     * Get available metrics
     * @returns {Promise<Object>} - API response
     */
    export async function getAvailableMetrics() {
      try {
        const response = await api.get(`/shops/${config.shopId}/metrics`);
        return response.data;
      } catch (error) {
        console.error('Error fetching available metrics:', error.response?.data || error.message);
        throw error;
      }
    }

    /**
     * Get available dimensions
     * @returns {Promise<Object>} - API response
     */
    export async function getAvailableDimensions() {
      try {
        const response = await api.get(`/shops/${config.shopId}/dimensions`);
        return response.data;
      } catch (error) {
        console.error('Error fetching available dimensions:', error.response?.data || error.message);
        throw error;
      }
    }
