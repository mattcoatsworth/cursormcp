import fetch from 'node-fetch';

    const API_BASE_URL = 'https://api.getelevar.com/v1';

    class ElevarApi {
      constructor() {
        this.apiKey = process.env.ELEVAR_API_KEY;
        if (!this.apiKey) {
          console.warn('ELEVAR_API_KEY not found in environment variables. API calls will fail.');
        }
      }

      async request(endpoint, method = 'GET', body = null) {
        const url = `${API_BASE_URL}${endpoint}`;
        const headers = {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        };

        const options = {
          method,
          headers
        };

        if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
          options.body = JSON.stringify(body);
        }

        try {
          const response = await fetch(url, options);
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
          }
          
          return await response.json();
        } catch (error) {
          console.error(`Error in ${method} ${endpoint}:`, error);
          throw error;
        }
      }

      // Account endpoints
      async getAccount() {
        return this.request('/account');
      }

      // Data Source endpoints
      async getDataSources() {
        return this.request('/data-sources');
      }

      async getDataSource(id) {
        return this.request(`/data-sources/${id}`);
      }

      async createDataSource(name, type, properties = {}) {
        return this.request('/data-sources', 'POST', {
          name,
          type,
          properties
        });
      }

      async updateDataSource(id, updateData) {
        return this.request(`/data-sources/${id}`, 'PATCH', updateData);
      }

      async deleteDataSource(id) {
        return this.request(`/data-sources/${id}`, 'DELETE');
      }

      // Data Query endpoints
      async queryData(dataSourceId, queryParams) {
        return this.request(`/data-sources/${dataSourceId}/query`, 'POST', queryParams);
      }

      // Metadata endpoints
      async getMetadata(dataSourceId) {
        return this.request(`/data-sources/${dataSourceId}/metadata`);
      }
    }

    export const elevarApi = new ElevarApi();
