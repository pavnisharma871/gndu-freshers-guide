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
      throw new Error(`Admin test server exited with code ${child.exitCode}.`);
    }
    try {
      const response = await fetch(`${url}/api/health`);
      if (response.ok) return response.json();
    } catch {
      await delay(100);
    }
  }
  throw new Error("Admin test server did not start.");
}

test("admin APIs require separate credentials and signed session authentication", async (t) => {
  const port = await getAvailablePort();
  const url = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ["server.js"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      HOST: "127.0.0.1",
      PORT: String(port),
      MONGODB_URI: "mongodb://127.0.0.1:1",
      MONGODB_DB: "gndu_admin_auth_test",
      ADMIN_USERNAME: "test-admin",
      ADMIN_PASSWORD: "TestingOnlyStrongAdminPassword123!",
      ADMIN_SESSION_SECRET: "test-only-admin-session-secret-at-least-32",
      RECORDS_ACCESS_TOKEN: "separate-reference-token-that-is-not-admin-auth",
    },
    stdio: "ignore",
  });
  t.after(async () => {
    if (child.exitCode === null) {
      child.kill();
      await new Promise((resolve) => child.once("exit", resolve));
    }
  });

  const health = await waitForServer(child, url);
  assert.equal(health.admissions.adminAuthenticationConfigured, true);

  const dashboard = await fetch(`${url}/admin`);
  assert.equal(dashboard.status, 200);
  assert.match(await dashboard.text(), /Administrator sign in/);

  const homepage = await fetch(`${url}/`);
  assert.equal(homepage.status, 200);
  assert.match(await homepage.text(), /<a href="\/admin\.html">Admin Login<\/a>/);

  const linkedDashboard = await fetch(`${url}/admin.html`);
  assert.equal(linkedDashboard.status, 200);
  assert.match(await linkedDashboard.text(), /id="admin-login-panel"/);

  const unauthenticatedList = await fetch(`${url}/api/admin/applications`);
  assert.equal(unauthenticatedList.status, 401);
  assert.deepEqual(await unauthenticatedList.json(), { error: "Admin authentication is required." });

  const sharedVerificationToken = await fetch(`${url}/api/admin/applications`, {
    headers: { Authorization: "Bearer separate-reference-token-that-is-not-admin-auth" },
  });
  assert.equal(sharedVerificationToken.status, 401);

  const incorrectLogin = await fetch(`${url}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "test-admin", password: "incorrect-password" }),
  });
  assert.equal(incorrectLogin.status, 401);

  const login = await fetch(`${url}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "test-admin",
      password: "TestingOnlyStrongAdminPassword123!",
    }),
  });
  assert.equal(login.status, 200);
  const cookie = login.headers.get("set-cookie");
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Strict/i);
  const sessionCookie = cookie.split(";", 1)[0];

  const session = await fetch(`${url}/api/admin/session`, {
    headers: { Cookie: sessionCookie },
  });
  assert.equal(session.status, 200);
  assert.deepEqual(await session.json(), { authenticated: true });

  const authorizedList = await fetch(`${url}/api/admin/applications`, {
    headers: { Cookie: sessionCookie },
  });
  assert.equal(authorizedList.status, 503);
  assert.match((await authorizedList.json()).error, /MongoDB could not be reached/);

  const logout = await fetch(`${url}/api/admin/logout`, {
    method: "POST",
    headers: { Cookie: sessionCookie },
  });
  assert.equal(logout.status, 200);
  const loggedOut = await fetch(`${url}/api/admin/session`, {
    headers: { Cookie: logout.headers.get("set-cookie").split(";", 1)[0] },
  });
  assert.equal(loggedOut.status, 401);
});
