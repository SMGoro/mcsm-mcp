/**
 * MCSManager SDK - Core Module
 * Provides typed access to MCSManager Frontend APIs
 */

import axios, { AxiosInstance } from "axios";
import { 
  MCSMConfig, 
  InstanceDetail, 
  NodeStatus, 
  FileListResponse, 
  OverviewData 
} from "./api-types.js";

export class MCSManagerSDK {
  protected client: AxiosInstance;
  private apiKey: string;
  private apiUrl: string;

  constructor(config: MCSMConfig) {
    this.apiKey = config.apiKey;
    this.apiUrl = config.apiUrl;
    this.client = axios.create({
      baseURL: config.apiUrl,
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/json; charset=utf-8",
        // Note: MCSManager uses URL parameter authentication, not header-based
      },
      timeout: 30000,
    });

    // Add apikey to URL params (for backward compatibility)
    this.client.interceptors.request.use((config) => {
      // Add apikey as URL parameter
      config.params = {
        ...config.params,
        apikey: this.apiKey,
      };
      return config;
    });

    // Add response interceptor for better error handling
    this.client.interceptors.response.use(
      (response) => {
        // Handle MCSManager API responses
        if (response.data && response.data.status && response.data.status !== 200) {
          throw new Error(`MCSManager API error: ${response.data.status} - ${response.data.data || response.data.message}`);
        }
        return response;
      },
      (error) => {
        if (error.response?.status === 403) {
          throw new Error(
            `MCSManager API authentication failed (403). Please check your API key. ` +
            `Get your API key from: ${this.apiUrl} → 用户设置 → API 密钥`
          );
        }
        if (error.response?.status === 401) {
          throw new Error(
            `MCSManager API authentication failed (401). Please check your API key. ` +
            `Get your API key from: ${this.apiUrl} → 用户设置 → API 密钥`
          );
        }
        if (error.code === 'ECONNREFUSED') {
          throw new Error(
            `Cannot connect to MCSManager API at ${this.apiUrl}. ` +
            `Please check if MCSManager is running and the URL is correct.`
          );
        }
        throw error;
      }
    );
  }

  // ============ Core Methods ============

  async getOverview(): Promise<OverviewData> {
    const response = await this.client.get("/api/overview");
    // MCSManager API returns {status: 200, data: {...}, time: ...}
    return response.data.data || response.data;
  }

  // ============ Node Management ============

  async listNodes(): Promise<NodeStatus[]> {
    const response = await this.client.get("/api/service/remote_services_list");
    // MCSManager API returns {status: 200, data: [...], time: ...}
    return response.data.data || response.data;
  }

  async connectNode(uuid: string) {
    const response = await this.client.get("/api/service/link_remote_service", {
      params: { uuid },
    });
    // MCSManager API returns {status: 200, data: {...}, time: ...}
    return response.data.data || response.data;
  }
}