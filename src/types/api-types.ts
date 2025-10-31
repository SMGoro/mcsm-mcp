/**
 * API Types for MCSManager Client
 * Contains all TypeScript interfaces and types for the API
 */

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
  ip: string;
  port: number;
  remarks: string;
  available: boolean;
  status: number;
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
    ip: string;
    port: number;
    prefix: string;
    available: boolean;
    remarks: string;
  }>;
}