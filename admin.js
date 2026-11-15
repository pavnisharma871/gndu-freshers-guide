"use strict";

const loginPanel = document.querySelector("#admin-login-panel");
const loginForm = document.querySelector("#admin-login-form");
const loginFeedback = document.querySelector("#admin-login-feedback");
const dashboard = document.querySelector("#admin-dashboard");
const listFeedback = document.querySelector("#admin-list-feedback");
const applicationsBody = document.querySelector("#admin-applications-body");
const filterForm = document.querySelector("#admin-filter-form");
const logoutButton = document.querySelector("#admin-logout");
const pageSize = 20;
let currentPage = 1;
let currentTotalPages = 1;

function setFeedback(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle("is-error", isError);
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    cache: "no-store",
    credentials: "same-origin",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error || `The request failed (server error ${response.status}).`);
  }
  return payload;
}

function showLogin(message = "") {
  loginPanel.hidden = false;
  dashboard.hidden = true;
  logoutButton.hidden = true;
  if (message) setFeedback(loginFeedback, message, true);
}

function showDashboard() {
  loginPanel.hidden = true;
  dashboard.hidden = false;
  logoutButton.hidden = false;
}

function setFilterOptions(select, values, placeholder) {
  const selectedValue = select.value;
  const options = [new Option(placeholder, "")];
  values.forEach((value) => options.push(new Option(value, value)));
  select.replaceChildren(...options);
  if (values.includes(selectedValue)) select.value = selectedValue;
}

function createCell(value) {
  const cell = document.createElement("td");
  cell.textContent = value;
  return cell;
}

function formatSubmissionDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function renderApplications(payload) {
  applicationsBody.replaceChildren();
  payload.applications.forEach((application) => {
    const row = document.createElement("tr");
    row.append(
      createCell(application.studentName),
      createCell(application.applicationReferenceId),
      createCell(application.course),
      createCell(application.academicSession),
      createCell(application.status),
      createCell(formatSubmissionDate(application.submittedAt)),
    );
    applicationsBody.append(row);
  });

  document.querySelector("#admin-total-count").textContent = String(payload.totalApplications);
  document.querySelector("#admin-submitted-count").textContent = String(payload.submittedApplications);
  currentPage = payload.page;
  currentTotalPages = payload.totalPages;
  document.querySelector("#admin-page-summary").textContent =
    `Showing ${payload.applications.length} of ${payload.totalFiltered} matching applications · Page ${currentPage} of ${currentTotalPages}`;
  document.querySelector("#admin-previous-page").disabled = currentPage <= 1;
  document.querySelector("#admin-next-page").disabled = currentPage >= currentTotalPages;

  setFilterOptions(
    filterForm.elements.course,
    payload.filters.courses,
    "All Courses",
  );
  setFilterOptions(
    filterForm.elements.academicSession,
    payload.filters.academicSessions,
    "All Sessions",
  );
  setFilterOptions(
    filterForm.elements.status,
    payload.filters.statuses,
    "All Statuses",
  );
}

async function loadApplications(page = 1) {
  setFeedback(listFeedback, "Loading saved applications…");
  const params = new URLSearchParams();
  const formData = new FormData(filterForm);
  for (const field of ["search", "course", "academicSession", "status"]) {
    const value = String(formData.get(field) || "").trim();
    if (value) params.set(field, value);
  }
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));

  try {
    const payload = await requestJson(`/api/admin/applications?${params}`);
    if (
      !Array.isArray(payload.applications)
      || !payload.filters
      || !Array.isArray(payload.filters.courses)
      || !Array.isArray(payload.filters.academicSessions)
      || !Array.isArray(payload.filters.statuses)
    ) {
      throw new Error("The dashboard received an invalid applications response.");
    }
    renderApplications(payload);
    setFeedback(listFeedback, "");
  } catch (error) {
    if (error instanceof Error && /authentication is required/i.test(error.message)) {
      showLogin("Your admin session expired. Sign in again.");
      return;
    }
    applicationsBody.replaceChildren();
    setFeedback(
      listFeedback,
      error instanceof Error ? error.message : "The applications could not be loaded.",
      true,
    );
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!loginForm.reportValidity()) return;

  const button = loginForm.querySelector('button[type="submit"]');
  const formData = new FormData(loginForm);
  button.disabled = true;
  setFeedback(loginFeedback, "Signing in…");
  try {
    await requestJson("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({
        username: formData.get("username"),
        password: formData.get("password"),
      }),
    });
    loginForm.reset();
    showDashboard();
    await loadApplications();
  } catch (error) {
    setFeedback(
      loginFeedback,
      error instanceof Error ? error.message : "Sign in failed.",
      true,
    );
  } finally {
    button.disabled = false;
    loginForm.elements.password.value = "";
  }
});

filterForm.addEventListener("submit", (event) => {
  event.preventDefault();
  void loadApplications(1);
});

filterForm.addEventListener("change", (event) => {
  if (event.target instanceof HTMLSelectElement) void loadApplications(1);
});

document.querySelector("#admin-refresh").addEventListener("click", () => {
  void loadApplications(currentPage);
});

document.querySelector("#admin-previous-page").addEventListener("click", () => {
  if (currentPage > 1) void loadApplications(currentPage - 1);
});

document.querySelector("#admin-next-page").addEventListener("click", () => {
  if (currentPage < currentTotalPages) void loadApplications(currentPage + 1);
});

logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;
  try {
    await requestJson("/api/admin/logout", { method: "POST" });
    showLogin("You have signed out.");
  } catch (error) {
    setFeedback(
      listFeedback,
      error instanceof Error ? error.message : "Sign out failed.",
      true,
    );
  } finally {
    logoutButton.disabled = false;
  }
});

async function initializeAdminPage() {
  try {
    await requestJson("/api/admin/session");
    showDashboard();
    await loadApplications();
  } catch (error) {
    if (error instanceof Error && /authentication is required/i.test(error.message)) {
      showLogin();
      return;
    }
    showLogin(error instanceof Error ? error.message : "Admin sign in is unavailable.");
  }
}

void initializeAdminPage();
