import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const backendPath = path.resolve(__dirname, "../backend");
const pythonPath = process.platform === "win32"
  ? path.join(backendPath, ".venv", "Scripts", "python.exe")
  : path.join(backendPath, ".venv", "bin", "python");

export default defineConfig({
  testDir: "./tests",
  testMatch: "backend-integration.spec.ts",
  timeout: 60_000,
  use: {
    baseURL: "http://127.0.0.1:8001",
    trace: "retain-on-failure",
  },
  webServer: {
    command: `\"${pythonPath}\" -m uvicorn app.main:app --host 127.0.0.1 --port 8001`,
    cwd: backendPath,
    url: "http://127.0.0.1:8001/api/health",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      KANBAN_DATABASE_PATH: path.resolve(__dirname, "../backend/data/playwright-integration.db"),
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
