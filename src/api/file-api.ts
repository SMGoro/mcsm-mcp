/**
 * MCSManager API Client - File Management Module
 * Provides methods for managing files and directories
 */

import { FileListResponse } from "../types/api-types.js";
import { InstanceAPI } from "./instance-api.js";

// Extend the instance API with file management methods
export class FileAPI extends InstanceAPI {
  // ============ File Management ============

  async listFiles(
    daemonId: string,
    uuid: string,
    target = ".",
    page = 1,
    pageSize = 100
  ): Promise<FileListResponse> {
    const response = await this.client.get("/api/files/list", {
      params: {
        remote_uuid: daemonId,
        uuid,
        target,
        page,
        page_size: pageSize,
        file_name: "",
      },
    });
    // MCSManager API returns {status: 200, data: {...}, time: ...}
    return response.data.data || response.data;
  }

  async createFolder(daemonId: string, uuid: string, target: string) {
    const response = await this.client.post(
      "/api/files/mkdir",
      { target },
      { params: { remote_uuid: daemonId, uuid } }
    );
    // MCSManager API returns {status: 200, data: {...}, time: ...}
    return response.data.data || response.data;
  }

  async deleteFile(daemonId: string, uuid: string, targets: string[]) {
    const response = await this.client.delete("/api/files", {
      params: { remote_uuid: daemonId, uuid },
      data: { targets },
    });
    // MCSManager API returns {status: 200, data: {...}, time: ...}
    return response.data.data || response.data;
  }

  async readFileContent(daemonId: string, uuid: string, target: string): Promise<string> {
    const response = await this.client.put(
      "/api/files",
      { target },
      { params: { remote_uuid: daemonId, uuid } }
    );
    // MCSManager API returns {status: 200, data: {...}, time: ...}
    return response.data.data || response.data;
  }

  async writeFileContent(daemonId: string, uuid: string, target: string, text: string) {
    const response = await this.client.put(
      "/api/files",
      { target, text },
      { params: { remote_uuid: daemonId, uuid } }
    );
    // MCSManager API returns {status: 200, data: {...}, time: ...}
    return response.data.data || response.data;
  }
}