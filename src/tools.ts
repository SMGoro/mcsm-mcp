/**
 * MCP Tools definitions and handlers
 */

import { z } from "zod";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import type { MCPClient as MCSManagerClient } from "./api-client.js";

// ============ Tool Schemas ============

export const ListNodesSchema = z.object({});

export const GetOverviewSchema = z.object({});

export const CreateInstanceSchema = z.object({
  daemonId: z.string().describe("Daemon/Node ID"),
  config: z.record(z.any()).describe("Instance configuration"),
});

export const UpdateInstanceConfigSchema = z.object({
  daemonId: z.string().describe("Daemon/Node ID"),
  uuid: z.string().describe("Instance UUID"),
  config: z.record(z.any()).describe("Instance configuration updates"),
});

export const SendCommandSchema = z.object({
  daemonId: z.string().describe("Daemon/Node ID"),
  uuid: z.string().describe("Instance UUID"),
  command: z.string().describe("Command to send to the instance"),
});

export const UpdateInstanceSchema = z.object({
  daemonId: z.string().describe("Daemon/Node ID"),
  uuid: z.string().describe("Instance UUID"),
});

export const ReinstallInstanceSchema = z.object({
  daemonId: z.string().describe("Daemon/Node ID"),
  uuid: z.string().describe("Instance UUID"),
  targetUrl: z.string().describe("URL to download the installation package"),
  title: z.string().describe("Installation title"),
  description: z.string().describe("Installation description"),
});

export const GetInstanceOutputLogSchema = z.object({
  daemonId: z.string().describe("Daemon/Node ID"),
  uuid: z.string().describe("Instance UUID"),
  size: z.number().optional().describe("Log size in KB (1-2048)"),
});

export const BatchInstancesSchema = z.object({
  instances: z.array(z.object({
    uuid: z.string().describe("Instance UUID"),
    daemonId: z.string().describe("Daemon/Node ID"),
  })).min(1).describe("Array of instances to operate on"),
});

export const ListInstancesSchema = z.object({
  daemonId: z.string().describe("Daemon/Node ID"),
  page: z.number().optional().default(1).describe("Page number"),
  pageSize: z.number().optional().default(50).describe("Page size"),
  instanceName: z.string().optional().describe("Filter by instance name"),
  status: z.string().optional().describe("Filter by status"),
  tag: z.string().optional().describe("Filter by tag"),
});

export const InstanceOperationSchema = z.object({
  daemonId: z.string().describe("Daemon/Node ID"),
  uuid: z.string().describe("Instance UUID"),
});

export const DeleteInstanceSchema = InstanceOperationSchema.extend({
  deleteFile: z.boolean().optional().default(false).describe("Delete instance files"),
});

export const ListFilesSchema = z.object({
  daemonId: z.string().describe("Daemon/Node ID"),
  uuid: z.string().describe("Instance UUID"),
  target: z.string().optional().default(".").describe("Target directory path"),
  page: z.number().optional().default(1).describe("Page number"),
  pageSize: z.number().optional().default(100).describe("Page size"),
});

export const CreateFolderSchema = z.object({
  daemonId: z.string().describe("Daemon/Node ID"),
  uuid: z.string().describe("Instance UUID"),
  target: z.string().describe("Folder path to create"),
});

export const DeleteFilesSchema = z.object({
  daemonId: z.string().describe("Daemon/Node ID"),
  uuid: z.string().describe("Instance UUID"),
  targets: z.array(z.string()).min(1).describe("Array of file/folder paths to delete"),
});

export const ReadFileSchema = z.object({
  daemonId: z.string().describe("Daemon/Node ID"),
  uuid: z.string().describe("Instance UUID"),
  target: z.string().describe("File path to read"),
});

export const WriteFileSchema = z.object({
  daemonId: z.string().describe("Daemon/Node ID"),
  uuid: z.string().describe("Instance UUID"),
  target: z.string().describe("File path to write"),
  content: z.string().describe("Content to write to file"),
});

export const ListSchedulesSchema = z.object({
  daemonId: z.string().describe("Daemon/Node ID"),
  uuid: z.string().describe("Instance UUID"),
});

export const CreateScheduleSchema = z.object({
  daemonId: z.string().describe("Daemon/Node ID"),
  uuid: z.string().describe("Instance UUID"),
  name: z.string().describe("Schedule task name"),
  action: z.string().describe("Action to perform"),
  time: z.string().optional().describe("Cron expression"),
  count: z.number().optional().describe("Repeat count (-1 for infinite)"),
  payload: z.string().optional().describe("Additional payload"),
});

export const DeleteScheduleSchema = z.object({
  daemonId: z.string().describe("Daemon/Node ID"),
  uuid: z.string().describe("Instance UUID"),
  taskName: z.string().describe("Schedule task name"),
});

// ============ User Management Schemas ============

export const ListUsersSchema = z.object({
  page: z.number().optional().default(1).describe("Page number"),
  pageSize: z.number().optional().default(20).describe("Page size"),
  userName: z.string().optional().describe("Filter by username"),
  role: z.string().optional().describe("Filter by role (1=user, 10=admin, -1=banned)"),
});

