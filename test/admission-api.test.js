import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import test from "node:test";

async function getAvailablePort() {
  const listener = createServer();
  await new Promise((resolve, reject) => {
    listener.once("error", reject);
    listener.listen(0, "127.0.0.1", resolve);
  });
  const { port } = listener.address();
  await new Promise((resolve, reject) => listener.close((error) => error ? reject(error) : resolve()));
  return port;
}

async function waitForServer(child, url) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`Admission test server exited with code ${child.exitCode}.`);
    }
    try {
      const response = await fetch(`${url}/api/health`);
      if (response.ok) return;
    } catch {
      await delay(100);
    }
  }
  throw new Error("Admission test server did not start.");
}

test("admission API validates input and reports missing MongoDB configuration", async (t) => {
  const port = await getAvailablePort();
  const url = `http://127.0.0.1:${port}`;
  const env = { ...process.env, HOST: "127.0.0.1", PORT: String(port), MONGODB_URI: "" };
  delete env.RECORDS_ACCESS_TOKEN;
  const child = spawn(process.execPath, ["server.js"], {
    cwd: process.cwd(),
    env,
    stdio: "ignore",
  });
  t.after(async () => {
    if (child.exitCode === null) {
      child.kill();
      await new Promise((resolve) => child.once("exit", resolve));
    }
  });
  await waitForServer(child, url);

  const invalidResponse = await fetch(`${url}/api/admissions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentName: "A" }),
  });
  assert.equal(invalidResponse.status, 400);
  assert.match((await invalidResponse.json()).error, /valid student name/i);

  const unavailableResponse = await fetch(`${url}/api/admissions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentName: "Fictional Applicant",
      course: "B.Com",
      academicSession: "2026-27",
      email: "fictional@example.com",
      contactNumber: "+1 202 555 0144",
    }),
  });
  assert.equal(unavailableResponse.status, 503);
  assert.match((await unavailableResponse.json()).error, /MONGODB_URI/);
});
