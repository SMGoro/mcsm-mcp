/**
 * MCSManager SDK
 * Main entry point for the MCSManager SDK
 */

// Export all types
export * from "./api-types.js";

// Export the main SDK class
export { UserAPI as MCSManagerSDK } from "./user-api.js";

// Export individual API classes for more granular control
export { MCSManagerSDK as CoreAPI } from "./core-api.js";
export { InstanceAPI } from "./instance-api.js";
export { FileAPI } from "./file-api.js";
export { ScheduleAPI } from "./schedule-api.js";
export { UserAPI } from "./user-api.js";