import axios from 'axios';
    import config from './config.js';

    const BASE_URL = 'https://api.postscript.io/api/v1';

    // Create axios instance with default config
    const api = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Authorization': `Bearer ${config.POSTSCRIPT_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Error handler
    api.interceptors.response.use(
      response => response,
      error => {
        const errorResponse = error.response?.data || { error: error.message };
        console.error('API Error:', errorResponse);
        return Promise.reject(errorResponse);
      }
    );

    // Shop endpoints
    export const getShops = async () => {
      const response = await api.get('/shops');
      return response.data;
    };

    export const getShop = async (shopId) => {
      const response = await api.get(`/shops/${shopId}`);
      return response.data;
    };

    // Subscriber endpoints
    export const getSubscribers = async (shopId, params = {}) => {
      const response = await api.get(`/shops/${shopId}/subscribers`, { params });
      return response.data;
    };

    export const getSubscriber = async (shopId, subscriberId) => {
      const response = await api.get(`/shops/${shopId}/subscribers/${subscriberId}`);
      return response.data;
    };

    export const createSubscriber = async (shopId, subscriberData) => {
      const response = await api.post(`/shops/${shopId}/subscribers`, subscriberData);
      return response.data;
    };

    export const updateSubscriber = async (shopId, subscriberId, subscriberData) => {
      const response = await api.patch(`/shops/${shopId}/subscribers/${subscriberId}`, subscriberData);
      return response.data;
    };

    // Campaign endpoints
    export const getCampaigns = async (shopId, params = {}) => {
      const response = await api.get(`/shops/${shopId}/campaigns`, { params });
      return response.data;
    };

    export const getCampaign = async (shopId, campaignId) => {
      const response = await api.get(`/shops/${shopId}/campaigns/${campaignId}`);
      return response.data;
    };

    export const createCampaign = async (shopId, campaignData) => {
      const response = await api.post(`/shops/${shopId}/campaigns`, campaignData);
      return response.data;
    };

    // Keyword endpoints
    export const getKeywords = async (shopId, params = {}) => {
      const response = await api.get(`/shops/${shopId}/keywords`, { params });
      return response.data;
    };

    export const getKeyword = async (shopId, keywordId) => {
      const response = await api.get(`/shops/${shopId}/keywords/${keywordId}`);
      return response.data;
    };

    // Message endpoints
    export const getMessages = async (shopId, params = {}) => {
      const response = await api.get(`/shops/${shopId}/messages`, { params });
      return response.data;
    };

    export const sendMessage = async (shopId, messageData) => {
      const response = await api.post(`/shops/${shopId}/messages`, messageData);
      return response.data;
    };
