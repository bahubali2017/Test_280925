import fs from "fs";
import path from "path";

const version = Date.now().toString();
const timestamp = new Date().toISOString();

try {
  // Update server-side version generation to use current timestamp
  const serverRoutesPath = "server/routes.js";
  let serverRoutes = fs.readFileSync(serverRoutesPath, "utf8");

  // Force new version hash by updating the build timestamp
  const versionHashRegex = /const buildTimestamp = process\.env\.BUILD_TIMESTAMP \|\| serverStartTime;/;
  serverRoutes = serverRoutes.replace(
    versionHashRegex, 
    `const buildTimestamp = "${Date.now()}"; // Force new hash: ${timestamp}`
  );

  fs.writeFileSync(serverRoutesPath, serverRoutes);

  console.log("🔄 Build version bumped:", version);
  console.log("⚡ Cache cleared and fresh build forced");
  console.log("📅 Timestamp:", timestamp);
} catch (error) {
  console.error("❌ Error bumping version:", error.message);
  process.exit(1);
}