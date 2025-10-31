/**
 * MCSManager API Client - Schedule Management Module
 * Provides methods for managing scheduled tasks
 */

import { FileAPI } from "./file-api.js";

// Extend the file API with schedule management methods
export class ScheduleAPI extends FileAPI {
  // ============ Schedule Management ============

  async listSchedules(daemonId: string, uuid: string) {
    const response = await this.client.get("/api/protected_schedule", {
      params: { remote_uuid: daemonId, uuid },
    });
    // MCSManager API returns {status: 200, data: {...}, time: ...}
    return response.data.data || response.data;
  }

  async createSchedule(
    daemonId: string,
    uuid: string,
    schedule: {
      name: string;
      count?: number;
      time?: string;
      action: string;
      payload?: string;
    }
  ) {
    const response = await this.client.post("/api/protected_schedule", schedule, {
      params: { remote_uuid: daemonId, uuid },
    });
    // MCSManager API returns {status: 200, data: {...}, time: ...}
    return response.data.data || response.data;
  }

  async deleteSchedule(daemonId: string, uuid: string, taskName: string) {
    const response = await this.client.delete("/api/protected_schedule", {
      params: { remote_uuid: daemonId, uuid, task_name: taskName },
    });
    // MCSManager API returns {status: 200, data: {...}, time: ...}
    return response.data.data || response.data;
  }
}