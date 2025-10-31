/**
 * MCSManager API Client - User Management Module
 * Provides methods for managing users
 */

import { ScheduleAPI } from "./schedule-api.js";

// Extend the schedule API with user management methods
export class UserAPI extends ScheduleAPI {
  // ============ User Management ============

  async listUsers(page = 1, pageSize = 20, filters?: { userName?: string; role?: string }) {
    const response = await this.client.get("/api/auth/search", {
      params: {
        page,
        page_size: pageSize,
        userName: filters?.userName,
        role: filters?.role,
      },
    });
    // MCSManager API returns {status: 200, data: {...}, time: ...}
    return response.data.data || response.data;
  }

  async createUser(username: string, password: string, permission: number) {
    const response = await this.client.post("/api/auth", {
      username,
      password,
      permission,
    });
    // MCSManager API returns {status: 200, data: {...}, time: ...}
    return response.data.data || response.data;
  }

  async updateUser(uuid: string, config: any) {
    const response = await this.client.put("/api/auth", {
      uuid,
      config,
    });
    // MCSManager API returns {status: 200, data: {...}, time: ...}
    return response.data.data || response.data;
  }

  async deleteUser(uuids: string[]) {
    const response = await this.client.delete("/api/auth", {
      data: uuids,
    });
    // MCSManager API returns {status: 200, data: {...}, time: ...}
    return response.data.data || response.data;
  }
}