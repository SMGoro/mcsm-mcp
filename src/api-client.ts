/**
 * MCSManager API Client
 * Uses local implementation for typed access to MCSManager Frontend APIs
 */

import { UserAPI as MCSManagerClient } from "./api/user-api.js";

export interface MCSMConfig {
  apiUrl: string;
  apiKey: string;
}

export interface InstanceDetail {
  instanceUuid: string;
  started: number;
  status: number;
  config: {
    nickname: string;
    type: string;
    tag?: string[];
    cwd?: string;
    startCommand?: string;
    stopCommand?: string;
    ie?: string;
    oe?: string;
    [key: string]: any;
  };
  info?: {
    currentPlayers?: number;
    maxPlayers?: number;
    version?: string;
    [key: string]: any;
  };
}

export interface NodeStatus {
  uuid: string;
  port: number;
  remarks: string;
  available: boolean;
  status: number;
  version?: string;
  lastHeartbeat?: number;
}

export interface FileItem {
  name: string;
  size: number;
  time: string;
  type: number;
  mode: number;
}

export interface FileListResponse {
  items: FileItem[];
  page: number;
  pageSize: number;
  total: number;
  absolutePath: string;
}

export interface ScheduleInfo {
  name: string;
  count: number;
  time: string;
  action: string;
  payload?: string;
}

export interface UserInfo {
  uuid: string;
  username: string;
  permission: number;
  loginTime?: number;
  lastLoginTime?: number;
}

export interface OverviewData {
  version: string;
  specifiedDaemonVersion: string;
  process: {
    cpu: number;
    memory: number;
    cwd: string;
  };
  record: {
    logined: number;
    illegalAccess: number;
    banips: number;
    loginFailed: number;
  };
  system: {
    user: {
      uid: number;
      gid: number;
      username: string;
      homedir: string;
      shell: string | null;
    };
    time: number;
    totalmem: number;
    freemem: number;
    type: string;
    version: string;
    node: string;
    hostname: string;
    loadavg: number[];
    platform: string;
    release: string;
    uptime: number;
    cpu: number;
  };
  chart: {
    system: Array<{
      cpu: number;
      mem: number;
    }>;
    request: Array<{
      value: number;
      totalInstance: number;
      runningInstance: number;
    }>;
  };
  remoteCount: {
    available: number;
    total: number;
  };
  remote: Array<{
    version: string;
    process: {
      cpu: number;
      memory: number;
      cwd: string;
    };
    instance: {
      running: number;
      total: number;
    };
    system: {
      type: string;
      hostname: string;
      platform: string;
      release: string;
      uptime: number;
      cwd: string;
      loadavg: number[];
      freemem: number;
      cpuUsage: number;
      memUsage: number;
      totalmem: number;
      processCpu: number;
      processMem: number;
    };
    cpuMemChart: Array<{
      cpu: number;
      mem: number;
    }>;
    uuid: string;
    port: number;
    prefix: string;
    available: boolean;
    remarks: string;
  }>;
}

/**
 * MCSManager Client using local implementation
 * Provides a simplified interface for MCP tools
 */
export class MCPClient {
  private sdk: MCSManagerClient;

  constructor(config: MCSMConfig) {
    this.sdk = new MCSManagerClient({
      apiUrl: config.apiUrl,
      apiKey: config.apiKey,
    });
  }

  // ============ Core Methods ============

  async getOverview(): Promise<OverviewData> {
    return await this.sdk.getOverview();
  }

  // ============ Node Management ============

  async listNodes(): Promise<NodeStatus[]> {
    return await this.sdk.listNodes();
  }

  async connectNode(uuid: string) {
    return await this.sdk.connectNode(uuid);
  }

