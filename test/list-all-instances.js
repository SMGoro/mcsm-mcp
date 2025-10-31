#!/usr/bin/env node

/**
 * List All MCSManager Instances
 * A simple script to list all instances across all nodes
 */

import { MCPClient as MCSManagerClient } from "./dist/api-client.js";

async function listAllInstances() {
  // Get configuration from environment variables
  const apiUrl = process.env.MCSM_API_URL || "http://localhost:23333";
  const apiKey = process.env.MCSM_API_KEY || "d3f467e1aaed4481b6e83043dbc4bbab";

  if (!apiKey) {
    console.error("Error: MCSM_API_KEY environment variable is required");
    console.error("Usage: MCSM_API_KEY=your_key MCSM_API_URL=http://your-mcsm:23333 node list-all-instances.js");
    process.exit(1);
  }

  console.log("MCSManager Instance List");
  console.log("========================");
  console.log(`API URL: ${apiUrl}`);
  console.log("");

  try {
    // Initialize MCSManager client
    const client = new MCSManagerClient({
      apiUrl,
      apiKey,
    });

    // Get overview data
    console.log("📋 System Overview:");
    try {
      const overview = await client.getOverview();
      console.log(`  Version: ${overview.version}`);
      console.log(`  Connected Nodes: ${overview.remoteCount.available}/${overview.remoteCount.total}`);
      console.log("");
    } catch (error) {
      console.log(`  ❌ Failed to get overview: ${error.message}`);
      console.log("");
    }

    // List all nodes
    console.log("🌐 Daemon Nodes:");
    let nodes;
    try {
      nodes = await client.listNodes();
      console.log(`  Found ${nodes.length} nodes:`);
      nodes.forEach((node, index) => {
        console.log(`    ${index + 1}. ${node.remarks || node.uuid} (${node.ip}:${node.port}) - ${node.available ? '✅ Available' : '❌ Unavailable'}`);
      });
      console.log("");
    } catch (error) {
      console.error("❌ Failed to list nodes:", error.message);
      process.exit(1);
    }

    // List instances on each node
    console.log("🎮 Instances:");
    if (nodes.length === 0) {
      console.log("  No nodes found");
      return;
    }

    for (const [nodeIndex, node] of nodes.entries()) {
      if (!node.available) {
        console.log(`  ${nodeIndex + 1}. ${node.remarks || node.uuid} - Skipped (unavailable)`);
        continue;
      }

      console.log(`  ${nodeIndex + 1}. ${node.remarks || node.uuid}:`);
      
      try {
        // Get first page of instances (up to 100)
        const instances = await client.listInstances(node.uuid, 1, 100);
        
        if (!instances.data || instances.data.length === 0) {
          console.log("    No instances found");
          continue;
        }

        console.log(`    Found ${instances.data.length} instances:`);
        
        // Display instance information
        instances.data.forEach((instance, index) => {
          const statusText = getStatusText(instance.status);
          const name = instance.config?.nickname || instance.instanceUuid;
          console.log(`      ${index + 1}. ${name} - ${statusText}`);
          
          // Show additional info if available
          if (instance.info) {
            const players = instance.info.currentPlayers !== undefined ? `${instance.info.currentPlayers}/${instance.info.maxPlayers || '?'}` : '';
            if (players) {
              console.log(`         Players: ${players}`);
            }
            if (instance.info.version) {
              console.log(`         Version: ${instance.info.version}`);
            }
          }
        });
      } catch (error) {
        console.log(`    ❌ Failed to list instances: ${error.message}`);
      }
      
      console.log("");
    }

  } catch (error) {
    if (error.message.includes('authentication failed')) {
      console.error("❌ Authentication failed. Please check your API key.");
      console.error("Get your API key from: MCSManager Web UI → 用户设置 → API 密钥");
    } else if (error.message.includes('Cannot connect')) {
      console.error("❌ Cannot connect to MCSManager API. Please check if MCSManager is running and the URL is correct.");
    } else {
      console.error("❌ Error:", error.message);
    }
    process.exit(1);
  }
}

function getStatusText(status) {
  switch (status) {
    case 0: return "⛔ Stopped";
    case 1: return "🟢 Running";
    case 2: return "🟠 Starting";
    case 3: return "🔴 Stopping";
    default: return `Unknown (${status})`;
  }
}

// Run the script
listAllInstances();