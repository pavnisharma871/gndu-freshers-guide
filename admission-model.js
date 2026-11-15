import { randomBytes } from "node:crypto";

export const admissionSchema = Object.freeze({
  studentName: Object.freeze({ type: "string", required: true, minLength: 2, maxLength: 100 }),
  course: Object.freeze({ type: "string", required: true }),
  academicSession: Object.freeze({ type: "string", required: true, pattern: /^(\d{4})-(\d{2})$/ }),
  email: Object.freeze({ type: "string", required: true, maxLength: 254 }),
  contactNumber: Object.freeze({ type: "string", required: true, minLength: 7, maxLength: 20 }),
});

export function getConfiguredCourseNames(categories) {
  return [...new Set(
    categories.flatMap((category) => category.courses
      .map((course) => course.name)
      .filter((name) => typeof name === "string" && name.trim().length > 0)),
  )].sort();
}

export function validateAdmission(body, courseNames) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Application details are required.";
  }

  const allowedFields = Object.keys(admissionSchema);
  if (Object.keys(body).some((field) => !allowedFields.includes(field))) {
    return "The application contains unexpected fields.";
  }

  const studentName = typeof body.studentName === "string" ? body.studentName.trim() : "";
  const course = typeof body.course === "string" ? body.course.trim() : "";
  const academicSession = typeof body.academicSession === "string" ? body.academicSession.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const contactNumber = typeof body.contactNumber === "string" ? body.contactNumber.trim() : "";

  if (!/^[\p{L}\p{M} .'-]{2,100}$/u.test(studentName)) {
    return "Enter a valid student name (2–100 letters).";
  }
  if (!courseNames.has(course)) {
    return "Choose a course from the programme list.";
  }
  const session = academicSession.match(admissionSchema.academicSession.pattern);
  if (!session || Number(session[2]) !== (Number(session[1]) + 1) % 100) {
    return "Enter an academic session in YYYY-YY format, such as 2026-27.";
  }
  if (
    email.length > admissionSchema.email.maxLength
    || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
  ) {
    return "Enter a valid email address.";
  }
  const phoneDigits = contactNumber.replace(/\D/g, "");
  if (
    !/^\+?[0-9][0-9\s().-]{5,19}$/.test(contactNumber)
    || phoneDigits.length < admissionSchema.contactNumber.minLength
    || phoneDigits.length > 15
  ) {
    return "Enter a valid contact number with 7–15 digits.";
  }

  return {
    studentName,
    course,
    academicSession,
    email: email.toLowerCase(),
    contactNumber,
  };
}

export function createAdmissionRecord(application) {
  const applicationId = `GNDU-APP-${randomBytes(16).toString("hex").toUpperCase()}`;
  return {
    ...application,
    applicationId,
    status: "Submitted",
    createdAt: new Date(),
  };
}

export async function ensureAdmissionIndexes(collection) {
  const indexes = await collection.listIndexes().toArray().catch((error) => {
    if (error?.code === 26) return [];
    throw error;
  });
  const legacyIndexNames = ["unique_student_course_session", "unique_demo_application_id"];
  for (const indexName of legacyIndexNames) {
    if (indexes.some((index) => index.name === indexName)) {
      await collection.dropIndex(indexName);
    }
  }
  await collection.createIndex(
    { applicationId: 1 },
    { unique: true, sparse: true, name: "unique_application_reference_id" },
  );
  await collection.createIndex(
    { createdAt: -1, _id: -1 },
    { name: "admission_dashboard_created_at" },
  );
  await collection.createIndex({ course: 1 }, { name: "admission_dashboard_course" });
  await collection.createIndex(
    { academicSession: 1 },
    { name: "admission_dashboard_session" },
  );
  await collection.createIndex({ status: 1 }, { name: "admission_dashboard_status" });
}