export const CreateUserSchema = z.object({
  username: z.string().describe("Username for the new user"),
  password: z.string().describe("Password for the new user"),
  permission: z.number().describe("User permission level (1=user, 10=admin, -1=banned)"),
});

export const UpdateUserSchema = z.object({
  uuid: z.string().describe("User UUID"),
  config: z.record(z.any()).describe("User configuration object"),
});

export const DeleteUsersSchema = z.object({
  uuids: z.array(z.string()).min(1).describe("Array of user UUIDs to delete"),
});

// ============ Tool Definitions ============

export const TOOL_DEFINITIONS = [
  {
    name: "get_overview",
    description:
      "Get overview data of the MCSManager panel. Returns system information, node status, and statistics.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "list_nodes",
    description:
      "List all available daemon nodes/servers. Returns information about each node including status and connectivity.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "list_instances",
    description:
      "List all instances on a specific daemon node. Can filter by name, status, or tag. Returns paginated results.",
    inputSchema: {
      type: "object",
      properties: {
        daemonId: { type: "string", description: "Daemon/Node ID to list instances from" },
        page: { type: "number", description: "Page number (default: 1)" },
        pageSize: { type: "number", description: "Number of items per page (default: 50)" },
        instanceName: { type: "string", description: "Filter by instance name (optional)" },
        status: { type: "string", description: "Filter by status (optional)" },
        tag: { type: "string", description: "Filter by tag (optional)" },
      },
      required: ["daemonId"],
    },
  },
  {
    name: "get_instance_info",
    description:
      "Get detailed information about a specific instance including configuration, status, and runtime info.",
    inputSchema: {
      type: "object",
      properties: {
        daemonId: { type: "string", description: "Daemon/Node ID" },
        uuid: { type: "string", description: "Instance UUID" },
      },
      required: ["daemonId", "uuid"],
    },
  },
  {
    name: "get_instance_log",
    description:
      "Get the console output log of an instance. Returns recent log entries from the instance console.",
    inputSchema: {
      type: "object",
      properties: {
        daemonId: { type: "string", description: "Daemon/Node ID" },
        uuid: { type: "string", description: "Instance UUID" },
        size: { type: "number", description: "Log size in KB (1-2048)" },
      },
      required: ["daemonId", "uuid"],
    },
  },
  {
    name: "start_instance",
    description: "Start an instance. The instance will begin running according to its configuration.",
    inputSchema: {
      type: "object",
      properties: {
        daemonId: { type: "string", description: "Daemon/Node ID" },
        uuid: { type: "string", description: "Instance UUID" },
      },
      required: ["daemonId", "uuid"],
    },
  },
  {
    name: "stop_instance",
    description:
      "Stop an instance gracefully. Sends stop command to the instance and waits for it to terminate.",
    inputSchema: {
      type: "object",
      properties: {
        daemonId: { type: "string", description: "Daemon/Node ID" },
        uuid: { type: "string", description: "Instance UUID" },
      },
      required: ["daemonId", "uuid"],
    },
  },
  {
    name: "restart_instance",
    description: "Restart an instance. Stops and then starts the instance.",
    inputSchema: {
      type: "object",
      properties: {
        daemonId: { type: "string", description: "Daemon/Node ID" },
        uuid: { type: "string", description: "Instance UUID" },
      },
      required: ["daemonId", "uuid"],
    },
  },
  {
    name: "kill_instance",
    description:
      "Force kill an instance immediately. Use this when stop_instance doesn't work or hangs.",
    inputSchema: {
      type: "object",
      properties: {
        daemonId: { type: "string", description: "Daemon/Node ID" },
        uuid: { type: "string", description: "Instance UUID" },
      },
      required: ["daemonId", "uuid"],
    },
  },
  {
    name: "delete_instance",
    description: "Delete an instance permanently. Can optionally delete instance files as well.",
    inputSchema: {
      type: "object",
      properties: {
        daemonId: { type: "string", description: "Daemon/Node ID" },
        uuid: { type: "string", description: "Instance UUID" },
        deleteFile: {
          type: "boolean",
          description: "Whether to delete instance files (default: false)",
        },
      },
      required: ["daemonId", "uuid"],
    },
  },
  {
    name: "create_instance",
    description: "Create a new instance with the specified configuration.",
    inputSchema: {
      type: "object",
      properties: {
        daemonId: { type: "string", description: "Daemon/Node ID" },
        config: { type: "object", description: "Instance configuration" },
      },
      required: ["daemonId", "config"],
    },
  },
  {
    name: "update_instance_config",
    description: "Update the configuration of an existing instance.",
    inputSchema: {
      type: "object",
      properties: {
        daemonId: { type: "string", description: "Daemon/Node ID" },
        uuid: { type: "string", description: "Instance UUID" },
        config: { type: "object", description: "Instance configuration updates" },
      },
      required: ["daemonId", "uuid", "config"],
    },
  },
  {
    name: "send_command",
    description: "Send a command to a running instance.",
    inputSchema: {
      type: "object",
      properties: {
        daemonId: { type: "string", description: "Daemon/Node ID" },
        uuid: { type: "string", description: "Instance UUID" },
        command: { type: "string", description: "Command to send to the instance" },
      },
      required: ["daemonId", "uuid", "command"],
    },
  },
  {
    name: "update_instance",
    description: "Update an instance (e.g., for software updates).",
    inputSchema: {
      type: "object",
      properties: {
        daemonId: { type: "string", description: "Daemon/Node ID" },
        uuid: { type: "string", description: "Instance UUID" },
      },
      required: ["daemonId", "uuid"],
    },
  },
  {
    name: "reinstall_instance",
    description: "Reinstall an instance with new software.",
    inputSchema: {
      type: "object",
      properties: {
        daemonId: { type: "string", description: "Daemon/Node ID" },
        uuid: { type: "string", description: "Instance UUID" },
        targetUrl: { type: "string", description: "URL to download the installation package" },
        title: { type: "string", description: "Installation title" },
        description: { type: "string", description: "Installation description" },
      },
      required: ["daemonId", "uuid", "targetUrl", "title", "description"],
    },
  },
  {
    name: "batch_start_instances",
    description: "Start multiple instances at once.",
    inputSchema: {
      type: "object",
      properties: {
        instances: {
          type: "array",
          items: {
            type: "object",
            properties: {
              uuid: { type: "string", description: "Instance UUID" },
              daemonId: { type: "string", description: "Daemon/Node ID" },
            },
            required: ["uuid", "daemonId"],
          },
          description: "Array of instances to start",
        },
      },
      required: ["instances"],
    },
  },
  {
    name: "batch_stop_instances",
    description: "Stop multiple instances at once.",
    inputSchema: {
      type: "object",
      properties: {
        instances: {
          type: "array",
          items: {
            type: "object",
            properties: {
              uuid: { type: "string", description: "Instance UUID" },
              daemonId: { type: "string", description: "Daemon/Node ID" },
            },
            required: ["uuid", "daemonId"],
          },
          description: "Array of instances to stop",
        },
      },
      required: ["instances"],
    },
  },
  {
    name: "batch_restart_instances",
    description: "Restart multiple instances at once.",
    inputSchema: {
      type: "object",
      properties: {
        instances: {
          type: "array",
          items: {
            type: "object",
            properties: {
              uuid: { type: "string", description: "Instance UUID" },
              daemonId: { type: "string", description: "Daemon/Node ID" },
            },
            required: ["uuid", "daemonId"],
          },
          description: "Array of instances to restart",
        },
      },
      required: ["instances"],
    },
  },
  {
    name: "batch_kill_instances",
    description: "Force kill multiple instances at once.",
    inputSchema: {
      type: "object",
      properties: {
        instances: {
          type: "array",
          items: {
            type: "object",
            properties: {
              uuid: { type: "string", description: "Instance UUID" },
              daemonId: { type: "string", description: "Daemon/Node ID" },
            },
            required: ["uuid", "daemonId"],
          },
          description: "Array of instances to kill",
        },
      },
      required: ["instances"],
    },
  },
  {
    name: "list_files",
    description:
      "List files and directories in an instance directory. Returns file information including size, type, and modification time.",
    inputSchema: {
      type: "object",
      properties: {
        daemonId: { type: "string", description: "Daemon/Node ID" },
        uuid: { type: "string", description: "Instance UUID" },
        target: { type: "string", description: "Directory path (default: '.')" },
        page: { type: "number", description: "Page number (default: 1)" },
        pageSize: { type: "number", description: "Items per page (default: 100)" },
      },
      required: ["daemonId", "uuid"],
    },
  },
  {
    name: "create_folder",
    description: "Create a new folder in an instance directory.",
    inputSchema: {
      type: "object",
      properties: {
        daemonId: { type: "string", description: "Daemon/Node ID" },
        uuid: { type: "string", description: "Instance UUID" },
        target: { type: "string", description: "Folder path to create" },
      },
      required: ["daemonId", "uuid", "target"],
    },
  },
  {
    name: "delete_files",
    description: "Delete one or more files or directories from an instance.",
    inputSchema: {
      type: "object",
      properties: {
        daemonId: { type: "string", description: "Daemon/Node ID" },
        uuid: { type: "string", description: "Instance UUID" },
        targets: {
          type: "array",
          items: { type: "string" },
          description: "Array of file/folder paths to delete",
        },
      },
      required: ["daemonId", "uuid", "targets"],
    },
  },
  {
    name: "read_file",
    description:
      "Read the content of a text file from an instance. Returns the file content as a string.",
    inputSchema: {
      type: "object",
      properties: {
        daemonId: { type: "string", description: "Daemon/Node ID" },
        uuid: { type: "string", description: "Instance UUID" },
        target: { type: "string", description: "File path to read" },
      },
      required: ["daemonId", "uuid", "target"],
    },
  },
  {
    name: "write_file",
    description: "Write content to a file in an instance. Creates the file if it doesn't exist.",
    inputSchema: {
      type: "object",
      properties: {
        daemonId: { type: "string", description: "Daemon/Node ID" },
        uuid: { type: "string", description: "Instance UUID" },
        target: { type: "string", description: "File path to write" },
        content: { type: "string", description: "Content to write to file" },
      },
      required: ["daemonId", "uuid", "target", "content"],
    },
  },
  {
    name: "list_schedules",
    description:
      "List all scheduled tasks for an instance. Returns information about scheduled actions.",
    inputSchema: {
      type: "object",
      properties: {
        daemonId: { type: "string", description: "Daemon/Node ID" },
        uuid: { type: "string", description: "Instance UUID" },
      },
      required: ["daemonId", "uuid"],
    },
  },
  {
    name: "create_schedule",
    description:
      "Create a new scheduled task for an instance. Can schedule actions like start, stop, restart, or custom commands.",
    inputSchema: {
      type: "object",
      properties: {
        daemonId: { type: "string", description: "Daemon/Node ID" },
        uuid: { type: "string", description: "Instance UUID" },
        name: { type: "string", description: "Task name" },
        action: { type: "string", description: "Action to perform (start, stop, restart, command)" },
        time: { type: "string", description: "Cron expression (optional)" },
        count: { type: "number", description: "Repeat count (-1 for infinite)" },
        payload: { type: "string", description: "Additional payload (optional)" },
      },
      required: ["daemonId", "uuid", "name", "action"],
    },
  },
  {
    name: "delete_schedule",
    description: "Delete a scheduled task from an instance.",
    inputSchema: {
      type: "object",
      properties: {
        daemonId: { type: "string", description: "Daemon/Node ID" },
        uuid: { type: "string", description: "Instance UUID" },
        taskName: { type: "string", description: "Task name to delete" },
      },
      required: ["daemonId", "uuid", "taskName"],
    },
  },
  {
    name: "list_users",
    description: "List all users with optional filtering and pagination.",
    inputSchema: {
      type: "object",
      properties: {
        page: { type: "number", description: "Page number (default: 1)" },
        pageSize: { type: "number", description: "Page size (default: 20)" },
        userName: { type: "string", description: "Filter by username (optional)" },
        role: { type: "string", description: "Filter by role (1=user, 10=admin, -1=banned) (optional)" },
      },
      required: [],
    },
  },
  {
    name: "create_user",
    description: "Create a new user.",
    inputSchema: {
      type: "object",
      properties: {
        username: { type: "string", description: "Username for the new user" },
        password: { type: "string", description: "Password for the new user" },
        permission: { type: "number", description: "User permission level (1=user, 10=admin, -1=banned)" },
      },
      required: ["username", "password", "permission"],
    },
  },
  {
    name: "update_user",
    description: "Update user data.",
    inputSchema: {
      type: "object",
      properties: {
        uuid: { type: "string", description: "User UUID" },
        config: { type: "object", description: "User configuration object" },
      },
      required: ["uuid", "config"],
    },
  },
  {
    name: "delete_users",
    description: "Delete one or more users.",
    inputSchema: {
      type: "object",
      properties: {
        uuids: { 
          type: "array", 
          items: { type: "string" },
          description: "Array of user UUIDs to delete" 
        },
      },
      required: ["uuids"],
    },
  },
];

