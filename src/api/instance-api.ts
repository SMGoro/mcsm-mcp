/**
 * MCSManager API Client - Instance Management Module
 * Provides methods for managing instances
 */

import { InstanceDetail } from "../types/api-types.js";
import { MCSManagerClient } from "./core-api.js";

// Extend the core client with instance management methods
export class InstanceAPI extends MCSManagerClient {
  // ============ Instance Management ============

  async listInstances(
    daemonId: string,
    page = 1,
    pageSize = 50,
    filters?: {
      instanceName?: string;
      status?: string;
      tag?: string;
    }
  ) {
    const response = await this.client.get("/api/service/remote_service_instances", {
      params: {
        remote_uuid: daemonId,
        page,
        page_size: pageSize,
        instance_name: filters?.instanceName,
        status: filters?.status,
        tag: filters?.tag,
      },
    });
    // MCSManager API returns {status: 200, data: {...}, time: ...}
    return response.data.data || response.data;
  }

  async getInstanceInfo(daemonId: string, uuid: string): Promise<InstanceDetail> {
    const response = await this.client.get("/api/instance", {
      params: { remote_uuid: daemonId, uuid },
    });
    // MCSManager API returns {status: 200, data: {...}, time: ...}
    return response.data.data || response.data;
  }

  async createInstance(daemonId: string, config: any) {
    const response = await this.client.post("/api/instance", config, {
      params: { remote_uuid: daemonId },
    });
    // MCSManager API returns {status: 200, data: {...}, time: ...}
    return response.data.data || response.data;
  }

  async updateInstanceConfig(daemonId: string, uuid: string, config: any) {
    const response = await this.client.put("/api/instance", config, {
      params: { remote_uuid: daemonId, uuid },
    });
    // MCSManager API returns {status: 200, data: {...}, time: ...}
    return response.data.data || response.data;
  }

  async deleteInstance(daemonId: string, uuid: string, deleteFile = false) {
    const response = await this.client.delete("/api/instance", {
      params: { remote_uuid: daemonId },
      data: {
        uuids: [uuid],
        deleteFile,
      },
    });
    // MCSManager API returns {status: 200, data: {...}, time: ...}
    return response.data.data || response.data;
  }

  async startInstance(daemonId: string, uuid: string) {
    const response = await this.client.get("/api/protected_instance/open", {
      params: { remote_uuid: daemonId, uuid },
    });
    // MCSManager API returns {status: 200, data: {...}, time: ...}
    return response.data.data || response.data;
  }

  async stopInstance(daemonId: string, uuid: string) {
    const response = await this.client.get("/api/protected_instance/stop", {
      params: { remote_uuid: daemonId, uuid },
    });
    // MCSManager API returns {status: 200, data: {...}, time: ...}
    return response.data.data || response.data;
  }

  async restartInstance(daemonId: string, uuid: string) {
    const response = await this.client.get("/api/protected_instance/restart", {
      params: { remote_uuid: daemonId, uuid },
    });
    // MCSManager API returns {status: 200, data: {...}, time: ...}
    return response.data.data || response.data;
  }

  async killInstance(daemonId: string, uuid: string) {
    const response = await this.client.get("/api/protected_instance/kill", {
      params: { remote_uuid: daemonId, uuid },
    });
    // MCSManager API returns {status: 200, data: {...}, time: ...}
    return response.data.data || response.data;
  }

  async sendCommand(daemonId: string, uuid: string, command: string) {
    const response = await this.client.get("/api/protected_instance/command", {
      params: { remote_uuid: daemonId, uuid, command },
    });
    // MCSManager API returns {status: 200, data: {...}, time: ...}
    return response.data.data || response.data;
  }

  async updateInstance(daemonId: string, uuid: string) {
    const response = await this.client.post("/api/protected_instance/asynchronous", null, {
      params: { remote_uuid: daemonId, uuid, task_name: "update" },
    });
    // MCSManager API returns {status: 200, data: {...}, time: ...}
    return response.data.data || response.data;
  }

  async reinstallInstance(daemonId: string, uuid: string, installConfig: {
    targetUrl: string;
    title: string;
    description: string;
  }) {
    const response = await this.client.post("/api/protected_instance/install_instance", installConfig, {
      params: { remote_uuid: daemonId, uuid },
    });
    // MCSManager API returns {status: 200, data: {...}, time: ...}
    return response.data.data || response.data;
  }

  async getInstanceOutputLog(daemonId: string, uuid: string, size?: number): Promise<string> {
    const response = await this.client.get("/api/protected_instance/outputlog", {
      params: { remote_uuid: daemonId, uuid, size },
    });
    // MCSManager API returns {status: 200, data: {...}, time: ...}
    return response.data.data || response.data;
  }

  async batchStartInstances(instances: Array<{ uuid: string, daemonId: string }>) {
    const response = await this.client.post("/api/instance/multi_start", instances);
    // MCSManager API returns {status: 200, data: {...}, time: ...}
    return response.data.data || response.data;
  }

  async batchStopInstances(instances: Array<{ uuid: string, daemonId: string }>) {
    const response = await this.client.post("/api/instance/multi_stop", instances);
    // MCSManager API returns {status: 200, data: {...}, time: ...}
    return response.data.data || response.data;
  }

  async batchRestartInstances(instances: Array<{ uuid: string, daemonId: string }>) {
    const response = await this.client.post("/api/instance/multi_restart", instances);
    // MCSManager API returns {status: 200, data: {...}, time: ...}
    return response.data.data || response.data;
  }

  async batchKillInstances(instances: Array<{ uuid: string, daemonId: string }>) {
    const response = await this.client.post("/api/instance/multi_kill", instances);
    // MCSManager API returns {status: 200, data: {...}, time: ...}
    return response.data.data || response.data;
  }
}