  async disconnectNode(uuid: string) {
    // Note: MCSManager doesn't have a disconnect API, this is a placeholder
    throw new Error("Disconnect node functionality not available in MCSManager API");
  }

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
    return await this.sdk.listInstances(daemonId, page, pageSize, filters);
  }

  async getInstanceInfo(daemonId: string, uuid: string): Promise<InstanceDetail> {
    return await this.sdk.getInstanceInfo(daemonId, uuid);
  }

  async createInstance(daemonId: string, config: any) {
    return await this.sdk.createInstance(daemonId, config);
  }

  async updateInstanceConfig(daemonId: string, uuid: string, config: any) {
    return await this.sdk.updateInstanceConfig(daemonId, uuid, config);
  }

  async deleteInstance(daemonId: string, uuid: string, deleteFile = false) {
    return await this.sdk.deleteInstance(daemonId, uuid, deleteFile);
  }

  async startInstance(daemonId: string, uuid: string) {
    return await this.sdk.startInstance(daemonId, uuid);
  }

  async stopInstance(daemonId: string, uuid: string) {
    return await this.sdk.stopInstance(daemonId, uuid);
  }

  async restartInstance(daemonId: string, uuid: string) {
    return await this.sdk.restartInstance(daemonId, uuid);
  }

  async killInstance(daemonId: string, uuid: string) {
    return await this.sdk.killInstance(daemonId, uuid);
  }

  async sendCommand(daemonId: string, uuid: string, command: string) {
    return await this.sdk.sendCommand(daemonId, uuid, command);
  }

  async updateInstance(daemonId: string, uuid: string) {
    return await this.sdk.updateInstance(daemonId, uuid);
  }

  async reinstallInstance(daemonId: string, uuid: string, installConfig: {
    targetUrl: string;
    title: string;
    description: string;
  }) {
    return await this.sdk.reinstallInstance(daemonId, uuid, installConfig);
  }

  async getInstanceOutputLog(daemonId: string, uuid: string, size?: number): Promise<string> {
    return await this.sdk.getInstanceOutputLog(daemonId, uuid, size);
  }

  async batchStartInstances(instances: Array<{ uuid: string, daemonId: string }>) {
    return await this.sdk.batchStartInstances(instances);
  }

  async batchStopInstances(instances: Array<{ uuid: string, daemonId: string }>) {
    return await this.sdk.batchStopInstances(instances);
  }

  async batchRestartInstances(instances: Array<{ uuid: string, daemonId: string }>) {
    return await this.sdk.batchRestartInstances(instances);
  }

  async batchKillInstances(instances: Array<{ uuid: string, daemonId: string }>) {
    return await this.sdk.batchKillInstances(instances);
  }

  // ============ File Management ============

  async listFiles(
    daemonId: string,
    uuid: string,
    target = ".",
    page = 1,
    pageSize = 100
  ): Promise<FileListResponse> {
    return await this.sdk.listFiles(daemonId, uuid, target, page, pageSize);
  }

  async createFolder(daemonId: string, uuid: string, target: string) {
    return await this.sdk.createFolder(daemonId, uuid, target);
  }

  async deleteFile(daemonId: string, uuid: string, targets: string[]) {
    return await this.sdk.deleteFile(daemonId, uuid, targets);
  }

  async getFileContent(daemonId: string, uuid: string, target: string): Promise<string> {
    return await this.sdk.readFileContent(daemonId, uuid, target);
  }

  async writeFileContent(daemonId: string, uuid: string, target: string, text: string) {
    return await this.sdk.writeFileContent(daemonId, uuid, target, text);
  }

  // ============ Schedule Management ============

  async listSchedules(daemonId: string, uuid: string): Promise<ScheduleInfo[]> {
    return await this.sdk.listSchedules(daemonId, uuid);
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
    return await this.sdk.createSchedule(daemonId, uuid, schedule);
  }

  async updateSchedule(
    daemonId: string,
    uuid: string,
    taskName: string,
    schedule: {
      name: string;
      count?: number;
      time?: string;
      action: string;
      payload?: string;
    }
  ) {
    // Note: MCSManager doesn't have update schedule API, delete and recreate
    await this.sdk.deleteSchedule(daemonId, uuid, taskName);
    return await this.sdk.createSchedule(daemonId, uuid, schedule);
  }

  async deleteSchedule(daemonId: string, uuid: string, taskName: string) {
    return await this.sdk.deleteSchedule(daemonId, uuid, taskName);
  }

  // ============ User Management ============

  async listUsers(page = 1, pageSize = 20, filters?: { userName?: string; role?: string }): Promise<UserInfo[]> {
    return await this.sdk.listUsers(page, pageSize, filters);
  }

  async createUser(username: string, password: string, permission: number) {
    return await this.sdk.createUser(username, password, permission);
  }

  async updateUser(uuid: string, config: any) {
    return await this.sdk.updateUser(uuid, config);
  }

  async deleteUser(uuids: string[]) {
    return await this.sdk.deleteUser(uuids);
  }
}