export function listTools() {
  return { tools: TOOL_DEFINITIONS };
}

// Helper function to convert status code to text
function getStatusText(status: number): string {
  switch (status) {
    case 0: return "已停止";
    case 1: return "正在运行";
    case 2: return "正在启动";
    case 3: return "正在停止";
    case 4: return "正在重启";
    case -1: return "未知状态";
    default: return `未知 (${status})`;
  }
}

// ============ Tool Handler ============

export async function handleToolCall(request: any, mcsmClient: MCSManagerClient) {
  try {
    const { name, arguments: args } = request.params;
    
    // Add logging for debugging
    console.log(`[MCP] Tool call received: ${name}`, JSON.stringify(args, null, 2));

    switch (name) {
      case "get_overview": {
        const overview = await mcsmClient.getOverview();
        console.log(`[MCP] Tool call completed: get_overview`);
        // Format the response for better readability
        const formattedResponse = `# MCSManager 面板概览

## 系统信息
- 平台: ${overview?.system?.platform || '未知'}
- 版本: ${overview?.version || '未知'}
- 启动时间: ${overview?.system?.time ? new Date(overview.system.time).toLocaleString() : '未知'}

## 节点统计
- 总节点数: ${overview?.remoteCount?.total || 0}
- 在线节点数: ${overview?.remoteCount?.available || 0}
- 离线节点数: ${(overview?.remoteCount?.total || 0) - (overview?.remoteCount?.available || 0)}

## 实例统计
- 总实例数: ${overview?.remote?.reduce((sum, node) => sum + (node.instance?.total || 0), 0) || 0}
- 运行中: ${overview?.remote?.reduce((sum, node) => sum + (node.instance?.running || 0), 0) || 0}`;
        return { content: [{ type: "text", text: formattedResponse }] };
      }

      case "list_nodes": {
        const nodes = await mcsmClient.listNodes();
        console.log(`[MCP] Tool call completed: list_nodes`);
        // Format the response for better readability
        if (!nodes || nodes.length === 0) {
          return { content: [{ type: "text", text: "未找到任何节点" }] };
        }
        
        let response = "# 节点列表\n\n";
        nodes.forEach((node: any, index: number) => {
          response += `## 节点 ${index + 1}\n- ID: ${node.uuid}\n- 名称: ${node.remarks || '未命名'}\n- 地址: ${node.ip}:${node.port}\n- 状态: ${node.available ? '在线' : '离线'}\n- 版本: ${node.version || '未知'}\n- 心跳时间: ${new Date(node.lastHeartbeat).toLocaleString()}\n\n`;
        });
        
        return { content: [{ type: "text", text: response }] };
      }

      case "list_instances": {
        const params = ListInstancesSchema.parse(args);
        const instances = await mcsmClient.listInstances(
          params.daemonId,
          params.page,
          params.pageSize,
          {
            instanceName: params.instanceName,
            status: params.status,
            tag: params.tag,
          }
        );
        console.log(`[MCP] Tool call completed: list_instances`);
        // Format the response for better readability
        if (!instances || !instances.data || instances.data.length === 0) {
          return { content: [{ type: "text", text: "该节点上未找到任何实例" }] };
        }
        
        let response = `# 实例列表 (节点: ${params.daemonId})\n\n`;
        response += `页面: ${instances.page}/${instances.maxPage} | 总数: ${instances.total}\n\n`;
        
        instances.data.forEach((instance: any) => {
          response += `## ${instance.config?.nickname || '未命名实例'}\n- ID: ${instance.instanceUuid}\n- 状态: ${getStatusText(instance.status)}\n- 类型: ${instance.config?.type || '未知'}\n- 启动次数: ${instance.started || 0}\n- 标签: ${instance.tag || '无'}\n\n`;
        });
        
        return { content: [{ type: "text", text: response }] };
      }

      case "get_instance_info": {
        const params = InstanceOperationSchema.parse(args);
        const info = await mcsmClient.getInstanceInfo(params.daemonId, params.uuid);
        console.log(`[MCP] Tool call completed: get_instance_info`);
        // Format the response for better readability
        if (!info) {
          return { content: [{ type: "text", text: "未找到指定实例" }] };
        }
        
        const response = `# 实例详细信息

## 基本信息
- 名称: ${info.config?.nickname || '未命名'}
- ID: ${info.instanceUuid}
- 状态: ${getStatusText(info.status)}
- 类型: ${info.config?.type || '未知'}
- 启动次数: ${info.started || 0}
- 标签: ${(info.config?.tag || []).join(', ') || '无'}

## 配置信息
- 启动命令: ${info.config?.startCommand || '无'}
- 停止命令: ${info.config?.stopCommand || '无'}
- CWD: ${info.config?.cwd || '无'}
- 文件编码: ${info.config?.oe || 'UTF-8'}

## 运行时信息
- 当前玩家: ${info.info?.currentPlayers || '无'}
- 最大玩家: ${info.info?.maxPlayers || '无'}
- 版本: ${info.info?.version || '无'}`;
        
        return { content: [{ type: "text", text: response }] };
      }

      case "get_instance_log": {
        const params = GetInstanceOutputLogSchema.parse(args);
        const log = await mcsmClient.getInstanceOutputLog(params.daemonId, params.uuid, params.size);
        console.log(`[MCP] Tool call completed: get_instance_log`);
        // Format the response for better readability
        const response = `# 实例控制台日志

## 实例ID: ${params.uuid}
## 节点ID: ${params.daemonId}

## 日志内容:
${log || '无日志内容'}`;
        
        return { content: [{ type: "text", text: response }] };
      }

      case "start_instance": {
        const params = InstanceOperationSchema.parse(args);
        const result = await mcsmClient.startInstance(params.daemonId, params.uuid);
        console.log(`[MCP] Tool call completed: start_instance`);
        const response = `# 实例启动操作

## 实例ID: ${params.uuid}
## 节点ID: ${params.daemonId}

### 操作结果: ${result ? '成功' : '失败'}
${result ? '实例已成功发送启动命令。' : '实例启动失败。'}`;
        return {
          content: [{ type: "text", text: response }],
        };
      }

      case "stop_instance": {
        const params = InstanceOperationSchema.parse(args);
        const result = await mcsmClient.stopInstance(params.daemonId, params.uuid);
        console.log(`[MCP] Tool call completed: stop_instance`);
        const response = `# 实例停止操作

## 实例ID: ${params.uuid}
## 节点ID: ${params.daemonId}

### 操作结果: ${result ? '成功' : '失败'}
${result ? '实例已成功发送停止命令。' : '实例停止失败。'}`;
        return {
          content: [{ type: "text", text: response }],
        };
      }

      case "restart_instance": {
        const params = InstanceOperationSchema.parse(args);
        const result = await mcsmClient.restartInstance(params.daemonId, params.uuid);
        console.log(`[MCP] Tool call completed: restart_instance`);
        const response = `# 实例重启操作

## 实例ID: ${params.uuid}
## 节点ID: ${params.daemonId}

### 操作结果: ${result ? '成功' : '失败'}
${result ? '实例已成功发送重启命令。' : '实例重启失败。'}`;
        return {
          content: [{ type: "text", text: response }],
        };
      }

      case "kill_instance": {
        const params = InstanceOperationSchema.parse(args);
        const result = await mcsmClient.killInstance(params.daemonId, params.uuid);
        console.log(`[MCP] Tool call completed: kill_instance`);
        const response = `# 实例强制终止操作

## 实例ID: ${params.uuid}
## 节点ID: ${params.daemonId}

### 操作结果: ${result ? '成功' : '失败'}
${result ? '实例已成功发送强制终止命令。' : '实例强制终止失败。'}`;
        return {
          content: [{ type: "text", text: response }],
        };
      }

      case "delete_instance": {
        const params = DeleteInstanceSchema.parse(args);
        const result = await mcsmClient.deleteInstance(
          params.daemonId,
          params.uuid,
          params.deleteFile
        );
        console.log(`[MCP] Tool call completed: delete_instance`);
        const response = `# 实例删除操作

## 实例ID: ${params.uuid}
## 节点ID: ${params.daemonId}
## 删除文件: ${params.deleteFile ? '是' : '否'}

### 操作结果: ${result ? '成功' : '失败'}
${result ? '实例已成功删除。' : '实例删除失败。'}`;
        return {
          content: [{ type: "text", text: response }],
        };
      }

      case "create_instance": {
        const params = CreateInstanceSchema.parse(args);
        const result = await mcsmClient.createInstance(
          params.daemonId,
          params.config
        );
        console.log(`[MCP] Tool call completed: create_instance`);
        const response = `# 实例创建操作

## 节点ID: ${params.daemonId}

### 操作结果: ${result ? '成功' : '失败'}
${result ? '实例已成功创建。' : '实例创建失败。'}

创建的实例ID: ${result?.instanceUuid || '未知'}`;
        return {
          content: [{ type: "text", text: response }],
        };
      }

      case "update_instance_config": {
        const params = UpdateInstanceConfigSchema.parse(args);
        const result = await mcsmClient.updateInstanceConfig(
          params.daemonId,
          params.uuid,
          params.config
        );
        console.log(`[MCP] Tool call completed: update_instance_config`);
        const response = `# 实例配置更新操作

## 实例ID: ${params.uuid}
## 节点ID: ${params.daemonId}

### 操作结果: ${result ? '成功' : '失败'}
${result ? '实例配置已成功更新。' : '实例配置更新失败。'}`;
        return {
          content: [{ type: "text", text: response }],
        };
      }

      case "send_command": {
        const params = SendCommandSchema.parse(args);
        const result = await mcsmClient.sendCommand(
          params.daemonId,
          params.uuid,
          params.command
        );
        console.log(`[MCP] Tool call completed: send_command`);
        const response = `# 发送命令操作

## 实例ID: ${params.uuid}
## 节点ID: ${params.daemonId}
## 命令: ${params.command}

### 操作结果: ${result ? '成功' : '失败'}
${result ? '命令已成功发送到实例。' : '命令发送失败。'}`;
        return {
          content: [{ type: "text", text: response }],
        };
      }

      case "update_instance": {
        const params = UpdateInstanceSchema.parse(args);
        const result = await mcsmClient.updateInstance(
          params.daemonId,
          params.uuid
        );
        console.log(`[MCP] Tool call completed: update_instance`);
        const response = `# 实例更新操作

## 实例ID: ${params.uuid}
## 节点ID: ${params.daemonId}

### 操作结果: ${result ? '成功启动' : '启动失败'}
${result ? '实例更新任务已成功启动。' : '实例更新任务启动失败。'}`;
        return {
          content: [{ type: "text", text: response }],
        };
      }

      case "reinstall_instance": {
        const params = ReinstallInstanceSchema.parse(args);
        const result = await mcsmClient.reinstallInstance(
          params.daemonId,
          params.uuid,
          {
            targetUrl: params.targetUrl,
            title: params.title,
            description: params.description,
          }
        );
        console.log(`[MCP] Tool call completed: reinstall_instance`);
        const response = `# 实例重装操作

## 实例ID: ${params.uuid}
## 节点ID: ${params.daemonId}
## 安装标题: ${params.title}

### 操作结果: ${result ? '成功启动' : '启动失败'}
${result ? '实例重装任务已成功启动。' : '实例重装任务启动失败。'}`;
        return {
          content: [{ type: "text", text: response }],
        };
      }

      case "batch_start_instances": {
        const params = BatchInstancesSchema.parse(args);
        // Ensure all instances have required fields
        const instances = params.instances.map(instance => ({
          uuid: instance.uuid,
          daemonId: instance.daemonId
        }));
        const result = await mcsmClient.batchStartInstances(instances);
        console.log(`[MCP] Tool call completed: batch_start_instances`);
        const response = `# 批量启动实例操作

## 实例数量: ${instances.length}

### 操作结果: ${result ? '成功' : '失败'}
${result ? '批量启动操作已完成。' : '批量启动操作失败。'}`;
        return {
          content: [{ type: "text", text: response }],
        };
      }

      case "batch_stop_instances": {
        const params = BatchInstancesSchema.parse(args);
        // Ensure all instances have required fields
        const instances = params.instances.map(instance => ({
          uuid: instance.uuid,
          daemonId: instance.daemonId
        }));
        const result = await mcsmClient.batchStopInstances(instances);
        console.log(`[MCP] Tool call completed: batch_stop_instances`);
        const response = `# 批量停止实例操作

## 实例数量: ${instances.length}

### 操作结果: ${result ? '成功' : '失败'}
${result ? '批量停止操作已完成。' : '批量停止操作失败。'}`;
        return {
          content: [{ type: "text", text: response }],
        };
      }

      case "batch_restart_instances": {
        const params = BatchInstancesSchema.parse(args);
        // Ensure all instances have required fields
        const instances = params.instances.map(instance => ({
          uuid: instance.uuid,
          daemonId: instance.daemonId
        }));
        const result = await mcsmClient.batchRestartInstances(instances);
        console.log(`[MCP] Tool call completed: batch_restart_instances`);
        const response = `# 批量重启实例操作

## 实例数量: ${instances.length}

### 操作结果: ${result ? '成功' : '失败'}
${result ? '批量重启操作已完成。' : '批量重启操作失败。'}`;
        return {
          content: [{ type: "text", text: response }],
        };
      }

      case "batch_kill_instances": {
        const params = BatchInstancesSchema.parse(args);
        // Ensure all instances have required fields
        const instances = params.instances.map(instance => ({
          uuid: instance.uuid,
          daemonId: instance.daemonId
        }));
        const result = await mcsmClient.batchKillInstances(instances);
        console.log(`[MCP] Tool call completed: batch_kill_instances`);
        const response = `# 批量强制终止实例操作

## 实例数量: ${instances.length}

### 操作结果: ${result ? '成功' : '失败'}
${result ? '批量强制终止操作已完成。' : '批量强制终止操作失败。'}`;
        return {
          content: [{ type: "text", text: response }],
        };
      }

      case "list_files": {
        const params = ListFilesSchema.parse(args);
        const files = await mcsmClient.listFiles(
          params.daemonId,
          params.uuid,
          params.target,
          params.page,
          params.pageSize
        );
        console.log(`[MCP] Tool call completed: list_files`);
        if (!files || !files.items || files.items.length === 0) {
          return { content: [{ type: "text", text: `目录 "${params.target}" 为空或不存在` }] };
        }
        
        let response = `# 文件列表

## 实例ID: ${params.uuid}
## 节点ID: ${params.daemonId}
## 路径: ${params.target}

页面: ${files.page}/${Math.ceil(files.total / files.pageSize)} | 总数: ${files.total}

`;
        
        files.items.forEach((file: any) => {
          const type = file.type === 1 ? '[文件]' : '[目录]';
          const size = file.size ? (file.size / 1024).toFixed(2) + ' KB' : '-';
          const time = new Date(file.time).toLocaleString();
          response += `${type} ${file.name} (${size}) ${time}
`;
        });
        
        return { content: [{ type: "text", text: response }] };
      }

      case "create_folder": {
        const params = CreateFolderSchema.parse(args);
        const result = await mcsmClient.createFolder(params.daemonId, params.uuid, params.target);
        console.log(`[MCP] Tool call completed: create_folder`);
        const response = `# 创建目录操作

## 实例ID: ${params.uuid}
## 节点ID: ${params.daemonId}
## 目录路径: ${params.target}

### 操作结果: ${result ? '成功' : '失败'}
${result ? '目录已成功创建。' : '目录创建失败。'}`;
        return {
          content: [{ type: "text", text: response }],
        };
      }

      case "delete_files": {
        const params = DeleteFilesSchema.parse(args);
        const result = await mcsmClient.deleteFile(params.daemonId, params.uuid, params.targets);
        console.log(`[MCP] Tool call completed: delete_files`);
        const response = `# 删除文件/目录操作

## 实例ID: ${params.uuid}
## 节点ID: ${params.daemonId}
## 目标数量: ${params.targets.length}

### 操作结果: ${result ? '成功' : '失败'}
${result ? '文件/目录已成功删除。' : '文件/目录删除失败。'}`;
        return {
          content: [{ type: "text", text: response }],
        };
      }

      case "read_file": {
        const params = ReadFileSchema.parse(args);
        const content = await mcsmClient.getFileContent(
          params.daemonId,
          params.uuid,
          params.target
        );
        console.log(`[MCP] Tool call completed: read_file`);
        const response = `# 读取文件内容

## 实例ID: ${params.uuid}
## 节点ID: ${params.daemonId}
## 文件路径: ${params.target}

## 文件内容:
${content || '文件为空或不存在'}`;
        return { content: [{ type: "text", text: response }] };
      }

      case "write_file": {
        const params = WriteFileSchema.parse(args);
        const result = await mcsmClient.writeFileContent(
          params.daemonId,
          params.uuid,
          params.target,
          params.content
        );
        console.log(`[MCP] Tool call completed: write_file`);
        const response = `# 写入文件操作

## 实例ID: ${params.uuid}
## 节点ID: ${params.daemonId}
## 文件路径: ${params.target}

### 操作结果: ${result ? '成功' : '失败'}
${result ? '文件内容已成功写入。' : '文件写入失败。'}`;
        return {
          content: [{ type: "text", text: response }],
        };
      }

      case "list_schedules": {
        const params = ListSchedulesSchema.parse(args);
        const schedules = await mcsmClient.listSchedules(params.daemonId, params.uuid);
        console.log(`[MCP] Tool call completed: list_schedules`);
        if (!schedules || schedules.length === 0) {
          return { content: [{ type: "text", text: "该实例未设置任何计划任务" }] };
        }
        
        let response = `# 计划任务列表

## 实例ID: ${params.uuid}
## 节点ID: ${params.daemonId}

`;
        
        schedules.forEach((schedule: any) => {
          response += `## 任务名称: ${schedule.name}
- 操作: ${schedule.action}
- Cron表达式: ${schedule.time || '无'}
- 重复次数: ${schedule.count === -1 ? '无限' : schedule.count}
- 负载: ${schedule.payload || '无'}

`;
        });
        
        return { content: [{ type: "text", text: response }] };
      }

      case "create_schedule": {
        const params = CreateScheduleSchema.parse(args);
        const result = await mcsmClient.createSchedule(params.daemonId, params.uuid, {
          name: params.name,
          action: params.action,
          time: params.time,
          count: params.count,
          payload: params.payload,
        });
        console.log(`[MCP] Tool call completed: create_schedule`);
        const response = `# 创建计划任务

## 实例ID: ${params.uuid}
## 节点ID: ${params.daemonId}
## 任务名称: ${params.name}
## 操作: ${params.action}

### 操作结果: ${result ? '成功' : '失败'}
${result ? '计划任务已成功创建。' : '计划任务创建失败。'}`;
        return {
          content: [{ type: "text", text: response }],
        };
      }

      case "delete_schedule": {
        const params = DeleteScheduleSchema.parse(args);
        const result = await mcsmClient.deleteSchedule(
          params.daemonId,
          params.uuid,
          params.taskName
        );
        console.log(`[MCP] Tool call completed: delete_schedule`);
        const response = `# 删除计划任务

## 实例ID: ${params.uuid}
## 节点ID: ${params.daemonId}
## 任务名称: ${params.taskName}

### 操作结果: ${result ? '成功' : '失败'}
${result ? '计划任务已成功删除。' : '计划任务删除失败。'}`;
        return {
          content: [{ type: "text", text: response }],
        };
      }

      case "list_users": {
        const params = ListUsersSchema.parse(args);
        const users = await mcsmClient.listUsers(
          params.page,
          params.pageSize,
          {
            userName: params.userName,
            role: params.role,
          }
        );
        console.log(`[MCP] Tool call completed: list_users`);
        if (!users || users.length === 0) {
          return { content: [{ type: "text", text: "未找到任何用户" }] };
        }
        
        let response = `# 用户列表

总数: ${users.length}

`;
        
        users.forEach((user: any) => {
          const role = user.permission === 10 ? '管理员' : user.permission === 1 ? '普通用户' : '已封禁';
          response += `## 用户名: ${user.username}
- ID: ${user.uuid}
- 角色: ${role}
- 注册时间: ${new Date(user.registerTime).toLocaleString()}

`;
        });
        
        return { content: [{ type: "text", text: response }] };
      }

      case "create_user": {
        const params = CreateUserSchema.parse(args);
        const result = await mcsmClient.createUser(
          params.username,
          params.password,
          params.permission
        );
        console.log(`[MCP] Tool call completed: create_user`);
        const role = params.permission === 10 ? '管理员' : params.permission === 1 ? '普通用户' : '已封禁';
        const response = `# 创建用户

## 用户名: ${params.username}
## 角色: ${role}

### 操作结果: ${result ? '成功' : '失败'}
${result ? '用户已成功创建。' : '用户创建失败。'}`;
        return {
          content: [{ type: "text", text: response }],
        };
      }

      case "update_user": {
        const params = UpdateUserSchema.parse(args);
        const result = await mcsmClient.updateUser(
          params.uuid,
          params.config
        );
        console.log(`[MCP] Tool call completed: update_user`);
        const response = `# 更新用户

## 用户ID: ${params.uuid}

### 操作结果: ${result ? '成功' : '失败'}
${result ? '用户信息已成功更新。' : '用户信息更新失败。'}`;
        return {
          content: [{ type: "text", text: response }],
        };
      }

      case "delete_users": {
        const params = DeleteUsersSchema.parse(args);
        const result = await mcsmClient.deleteUser(params.uuids);
        console.log(`[MCP] Tool call completed: delete_users`);
        const response = `# 删除用户

## 用户数量: ${params.uuids.length}

### 操作结果: ${result ? '成功' : '失败'}
${result ? '用户已成功删除。' : '用户删除失败。'}`;
        return {
          content: [{ type: "text", text: response }],
        };
      }

      default:
        console.log(`[MCP] Unknown tool called: ${name}`);
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    console.log(`[MCP] Tool call error: ${request.params.name}`, error);
    if (error instanceof z.ZodError) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid parameters: ${error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`
      );
    }
    throw error;
  }
}

export const toolSchemas = {
  ListNodesSchema,
  ListInstancesSchema,
  InstanceOperationSchema,
  DeleteInstanceSchema,
  ListFilesSchema,
  CreateFolderSchema,
  DeleteFilesSchema,
  ReadFileSchema,
  WriteFileSchema,
  ListSchedulesSchema,
  CreateScheduleSchema,
  DeleteScheduleSchema,
  ListUsersSchema,
  CreateUserSchema,
  UpdateUserSchema,
  DeleteUsersSchema,
  GetOverviewSchema,
  CreateInstanceSchema,
  UpdateInstanceConfigSchema,
  SendCommandSchema,
  UpdateInstanceSchema,
  ReinstallInstanceSchema,
  GetInstanceOutputLogSchema,
  BatchInstancesSchema,
};



