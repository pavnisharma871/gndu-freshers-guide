import assert from "node:assert/strict";
import test from "node:test";

import {
  createAdmissionRecord,
  ensureAdmissionIndexes,
  getConfiguredCourseNames,
  validateAdmission,
} from "../admission-model.js";

const courseNames = new Set(["B.Com"]);
const validApplication = {
  studentName: "Fictional Applicant",
  course: "B.Com",
  academicSession: "2026-27",
  email: "fictional@example.com",
  contactNumber: "+1 202 555 0144",
};

test("valid fictional application details do not require a GNDU student record", () => {
  assert.deepEqual(validateAdmission(validApplication, courseNames), validApplication);
});

test("invalid admission details are rejected before database access", () => {
  assert.equal(
    validateAdmission({ ...validApplication, academicSession: "2026-28" }, courseNames),
    "Enter an academic session in YYYY-YY format, such as 2026-27.",
  );
  assert.equal(
    validateAdmission({ ...validApplication, course: "Unlisted course" }, courseNames),
    "Choose a course from the programme list.",
  );
});

test("course filter options are unique and derived from configured courses", () => {
  const categories = [
    { courses: [{ name: "Course Z" }, { name: "Course A" }, { name: "Course A" }] },
    { courses: [{ name: "Course M" }, { name: "" }, { name: null }] },
  ];

  assert.deepEqual(getConfiguredCourseNames(categories), ["Course A", "Course M", "Course Z"]);
});

test("application records receive distinct, non-demo references and submitted status", () => {
  const first = createAdmissionRecord(validApplication);
  const second = createAdmissionRecord(validApplication);

  assert.match(first.applicationId, /^GNDU-APP-[A-F\d]{32}$/);
  assert.notEqual(first.applicationId, second.applicationId);
  assert.equal(first.status, "Submitted");
  assert.ok(first.createdAt instanceof Date);
});

test("database indexes allow repeated course applications and uniquely index references", async () => {
  const droppedIndexes = [];
  const createdIndexes = [];
  const collection = {
    listIndexes: () => ({
      toArray: async () => [
        { name: "unique_student_course_session" },
        { name: "unique_demo_application_id" },
      ],
    }),
    dropIndex: async (name) => droppedIndexes.push(name),
    createIndex: async (...args) => createdIndexes.push(args),
  };

  await ensureAdmissionIndexes(collection);

  assert.deepEqual(droppedIndexes, [
    "unique_student_course_session",
    "unique_demo_application_id",
  ]);
  assert.deepEqual(createdIndexes, [[
    { applicationId: 1 },
    { unique: true, sparse: true, name: "unique_application_reference_id" },
  ], [
    { createdAt: -1, _id: -1 },
    { name: "admission_dashboard_created_at" },
  ], [
    { course: 1 },
    { name: "admission_dashboard_course" },
  ], [
    { academicSession: 1 },
    { name: "admission_dashboard_session" },
  ], [
    { status: 1 },
    { name: "admission_dashboard_status" },
  ]]);
});

test("first submission can create indexes when the collection does not yet exist", async () => {
  const createdIndexes = [];
  const collection = {
    listIndexes: () => ({
      toArray: async () => {
        const error = new Error("namespace does not exist");
        error.code = 26;
        throw error;
      },
    }),
    createIndex: async (...args) => createdIndexes.push(args),
  };

  await ensureAdmissionIndexes(collection);
  assert.equal(createdIndexes.length, 5);
});
