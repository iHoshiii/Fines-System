const { spawn } = require("child_process");
const path = require("path");

const root = __dirname;
const frontendDir = path.join(root, "frontend");

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const pythonCmd =
  process.platform === "win32"
    ? path.join(root, ".venv", "Scripts", "python.exe")
    : path.join(root, ".venv", "bin", "python");

function run(name, command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: root,
    stdio: ["inherit", "pipe", "pipe"],
    // Some Windows shells used by IDE terminals fail with EINVAL unless shell mode is enabled.
    shell: process.platform === "win32",
    windowsHide: true,
    ...options,
  });

  child.stdout.on("data", (data) => {
    process.stdout.write(`[${name}] ${data}`);
  });

  child.stderr.on("data", (data) => {
    process.stderr.write(`[${name}] ${data}`);
  });

  child.on("error", (error) => {
    process.stderr.write(`[${name}] Failed to start: ${error.message}\n`);
  });

  return child;
}

const frontend = run("FRONTEND", npmCmd, ["run", "dev"], { cwd: frontendDir });
const backend = run("BACKEND", pythonCmd, [
  "-m",
  "uvicorn",
  "main:app",
  "--app-dir",
  "backend",
  "--port",
  "8000",
  "--reload",
]);

let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  process.stdout.write(`\nStopping services (${signal})...\n`);

  if (frontend && !frontend.killed) frontend.kill(signal);
  if (backend && !backend.killed) backend.kill(signal);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

frontend.on("exit", (code) => {
  process.stdout.write(`[FRONTEND] exited with code ${code}\n`);
  if (!shuttingDown) shutdown("SIGTERM");
});

backend.on("exit", (code) => {
  process.stdout.write(`[BACKEND] exited with code ${code}\n`);
  if (!shuttingDown) shutdown("SIGTERM");
});
