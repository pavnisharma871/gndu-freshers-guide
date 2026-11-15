"use strict";

const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#primary-navigation");

if (menuToggle && navigation) {
  const closeMenu = () => {
    menuToggle.setAttribute("aria-expanded", "false");
    navigation.classList.remove("is-open");
  };

  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isExpanded));
    navigation.classList.toggle("is-open", !isExpanded);
  });

  navigation.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
      menuToggle.focus();
    }
  });
}

const mainContent = document.querySelector("#main-content");
const routeContent = document.createElement("div");
routeContent.id = "route-content";
routeContent.className = "route-page section-shell";
routeContent.hidden = true;
mainContent.prepend(routeContent);
let cloneSequence = 0;

const internalHashRoutes = {
  "#home": ["home"],
  "#events": ["events"],
  "#admissions": ["admissions"],
  "#campus-life": ["campus-life"],
  "#departments": ["faculties"],
  "#courses": ["courses"],
  "#campus-map": ["campus-map"],
  "#canteens": ["canteens"],
  "#library": ["library"],
  "#photo-gallery": ["photo-gallery"],
  "#sports": ["sports"],
  "#student-life": ["student-life"],
  "#about": ["about"],
  "#contact": ["contact"],
  "#scholarships": ["scholarships"],
  "#hostels": ["facility", "hostels"],
  "#health-services": ["facility", "health-services"],
  "#exams-results": ["exams-results"],
  "#faqs": ["faqs"],
  "#student-support": ["facility", "student-support"],
};

const canonicalRoutes = [
  { path: "/", page: "home" },
  { path: "/admissions", page: "admissions" },
  { path: "/courses", page: "courses" },
  { path: "/departments", page: "faculties" },
  { path: "/scholarships", page: "scholarships" },
  { path: "/campus-life", page: "campus-life" },
  { path: "/hostels", page: "facility", item: "hostels" },
  { path: "/library", page: "library" },
  { path: "/canteens", page: "canteens" },
  { path: "/sports", page: "sports" },
  { path: "/health-services", page: "facility", item: "health-services" },
  { path: "/campus-map", page: "campus-map" },
  { path: "/events", page: "events" },
  { path: "/placements", page: "placements" },
  { path: "/student-life", page: "student-life" },
  { path: "/photo-gallery", page: "photo-gallery" },
  { path: "/about", page: "about" },
  { path: "/contact", page: "contact" },
  { path: "/exams-results", page: "exams-results" },
  { path: "/faqs", page: "faqs" },
  { path: "/student-support", page: "facility", item: "student-support" },
];
const canonicalRoutesByPath = new Map(canonicalRoutes.map((route) => [route.path, route]));

const getText = (element) => element?.textContent.trim().replace(/\s+/g, " ") || "";
const getSource = (selector) => document.querySelector(selector);
const getRouteUrl = (page, item) => {
  const canonicalRoute = canonicalRoutes.find(
    (route) => route.page === page && (route.item || "") === (item || ""),
  );
  if (canonicalRoute) {
    return canonicalRoute.path;
  }
  const url = new URL("/", window.location.origin);
  url.searchParams.set("page", page);
  if (item) {
    url.searchParams.set("item", item);
  }
  return `${url.pathname}${url.search}`;
};
const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/&amp;|&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function createElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) {
    element.className = className;
  }
  if (text) {
    element.textContent = text;
  }
  return element;
}

function createInternalLink(page, item, text, className) {
  const link = createElement("a", className, text);
  link.href = getRouteUrl(page, item);
  link.dataset.guideRoute = "";
  return link;
}

function createCard(title, description, page, item, label) {
  const card = createElement("article", "route-card");
  const link = createInternalLink(page, item, "", "route-card-link");
  if (label) {
    link.append(createElement("span", "route-card-label", label));
  }
  link.append(createElement("h2", "", title));
  if (description) {
    link.append(createElement("p", "", description));
  }
  link.append(createElement("span", "route-card-arrow", "View details →"));
  card.append(link);
  return card;
}

function addExternalLink(container, label, url) {
  if (!url) {
    return;
  }
  const link = createElement("a", "", label);
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  container.append(link);
}

function appendSourceLinks(container, source) {
  const sourceLinks = source?.querySelectorAll(".directory-links a, .admissions-links a") || [];
  if (!sourceLinks.length) {
    return;
  }
  const wrapper = createElement("div", "directory-links route-source-links");
  sourceLinks.forEach((sourceLink) => {
    addExternalLink(wrapper, getText(sourceLink), sourceLink.href);
  });
  container.append(wrapper);
}

function appendClonedContent(container, source, omitSummary = true) {
  if (!source) {
    return;
  }
  cloneSequence += 1;
  const idMap = new Map();
  const clones = Array.from(source.children)
    .filter((child) => !omitSummary || child.tagName !== "SUMMARY")
    .map((child) => child.cloneNode(true));
  clones.forEach((clone) => {
    [clone, ...clone.querySelectorAll("[id]")].forEach((element) => {
      if (element.id) {
        const originalId = element.id;
        element.id = `${originalId}-route-${cloneSequence}`;
        idMap.set(originalId, element.id);
      }
    });
  });
  clones.forEach((clone) => {
    [clone, ...clone.querySelectorAll("*")].forEach((element) => {
      ["aria-labelledby", "aria-describedby", "aria-controls", "aria-owns", "for", "headers"].forEach((attribute) => {
        const value = element.getAttribute(attribute);
        if (value) {
          element.setAttribute(
            attribute,
            value
              .split(/\s+/)
              .map((id) => idMap.get(id) || id)
              .join(" "),
          );
        }
      });
    });
    container.append(clone);
  });
}

function getHeadingByLabelledBy(element) {
  return getText(document.getElementById(element?.getAttribute("aria-labelledby") || ""));
}

function collectCourses() {
  const categories = Array.from(document.querySelectorAll("#courses .course-category"));
  const usedSlugs = new Set();
  return categories.map((category) => {
    const heading = category.querySelector("summary h4");
    const courses = Array.from(category.querySelectorAll(".course-list li")).map((row) => {
      const name = getText(row.querySelector("strong")) || getText(row.querySelector("a"));
      const baseSlug = slugify(name);
      let slug = baseSlug;
      let suffix = 2;
      while (usedSlugs.has(slug)) {
        slug = `${baseSlug}-${suffix}`;
        suffix += 1;
      }
      usedSlugs.add(slug);
      const courseLink = row.querySelector("a");
      const officialUrl = courseLink?.href || "";
      if (courseLink) {
        courseLink.href = getRouteUrl("course", slug);
        courseLink.removeAttribute("target");
        courseLink.removeAttribute("rel");
        courseLink.dataset.guideRoute = "";
      }
      return {
        slug,
        name,
        category: getText(heading),
        facts: getText(row.querySelector(".course-facts")),
        eligibility: getText(row.querySelector(".course-eligibility")),
        provider: getText(row.querySelector(".course-provider")),
        introduction: getText(row.querySelector(".course-introduction")),
        department: getText(row.querySelector(".course-department")),
        officialUrl,
      };
    });
    return {
      slug: slugify(getText(heading)),
      title: getText(heading),
      source: category,
      note: getText(category.querySelector(".course-category-note")),
      courses,
    };
  });
}

function collectFaculties() {
  const usedSlugs = new Set();
  return Array.from(document.querySelectorAll("#departments .faculty-disclosure")).map((faculty) => {
    const title = getText(faculty.querySelector("summary h4"));
    const id = faculty.querySelector("summary h4")?.id || slugify(title);
    const departments = Array.from(faculty.querySelectorAll(".department-list li")).map((row) => {
      const link = row.querySelector("a");
      const name = getText(link);
      const baseSlug = slugify(name);
      let slug = baseSlug;
      let suffix = 2;
      while (usedSlugs.has(slug)) {
        slug = `${baseSlug}-${suffix}`;
        suffix += 1;
      }
      usedSlugs.add(slug);
      return {
        slug,
        name,
        description: getText(row.querySelector("span")),
        officialUrl: link?.href || "",
      };
    });
    return {
      id,
      title,
      description: getText(faculty.querySelector("summary p")),
      source: faculty,
      departments,
    };
  });
}

const courseCategories = collectCourses();
const courseRecords = courseCategories.flatMap((category) => category.courses);
let courseCatalogRequest;

async function loadAdmissionCourses(select) {
  const feedback = select.form?.querySelector("[data-application-feedback]");
  if (!courseCatalogRequest) {
    courseCatalogRequest = fetch("/api/courses")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "The programme list could not be loaded.");
        }
        if (!Array.isArray(payload.categories)) {
          throw new Error("The programme list response was invalid.");
        }
        return payload.categories;
      })
      .catch((error) => {
        courseCatalogRequest = undefined;
        throw error;
      });
  }

  try {
    const categories = await courseCatalogRequest;
    const options = [new Option("Select a listed programme", "")];
    categories.forEach((category) => {
      if (!category || typeof category.title !== "string" || !Array.isArray(category.courses)) {
        throw new Error("The programme list response was invalid.");
      }
      const group = document.createElement("optgroup");
      group.label = category.title;
      category.courses.forEach((course) => {
        if (!course || typeof course.name !== "string") {
          throw new Error("The programme list response was invalid.");
        }
        group.append(new Option(course.name, course.name));
      });
      if (group.childElementCount) options.push(group);
    });
    select.replaceChildren(...options);
    select.disabled = false;
  } catch (error) {
    select.replaceChildren(new Option("Programme list unavailable", ""));
    select.disabled = true;
    if (feedback) {
      feedback.textContent = error instanceof Error
        ? `The programme list could not be loaded: ${error.message}`
        : "The programme list could not be loaded.";
      feedback.classList.add("is-error");
    }
  }
}

const sourceCourseSelect = document.querySelector('#admissions [name="course"]');
if (sourceCourseSelect) void loadAdmissionCourses(sourceCourseSelect);

function setAdmissionFeedback(element, message, isError = false) {
  if (!element) return;
  element.textContent = message;
  element.classList.toggle("is-error", isError);
}

async function submitStudentApplication(form) {
  if (form.dataset.submitting === "true") return;
  if (!form.reportValidity()) return;

  const button = form.querySelector('button[type="submit"]');
  const feedback = form.querySelector("[data-application-feedback]");
  const application = Object.fromEntries(new FormData(form));
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  form.dataset.submitting = "true";
  if (button) button.disabled = true;
  setAdmissionFeedback(feedback, "Submitting your application…");

  try {
    const response = await fetch("/api/admissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(application),
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.error || `The application could not be saved (server error ${response.status}).`);
    }
    if (typeof payload?.applicationReferenceId !== "string") {
      throw new Error("The server did not return a valid application reference. No confirmation was created.");
    }
    setAdmissionFeedback(
      feedback,
      `Application saved to the project database. Reference ID: ${payload.applicationReferenceId}. This is not an official GNDU application or admission confirmation.`,
    );
    form.reset();
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError"
      ? "The request timed out. The application may have been saved, but no reference ID was confirmed; contact the project maintainer before retrying."
      : error instanceof TypeError
        ? "Could not reach the application service. Check that the GNDU Freshers Guide server is running, then try again."
        : error instanceof Error
          ? error.message
          : "The application could not be saved. Please try again.";
    setAdmissionFeedback(
      feedback,
      message,
      true,
    );
  } finally {
    clearTimeout(timeoutId);
    delete form.dataset.submitting;
    if (button) button.disabled = false;
  }
}

function renderApplicationVerification(results, application) {
  results.replaceChildren();
  if (!application) {
    const message = createElement("p", "record-search-message", "No saved application was found for that reference ID.");
    results.append(message);
    return;
  }

  const card = createElement("article", "student-record-card");
  card.append(createElement("h4", "", "Application found in the database"));
  const details = document.createElement("dl");
  [
    ["Application reference ID", application.applicationReferenceId],
    ["Application status", application.status],
    ["Saved on", new Date(application.createdAt).toLocaleString()],
  ].forEach(([label, value]) => {
    details.append(createElement("dt", "", label));
    details.append(createElement("dd", "", value));
  });
  card.append(details);
  results.append(card);
}

async function verifyStudentApplication(form) {
  if (!form.reportValidity()) return;
  const button = form.querySelector('button[type="submit"]');
  const results = form.parentElement.querySelector("[data-record-search-results]");
  const formData = new FormData(form);
  if (button) button.disabled = true;
  results.replaceChildren(createElement("p", "record-search-message", "Verifying saved application…"));

  try {
    const response = await fetch("/api/admissions/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${formData.get("accessToken")}`,
      },
      body: JSON.stringify({ applicationReferenceId: formData.get("applicationReferenceId") }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Application verification failed.");
    }
    if (payload.application !== null && (
      typeof payload.application !== "object"
      || typeof payload.application.applicationReferenceId !== "string"
      || typeof payload.application.status !== "string"
      || typeof payload.application.createdAt !== "string"
    )) {
      throw new Error("The application verification response was invalid.");
    }
    renderApplicationVerification(results, payload.application);
  } catch (error) {
    results.replaceChildren(createElement(
      "p",
      "record-search-message is-error",
      error instanceof Error ? error.message : "Application verification failed.",
    ));
  } finally {
    if (button) button.disabled = false;
  }
}

document.addEventListener("submit", (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  if (form.matches("[data-student-application]")) {
    event.preventDefault();
    void submitStudentApplication(form);
  } else if (form.matches("[data-student-record-search]")) {
    event.preventDefault();
    void verifyStudentApplication(form);
  }
});

const facultyRecords = collectFaculties();
const academicCentreRecords = Array.from(document.querySelectorAll("#departments .academic-centre")).map((source) => ({
  title: getText(source.querySelector("summary h4")),
  description: getText(source.querySelector("summary p")),
  overview: getText(source.querySelector(".resource-copy")),
  officialUrl: source.querySelector(".directory-links a")?.href || "",
}));
const admissionTopics = Array.from(document.querySelectorAll("#admissions .admissions-topic")).map((topic) => ({
  id: topic.getAttribute("aria-labelledby") || slugify(getHeadingByLabelledBy(topic)),
  title: getHeadingByLabelledBy(topic),
  source: topic,
}));
const canteenRecords = Array.from(document.querySelectorAll("#canteens .resource-card")).map((source, index) => ({
  id: index === 0 ? "boys-hostel" : "other-campus-dining",
  title: getText(source.querySelector("summary h4")),
  source,
}));
const officialGalleryPhotos = [
  { file: "photo-gallery-2s.jpg", title: "Main Entrance", alt: "GNDU gallery caption: Main Enterance", groups: ["Campus buildings"] },
  { file: "photo-gallery-3.jpg", title: "Inauguration Day of University", alt: "GNDU gallery photograph captioned Inauguration Day of University", groups: ["University events"] },
  { file: "photo-gallery-4s.jpg", title: "Arts Block", alt: "GNDU gallery caption: Arts Block", groups: ["Campus buildings"] },
  { file: "photo-gallery-5s.jpg", title: "Gurudwara Sahib", alt: "GNDU gallery caption: Gurudwara Sahib", groups: ["Campus buildings"] },
  { file: "photo-gallery-6s.jpg", title: "Guru Nanak Bhavan", alt: "GNDU gallery caption: Guru Nanak Bhavan", groups: ["Campus buildings"] },
  { file: "photo-gallery-7s.jpg", title: "Khalsa Heritage Centre", alt: "GNDU gallery caption: Khalsa Heritage Centre", groups: ["Campus buildings"] },
  { file: "photo-gallery-8s.jpg", title: "Boys Hostel", alt: "GNDU gallery caption: Boys Hostel", groups: ["Hostels"] },
  { file: "photo-gallery-9s.jpg", title: "Student's Rest House, Dalhousie", alt: "GNDU gallery caption: Student's Rest House, Dalhousie", groups: ["Other university facilities"] },
  { file: "photo-gallery-10s.jpg", title: "Lab of Computer Science Department", alt: "GNDU gallery caption: Lab of Computer Science Department", groups: ["Academic facilities"] },
  { file: "photo-gallery-11s.jpg", title: "Girls Hostel", alt: "GNDU gallery caption: Girls Hostel; specific hostel block is not identified", groups: ["Hostels"] },
  { file: "photo-gallery-12s.jpg", title: "Teacher's Rest House, Dalhousie", alt: "GNDU gallery caption: Teacher's Rest House, Dalhousie", groups: ["Other university facilities"] },
  { file: "photo-gallery-13s.jpg", title: "Hockey Stadium", alt: "GNDU gallery caption: Hockey Stadium", groups: ["Sports facilities"] },
  { file: "photo-gallery-14s.jpg", title: "Administration Block", alt: "GNDU gallery caption: Administration Block", groups: ["Campus buildings"] },
  { file: "photo-gallery-15s.jpg", title: "Bhai Gurdas Library", alt: "GNDU gallery caption: Bhai Gurdas Library", groups: ["Library"] },
  { file: "photo-gallery-16s.jpg", title: "Chemistry Block", alt: "GNDU gallery caption: Chemistry Block", groups: ["Academic facilities"] },
  { file: "photo-gallery-17s.jpg", title: "Lecture Theatre Complex", alt: "GNDU gallery caption: Lecture Theatre Complex", groups: ["Campus buildings"] },
  { file: "photo-gallery-18s.jpg", title: "Asia House Complex", alt: "GNDU gallery caption: Asia House Complex", groups: ["Campus buildings"] },
  { file: "photo-gallery-19s.jpg", title: "Maharaja Ranjit Singh Bhawan", alt: "GNDU gallery caption: Maharaja Ranjit Singh Bhawan", groups: ["Campus buildings"] },
  { file: "photo-gallery-20s.jpg", title: "Sports Hostel", alt: "GNDU gallery caption: Sports Hostel", groups: ["Hostels", "Sports facilities"] },
  { file: "swachhcertificate.jpg", title: "Swachh Campus Ranking Certificate", alt: "GNDU gallery caption: Swachh Campus Ranking Certificate", groups: ["University records"] },
  { file: "iiccertificate.jpg", title: "IIC Certificate", alt: "GNDU gallery caption: IIC Certificate", groups: ["University records"] },
  { file: "hEXI5.jpg", title: "Hexi Bicycle Stand", alt: "GNDU gallery caption: Hexi Bicycle Stand", groups: ["Campus facilities and student life"] },
  { file: "studentsatHEXI.jpg", title: "Student riding on Bicycle", alt: "GNDU gallery caption: Student riding on Bicycle", groups: ["Campus facilities and student life"] },
  { file: "studentsandstaffathexi.jpg", title: "Students and Staff on Bicycle", alt: "GNDU gallery caption: Students and Staff on Bicycle", groups: ["Campus facilities and student life"] },
  { file: "hexistand4.jpg", title: "Hexi Bicycle Stand", alt: "GNDU gallery caption: Hexi Bicycle Stand", groups: ["Campus facilities and student life"] },
];

const galleryImageUrl = (photo) =>
  `https://digital.gndu.ac.in/images/photogallery/${photo.file}`;

const verifiedActivityTypes = [
  {
    title: "Youth festivals",
    category: "Festivals",
    description: "GNDU's Department of Youth Welfare describes zonal and inter-zonal youth festivals. This is a programme type, not a dated event listing.",
  },
  {
    title: "Camps and tours",
    category: "Camps and tours",
    description: "The Department of Youth Welfare describes leadership, hiking and trekking, tours, and coaching camps. Current dates and participation details must be checked with GNDU.",
  },
  {
    title: "Seminars and workshops",
    category: "Learning activities",
    description: "GNDU's Youth Welfare information includes seminars and workshops. No current session, venue, or registration details are verified here.",
  },
  {
    title: "Cultural programmes",
    category: "Cultural activities",
    description: "The department describes cultural programmes; check official university notices for any current programme or schedule.",
  },
  {
    title: "Student Activity Clubs",
    category: "Student clubs",
    description: "GNDU's official clubs page lists student groups including Dance, Drama, Fine Arts, Fitness, Literary, Photography, Science, and Cycling.",
  },
  {
    title: "University inauguration photograph",
    category: "University event",
    description: "GNDU's official photo gallery captions one image 'Inauguration Day of University'. The image is presented as historical gallery material, not a current event announcement.",
  },
];

const officialActivityPhotoGroups = [
  {
    title: "Dance Club activity gallery",
    category: "Student clubs",
    note: "GNDU labels these images as Dance Club activities. The source does not identify a specific event name or date for each photograph.",
    sourceLabel: "GNDU Dance Club",
    sourceUrl: "https://digital.gndu.ac.in/DanceClub.aspx",
    photos: [
      ["danceclub/23380234_129838551015183_1507670308311519918_n.jpg", "Dance Club Activity 1"],
      ["danceclub/67b3f69bcf12df06f9edaf637f32468d.jpg", "Dance Club Activity 2"],
      ["danceclub/IMG-20180907-WA0055.jpg", "Dance Club Activity 3"],
      ["danceclub/IMG-20180907-WA0113.jpg", "Dance Club Activity 4"],
    ],
  },
  {
    title: "SciRox Science Club activity gallery",
    category: "Learning activities",
    note: "GNDU identifies these as Science Club activity-gallery images. The page describes science outreach, workshops, exhibitions, Astronomy Nights, and other activities, but does not caption each photograph with a specific activity or date.",
    sourceLabel: "GNDU SciRox Science Club",
    sourceUrl: "https://digital.gndu.ac.in/ScienceClub.aspx",
    photos: [
      ["scienceclub/scienceclubactivity1.jpg", "Science Club Activity 1"],
      ["scienceclub/scienceclubactivity2.jpg", "Science Club Activity 2"],
      ["scienceclub/scienceclubactivity3.jpg", "Science Club Activity 3"],
      ["scienceclub/scienceclubactivity4.jpg", "Science Club Activity 4"],
    ],
  },
];

const themeToggle = document.querySelector("#theme-toggle");
const applyTheme = (theme) => {
  const isDark = theme === "dark";
  document.documentElement.dataset.theme = isDark ? "dark" : "light";
  if (themeToggle) {
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} theme`);
    themeToggle.querySelector(".theme-toggle-label").textContent = isDark ? "Light mode" : "Dark mode";
    themeToggle.querySelector(".theme-toggle-icon").textContent = isDark ? "☀" : "☾";
  }
};

let savedTheme = null;
try {
  savedTheme = window.localStorage.getItem("gndu-guide-theme");
} catch (error) {
  console.warn("The saved theme preference could not be read.", error);
}
applyTheme(savedTheme === "dark" ? "dark" : "light");

themeToggle?.addEventListener("click", () => {
  const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(theme);
  try {
    window.localStorage.setItem("gndu-guide-theme", theme);
  } catch (error) {
    console.warn("The theme preference could not be saved.", error);
  }
});

function buildPageHeader(title, parent, parentUrl, parentTitle = "Home") {
  const breadcrumb = createElement("nav", "route-breadcrumbs");
  breadcrumb.setAttribute("aria-label", "Breadcrumb");
  breadcrumb.append(createInternalLink("home", "", "Home"));
  if (parent && parentUrl) {
    breadcrumb.append(createElement("span", "", "›"));
    breadcrumb.append(createInternalLink(parent, parentUrl.item, parentTitle));
  }
  breadcrumb.append(createElement("span", "", "›"));
  const current = createElement("span", "route-current", title);
  current.setAttribute("aria-current", "page");
  breadcrumb.append(current);
  routeContent.append(breadcrumb);
  const heading = createElement("h1", "route-title", title);
  heading.tabIndex = -1;
  routeContent.append(heading);
}

function buildPageDescription(text) {
  if (text) {
    routeContent.append(createElement("p", "route-intro", text));
  }
}

function buildGrid(className = "route-card-grid") {
  const grid = createElement("div", className);
  routeContent.append(grid);
  return grid;
}

function buildSectionHeading(title) {
  routeContent.append(createElement("h2", "route-section-title", title));
}

function buildFact(label, value) {
  const item = createElement("div", "route-fact");
  item.append(createElement("h2", "", label));
  item.append(createElement("p", "", value || "Please check the official GNDU website for details."));
  return item;
}

function buildDetailFacts(facts) {
  const grid = createElement("div", "route-fact-grid");
  facts.forEach(([label, value]) => grid.append(buildFact(label, value)));
  routeContent.append(grid);
}

function buildMediaFigure(imageUrl, alt, caption) {
  const figure = createElement("figure", "route-media-figure");
  const link = createElement("a", "");
  link.href = imageUrl;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  const image = document.createElement("img");
  image.src = imageUrl;
  image.alt = alt;
  image.loading = "lazy";
  link.append(image);
  figure.append(link, createElement("figcaption", "", caption));
  return figure;
}

function getOfficialPhotoTriples(titles) {
  return titles.map((title) => {
    const photo = officialGalleryPhotos.find((entry) => entry.title === title);
    if (!photo) {
      throw new Error(`Missing verified GNDU gallery photograph: ${title}`);
    }
    return [galleryImageUrl(photo), photo.alt, `${photo.title} — GNDU official photo gallery`];
  });
}

function createMediaGallery(images, className = "photo-grid route-photo-grid route-detail-gallery") {
  const gallery = createElement("div", className);
  images.forEach(([imageUrl, alt, caption]) => {
    gallery.append(buildMediaFigure(imageUrl, alt, caption));
  });
  return gallery;
}

function appendPhotoAttribution(container, sourceLabel, sourceUrl) {
  const attribution = createElement("p", "photo-attribution", "Photographs and captions: ");
  addExternalLink(attribution, sourceLabel, sourceUrl);
  container.append(attribution);
}

function buildMediaGallery(
  images,
  sourceLabel = "GNDU official photo gallery",
  sourceUrl = "https://digital.gndu.ac.in/photo-gallery.aspx",
) {
  const gallery = createMediaGallery(images);
  routeContent.append(gallery);
  appendPhotoAttribution(routeContent, sourceLabel, sourceUrl);
}

function buildDetailSection(title, ...paragraphs) {
  const section = createElement("section", "route-detail-section");
  section.append(createElement("h2", "", title));
  paragraphs.forEach((text) => section.append(createElement("p", "", text)));
  routeContent.append(section);
}

function buildHostelProfile({ id, name, intro, facts = [], sections = [], warden }) {
  const profile = createElement("section", id.startsWith("regional-") ? "hostel-profile hostel-profile-regional" : "hostel-profile");
  profile.id = `hostel-${id}`;
  profile.append(createElement("h3", "", name));
  profile.append(createElement("p", "hostel-profile-intro", intro));

  if (facts.length) {
    const factList = createElement("dl", "hostel-facts");
    facts.forEach(([label, value]) => {
      const item = createElement("div", "hostel-fact");
      item.append(createElement("dt", "", label), createElement("dd", "", value));
      factList.append(item);
    });
    profile.append(factList);
  }

  sections.forEach(([title, ...paragraphs]) => {
    const section = createElement("section", "hostel-profile-section");
    section.append(createElement("h4", "", title));
    paragraphs.forEach((paragraph) => section.append(createElement("p", "", paragraph)));
    profile.append(section);
  });

  if (warden) {
    const section = createElement("section", "hostel-profile-section");
    section.append(
      createElement("h4", "", "Warden listed on GNDU’s page"),
      createElement("p", "", `${warden} GNDU’s published warden listings may change; confirm the current assignment with the hostel office.`),
    );
    profile.append(section);
  }

  routeContent.append(profile);
}

function findDepartment(slug) {
  for (const faculty of facultyRecords) {
    const department = faculty.departments.find((entry) => entry.slug === slug);
    if (department) {
      return { ...department, faculty };
    }
  }
  return null;
}

function renderHome() {
  document.body.classList.add("guide-home-active");
  document.body.classList.remove("guide-route-active");
  routeContent.hidden = true;
  document.title = "GNDU Freshers Guide";

  let showcase = document.querySelector("#home-photo-showcase");
  if (!showcase) {
    showcase = createElement("section", "home-photo-showcase section-shell");
    showcase.id = "home-photo-showcase";
    showcase.setAttribute("aria-labelledby", "home-photo-showcase-title");
    const heading = createElement("div", "section-heading");
    heading.append(
      createElement("p", "eyebrow", "A view of the campus"),
      createElement("h2", "", "GNDU through its official photo gallery"),
      createElement("p", "", "These university-captioned photographs show named campus locations; captions identify the gallery subject and do not imply an unlabelled service location."),
    );
    heading.querySelector("h2").id = "home-photo-showcase-title";
    showcase.append(
      heading,
      createMediaGallery(getOfficialPhotoTriples(["Main Entrance", "Arts Block", "Bhai Gurdas Library"])),
    );
    appendPhotoAttribution(
      showcase,
      "GNDU official photo gallery",
      "https://digital.gndu.ac.in/photo-gallery.aspx",
    );
    const features = mainContent.querySelector(".features");
    mainContent.insertBefore(showcase, features);
  }
  showcase.hidden = false;
}

function renderAdmissions() {
  const source = getSource("#admissions");
  buildPageHeader("Admissions", "", null);
  buildPageDescription(getText(source?.querySelector(".summary-description")));
  buildDetailSection(
    "Choose the right application route",
    "GNDU admissions are organised through distinct routes for regular Main Campus programmes, constituent colleges, and Open and Distance Learning. The correct portal, course offering, and admission process depend on the institution and programme, so confirm those details before starting an application.",
  );
  buildDetailSection(
    "Check the current session",
    "Use the prospectus, programme listing, fee schedule, and admission notices that match your intended session. Eligibility, documents, counselling dates, and fees can vary by course and applicant; an older notice or a general guide is not a substitute for the current official instructions.",
  );
  buildMediaGallery(getOfficialPhotoTriples(["Main Entrance", "Arts Block", "Lecture Theatre Complex"]));
  const grid = buildGrid();
  admissionTopics.forEach((topic) => {
    const paragraph = topic.source.querySelector("p");
    grid.append(createCard(topic.title, getText(paragraph), "admission-topic", topic.id, "Admission guidance"));
  });
  const demoContent = source?.querySelector(".admission-demo-grid");
  if (demoContent) {
    const demoGrid = createElement("div", "admission-demo-grid");
    appendClonedContent(demoGrid, demoContent, false);
    routeContent.append(demoGrid);
    const courseSelect = demoGrid.querySelector('[name="course"]');
    if (courseSelect) void loadAdmissionCourses(courseSelect);
  }
  appendSourceLinks(routeContent, source);
  routeContent.append(createInternalLink("contact", "", "Contact and enquiries", "text-link"));
}

function renderAdmissionTopic(id) {
  const topic = admissionTopics.find((entry) => entry.id === id);
  if (!topic) {
    return false;
  }
  buildPageHeader(topic.title, "admissions", {}, "Admissions");
  const summaries = {
    "main-campus-admissions": "GNDU identifies its dedicated admissions portal as the route for regular programmes at the Main Campus, Amritsar. It is separate from constituent-college and Open and Distance Learning admissions.",
    "courses-eligibility": "GNDU publishes programme options and eligibility through course lists, department information, and the session-specific prospectus. Eligibility is not universal; check the exact programme, campus, applicant category, and session.",
    "prospectus-notices": "The portal provides prospectus and notices for specific admission sessions. Read the session printed on each document and recheck notices for updates before using dates or instructions.",
    "application-documents": "The university’s published step-by-step instructions describe Student ID generation, login, basic and academic details, course registration, fee payment, choice filling where applicable, and application printing. The instructions link currently available is for 2023–24; use it only as a process example and verify the current workflow in the latest notice.",
    "fees-refunds": "GNDU lists course-wise fee information separately from admission instructions. Amounts and refund terms are programme- and session-specific; the refund policy could not be verified from the reviewed current sources.",
    "schedules-merit": "Admission schedules, counselling rounds, entrance-test results, and merit or selection lists are course- and session-specific. Treat result pages as session-labelled records and confirm the relevant session before relying on any date or list.",
    "hostel-admissions": "Hostel application is separate from admission to an academic programme. Current vacancy, eligibility, application dates, required documents, and hostel charges were not verified; consult GNDU’s current hostel information.",
    "online-distance": "Online Studies and Open and Distance Learning admissions are distinct from regular Main Campus admissions. The supplied online.gndu.ac.in site redirects to GNDU’s digital site; a current separate Online Studies application route could not be verified. GNDU’s ODL directorate is provided for official updates.",
    "college-admissions": "GNDU’s constituent-college instructions tell prospective students to enrol on both the Punjab Government centralized portal and the GNDU portal. The course list, eligibility, and steps differ from Main Campus admissions.",
    "student-facilitation": "GNDU’s Students Facilitation Centre is a first contact for prospective and admitted students. It lists admissions, course enquiries, fee payments and refunds, examinations, results, transcripts, hostels, and student activities; GNDU also mentions help for international students.",
  };
  const sections = {
    "main-campus-admissions": [
      ["Programmes and eligibility", "GNDU describes the portal as covering regular undergraduate, postgraduate, M.Phil. and Ph.D. programmes at the Main Campus. Not every course is offered every session. Check its course listing and current prospectus for the exact campus and eligibility."],
      ["Application, documents and counselling", "The official process describes registering with a Student ID, completing candidate and academic information, registering for a course, and following any entrance-test or counselling steps. GNDU’s published instructions ask qualified candidates to attend counselling with original certificates. The current course-specific document checklist must be checked in the current prospectus."],
      ["Fees, notices and selection", "Use the current fee schedule for course amounts. Refund rules, selection dates, counselling rounds, and merit lists vary by programme and session; the guide does not treat earlier dates as current."],
    ],
    "courses-eligibility": [
      ["How to verify eligibility", "Start with the programme’s exact entry in the Main Campus course listing, then read its current prospectus entry for qualifying examination, subject prerequisites, marks, category rules, and selection method. The examples in this guide are not a substitute for current session rules."],
      ["Campus and study mode", "Confirm whether a programme belongs to Main Campus, a Regional Campus, a constituent college, or Open and Distance Learning before applying. The admission route for each may differ."],
    ],
    "prospectus-notices": [
      ["Prospectus", "The Main Campus prospectus link below is labelled for 2026–27. Use it only for that session and confirm whether GNDU has issued a newer revision or notice."],
      ["Admission notices and brochures", "Important notices and programme brochures may be updated separately from the prospectus. Compare their session and publication date; do not rely on a notice from an earlier session."],
    ],
    "application-documents": [
      ["Application steps", "GNDU’s published instructions describe creating or using a Student ID, signing in, filling basic details, adding academic history, choosing a course, paying the applicable registration fee, making choices where requested, and printing the submitted form."],
      ["Documents", "GNDU’s instructions say to bring original certificates to counselling. The exact documents, copies, category proofs, and format depend on the applicant and programme; the current prospectus and notice are authoritative."],
      ["Session warning", "The step-by-step application URL still points to a 2023–24 page. It is not presented as the current process; confirm current steps and requirements on the active admission portal."],
    ],
    "fees-refunds": [
      ["Course fees", "GNDU publishes programme-wise fee schedules. Verify the course, campus, category, and admission session shown in the official schedule before payment."],
      ["Refunds and registration charges", "Refund eligibility and deadlines were not confirmed from the official material reviewed for this page. Please check the applicable current prospectus and admission portal before paying or requesting a refund."],
    ],
    "schedules-merit": [
      ["Schedules and counselling", "GNDU publishes admission and counselling schedules by programme. Confirm the session, course, round, venue or mode, and any revised notice before attending."],
      ["Merit lists and entrance-test results", "The official results page may contain records for more than one session. Check the session and course label; selection and counselling instructions are not interchangeable across programmes."],
    ],
    "hostel-admissions": [
      ["Separate hostel application", "Hostel eligibility and allotment are managed separately from course admission. Hostel details currently verified in this guide describe specific facilities, but do not establish current vacancies or admission conditions."],
      ["Unverified current requirements", "Current application dates, required documents, fees, room availability, and eligibility were not verified. Please consult the official hostel information and the current university notices."],
    ],
    "online-distance": [
      ["Open and Distance Learning", "GNDU’s Directorate of Open and Distance Learning is a separate route from regular Main Campus admissions. Current programme offerings, application dates, fees, and eligibility must be checked in its current prospectus or admission notice."],
      ["Online Studies", "The provided online.gndu.ac.in address redirects to the GNDU digital site. A separate active Online Studies admissions portal could not be confirmed from the official sources reviewed. Please check GNDU’s official website for details."],
    ],
    "college-admissions": [
      ["University and constituent colleges", "GNDU’s instructions state applicants must enrol on the Punjab Government centralized portal as well as the GNDU portal. The course and eligibility details are college-specific."],
      ["Application sequence", "GNDU describes Student ID generation or reuse, login, basic and academic details, course registration, and printing the form. Check the current GNDU and Punjab portal instructions for the course and session before submitting."],
    ],
    "student-facilitation": [
      ["Student enquiries", "GNDU lists admissions, academic course enquiries, fee payments and refunds, examinations, results, transcripts, hostels, and student activities among the Centre’s support areas."],
      ["International students and contact details", "GNDU also notes special assistance to help international students integrate into campus life. Contact numbers and email addresses can change; use the Centre’s official page or the admission portal contact page for current details."],
    ],
  };
  buildPageDescription(summaries[id] || getText(topic.source.querySelector("p")));
  (sections[id] || []).forEach(([title, body]) => buildDetailSection(title, body));

  if (id === "main-campus-admissions") {
    const sources = createElement("div", "directory-links route-source-links");
    addExternalLink(sources, "Apply through GNDU Main Campus portal", "https://www.gnduadmissions.org/CampusAdmissions/");
    addExternalLink(sources, "2026–27 Main Campus prospectus", "https://www.gnduadmissions.org/CampusAdmissions/pdf/Prospectus202627.pdf");
    addExternalLink(sources, "Main Campus course listings", "https://www.gnduadmissions.org/CampusAdmissions/coursesoffered.aspx");
    addExternalLink(sources, "Course-wise fee schedule", "https://www.gnduadmissions.org/CampusAdmissions/pdf/ProgrammesOfferedFee.pdf");
    addExternalLink(sources, "Admission notices and schedules", "https://www.gnduadmissions.org/imp_notices2026.html");
    addExternalLink(sources, "Counselling schedules and results", "https://www.gnduadmissions.org/CampusAdmissions/CounsellingSchedule.aspx");
    routeContent.append(sources);
  } else if (id === "online-distance") {
    addExternalLink(routeContent, "GNDU Open and Distance Learning Directorate", "https://odl.gndu.ac.in/directorate/default.aspx");
    addExternalLink(routeContent, "GNDU official website", "https://digital.gndu.ac.in/");
  } else if (id === "college-admissions") {
    appendSourceLinks(routeContent, topic.source);
  } else {
    appendSourceLinks(routeContent, topic.source);
  }
  return true;
}

function renderFaculties() {
  const source = getSource("#departments");
  buildPageHeader("Faculties & Departments", "", null);
  buildPageDescription(
    `${getText(source?.querySelector(".summary-description"))} Open a faculty to explore its departments and their subject areas. Faculty sections are collapsed initially; programme availability is session-specific and should be checked with GNDU.`,
  );
  buildMediaGallery(getOfficialPhotoTriples([
    "Arts Block",
    "Lab of Computer Science Department",
    "Chemistry Block",
  ]));
  const grid = buildGrid("faculty-grid");
  facultyRecords.forEach((faculty) => {
    const disclosure = createElement("details", "faculty-card faculty-disclosure");
    const summary = createElement("summary", "expand-summary");
    summary.append(
      createElement("h4", "", faculty.title),
      createElement("p", "", `${faculty.description} ${faculty.departments.length} listed departments or schools.`),
    );
    disclosure.append(summary);
    const departments = createElement("ul", "department-list");
    faculty.departments.forEach((department) => {
      const row = createElement("li", "");
      row.append(
        createInternalLink("department", department.slug, department.name),
        createElement("span", "", department.description),
      );
      departments.append(row);
    });
    disclosure.append(departments);
    const facultyLink = createElement("div", "directory-links");
    facultyLink.append(createInternalLink("faculty", faculty.id, "Faculty overview and related programmes"));
    disclosure.append(facultyLink);
    grid.append(disclosure);
  });

  if (academicCentreRecords.length) {
    buildSectionHeading("Other GNDU academic centres");
    const centres = buildGrid("faculty-grid");
    academicCentreRecords.forEach((centre) => {
      const disclosure = createElement("details", "faculty-card faculty-disclosure academic-centre");
      const summary = createElement("summary", "expand-summary");
      summary.append(createElement("h4", "", centre.title), createElement("p", "", centre.description));
      disclosure.append(summary);
      if (centre.overview) {
        disclosure.append(createElement("p", "resource-copy", centre.overview));
      }
      const programmes = getCoursesForAcademicUnit(centre.title);
      if (programmes.length) {
        const list = createElement("ul", "course-list");
        programmes.forEach((course) => {
          const row = createElement("li", "");
          row.append(
            createInternalLink("course", course.slug, course.name),
            createElement("span", "course-facts", course.facts),
            createElement("span", "course-eligibility", course.eligibility || "Check the linked GNDU source and current prospectus for eligibility."),
          );
          list.append(row);
        });
        disclosure.append(list);
      }
      const links = createElement("div", "directory-links");
      addExternalLink(links, "Official centre information", centre.officialUrl);
      disclosure.append(links);
      centres.append(disclosure);
    });
  }
  appendSourceLinks(routeContent, source);
}

function getCoursesForAcademicUnit(unitName) {
  const normalizedUnit = unitName.toLowerCase().replace(/^department of /, "").trim();
  return courseRecords.filter((course) => {
    const courseUnit = [
      course.department,
      course.facts.split("·").pop()?.trim(),
    ].filter(Boolean).join(" ").toLowerCase();
    return courseUnit.includes(normalizedUnit);
  });
}

function renderFaculty(id) {
  const faculty = facultyRecords.find((entry) => entry.id === id);
  if (!faculty) {
    return false;
  }
  buildPageHeader(faculty.title, "faculties", {}, "Faculties & Departments");
  buildPageDescription(
    `${faculty.description} This overview summarizes the official units listed under this faculty in GNDU’s directory; current programme availability is session-specific.`,
  );
  buildDetailSection(
    "Academic units and study",
    `The department directory groups the guide's listed ${faculty.departments.length} academic unit${faculty.departments.length === 1 ? "" : "s"} under ${faculty.title}. Open an individual unit to review its subject area and any related programmes included here; this list is a guide to GNDU's directory, not a complete or session-specific course catalogue.`,
    "Programme names, eligibility, course structure, and campus availability are set out in GNDU's current admission and academic material. Students should verify the intended session and offering unit before applying or planning a course of study.",
  );
  const facultyPhotos = {
    "faculty-arts": ["photo-gallery-4s.jpg", "Arts Block"],
    "faculty-engineering": ["photo-gallery-10s.jpg", "Lab of Computer Science Department"],
    "faculty-sciences": ["photo-gallery-16s.jpg", "Chemistry Block"],
    "faculty-physical-education": ["photo-gallery-13s.jpg", "Hockey Stadium"],
  };
  const facultyPhoto = facultyPhotos[faculty.id];
  if (facultyPhoto) {
    buildMediaGallery([[
      `https://digital.gndu.ac.in/images/photogallery/${facultyPhoto[0]}`,
      `GNDU official photo gallery caption: ${facultyPhoto[1]}`,
      `${facultyPhoto[1]} — official GNDU photo gallery`,
    ]]);
  }
  buildSectionHeading("Departments and schools");
  const grid = buildGrid();
  faculty.departments.forEach((department) => {
    grid.append(createCard(department.name, department.description, "department", department.slug, "Department"));
  });
  const related = faculty.departments.flatMap((department) => getCoursesForAcademicUnit(department.name));
  const uniqueRelated = Array.from(new Map(related.map((course) => [course.slug, course])).values());
  if (uniqueRelated.length) {
    buildSectionHeading("Related programmes listed in this guide");
    const programGrid = buildGrid();
    uniqueRelated.forEach((course) => programGrid.append(createCard(course.name, course.facts, "course", course.slug, course.category)));
  }
  addExternalLink(routeContent, "Official GNDU faculty and department listing", "https://online.gndu.ac.in/Departments.aspx");
  return true;
}

function renderDepartment(id) {
  const department = findDepartment(id);
  if (!department) {
    return false;
  }
  buildPageHeader(department.name, "faculty", { item: department.faculty.id }, department.faculty.title);
  buildPageDescription(
    `${department.description} GNDU lists this unit under the ${department.faculty.title} faculty. The academic-area summary here reflects its official department name and GNDU directory listing.`,
  );
  buildDetailSection(
    "Academic area and university directory",
    `${department.name} is listed in the GNDU directory under ${department.faculty.title}. The department directory link below is the authoritative place to confirm the unit's current profile, contact details, and any changes to its academic organisation.`,
    "The guide links only programmes that are explicitly associated with this unit in its collected programme information. It does not imply that an unlisted course is unavailable or that a listed programme is open for admission in every session.",
  );
  const departmentPhotos = {
    "computer-science": ["photo-gallery-10s.jpg", "Lab of Computer Science Department"],
    chemistry: ["photo-gallery-16s.jpg", "Chemistry Block"],
    "physical-education": ["photo-gallery-13s.jpg", "Hockey Stadium"],
  };
  const departmentPhoto = departmentPhotos[department.slug];
  if (departmentPhoto) {
    buildMediaGallery([[
      `https://digital.gndu.ac.in/images/photogallery/${departmentPhoto[0]}`,
      `GNDU official photo gallery caption: ${departmentPhoto[1]}`,
      `${departmentPhoto[1]} — GNDU official photo gallery`,
    ]]);
  }
  buildDetailFacts([
    ["Faculty", department.faculty.title],
    ["Academic area", department.description],
    ["Related programmes", "Only programmes explicitly listed for this department in the guide are shown below. A complete current programme list, eligibility, and duration should be checked with GNDU."],
    ["Syllabus information", "Use GNDU’s syllabus selector to choose the relevant session, campus, and course."],
  ]);
  buildDetailSection(
    "Checking a programme and syllabus",
    "Use the official course listing and prospectus to verify the current admission route, qualifications, subject prerequisites, selection method, and campus. Use the syllabus selector for the relevant session and course rather than relying on an older syllabus document.",
  );
  const related = getCoursesForAcademicUnit(department.name);
  if (related.length) {
    buildSectionHeading("Related programmes listed in this guide");
    const grid = buildGrid();
    related.forEach((course) => grid.append(createCard(course.name, course.facts, "course", course.slug, course.category)));
  }
  addExternalLink(routeContent, "Official department information", department.officialUrl);
  addExternalLink(routeContent, "Official GNDU department listing", "https://online.gndu.ac.in/Departments.aspx");
  addExternalLink(routeContent, "Official GNDU syllabus selector", "https://collegeadmissions.gndu.ac.in/StudentArea/ViewSyllabinew.aspx");
  return true;
}

function renderCourses() {
  const source = getSource("#courses");
  buildPageHeader("Courses and Programmes", "", null);
  buildPageDescription(
    `${getText(source?.querySelector(".summary-description"))} Expand a programme category to review listed course names, degree type, duration, department, and published eligibility. Categories start collapsed; verify each detail against the current GNDU prospectus and the offering campus or college.`,
  );
  buildMediaGallery(getOfficialPhotoTriples([
    "Lab of Computer Science Department",
    "Chemistry Block",
    "Lecture Theatre Complex",
  ]));
  const grid = buildGrid("course-category-grid");
  courseCategories.forEach((category) => {
    const disclosure = createElement("details", "course-category");
    appendClonedContent(disclosure, category.source, false);
    const categoryLink = createElement("div", "directory-links");
    categoryLink.append(createInternalLink("course-category", category.slug, `Open ${category.title} as a separate page`));
    disclosure.append(categoryLink);
    grid.append(disclosure);
  });
  appendSourceLinks(routeContent, source);
}

function renderCourseCategory(id) {
  const category = courseCategories.find((entry) => entry.slug === id);
  if (!category) {
    return false;
  }
  buildPageHeader(category.title, "courses", {}, "Courses and Programmes");
  buildPageDescription(category.note);
  buildDetailSection(
    "How to use this category",
    "The entries below are a starting point for finding GNDU programme information, not a guarantee of current admission. A programme may be offered through a particular campus, regional campus, constituent college, or study mode; confirm the institution attached to the course in the current official listing.",
    "Before applying, compare the programme name and duration in the current prospectus, review the stated eligibility and selection method, and check course-specific notices for any entrance test, counselling schedule, or required documents.",
  );
  if (category.courses.length) {
    const grid = buildGrid();
    category.courses.forEach((course) => {
      grid.append(createCard(course.name, course.facts, "course", course.slug, category.title));
    });
  } else {
    routeContent.append(createElement(
      "p",
      "route-unavailable",
      "A current programme list, duration, and schedule could not be verified. Please check the official GNDU website for details.",
    ));
  }
  appendSourceLinks(routeContent, category.source);
  addExternalLink(routeContent, "Official GNDU Main Campus admission portal", "https://www.gnduadmissions.org/CampusAdmissions/");
  return true;
}

function renderCourse(id) {
  const course = courseRecords.find((entry) => entry.slug === id);
  if (!course) {
    return false;
  }
  buildPageHeader(
    course.name,
    "course-category",
    { item: courseCategories.find((entry) => entry.courses.includes(course))?.slug },
    course.category,
  );
  const relatedUnit = course.department || course.facts.split("·").slice(-1)[0]?.trim() || "";
  buildPageDescription(
    course.introduction || `${course.name} is listed by GNDU in its ${course.category} programme information${relatedUnit ? ` for ${relatedUnit}` : ""}. Confirm the offering institution and session-specific requirements before applying.`,
  );
  buildDetailFacts([
    ["Official programme name", course.name],
    ["Qualification level and duration", course.facts],
    ["Eligibility", course.eligibility || "Please check the official GNDU website for details."],
    ["Offering campus, college, or unit", course.provider || "The official department page identifies the GNDU academic unit, but current campus/college availability should be confirmed in the relevant session's admission listing."],
    ["Related department or centre", relatedUnit || "Please check the official GNDU website for details."],
    ["Admission process", course.provider?.includes("not identified")
      ? "GNDU's reviewed source does not identify the current institution offering this programme. Check the constituent-college and campus listings before applying; this guide does not claim Main Campus availability."
      : "Admission steps and current availability vary by programme and session. Confirm the selected campus or college, then check its current GNDU course listing, prospectus, and admission notices."],
    ["Syllabus or curriculum", "Please select the relevant session, campus, and course in the official GNDU syllabus selector."],
  ]);
  addExternalLink(
    routeContent,
    course.name.includes("(BCA)")
      ? "GNDU course-related enquiries (BCA is listed; offering details are not stated)"
      : "Official programme / department information",
    course.officialUrl,
  );
  if (course.provider?.includes("not identified")) {
    addExternalLink(routeContent, "GNDU constituent-college admissions (check institution and course)", "https://www.gnduadmissions.org/CampusAdmissions/DefaultConstituentColleges.aspx");
  } else {
    addExternalLink(routeContent, "Current GNDU Main Campus prospectus", "https://www.gnduadmissions.org/CampusAdmissions/pdf/Prospectus202627.pdf");
    addExternalLink(routeContent, "GNDU constituent-college admissions", "https://www.gnduadmissions.org/CampusAdmissions/DefaultConstituentColleges.aspx");
  }
  addExternalLink(routeContent, "Official GNDU syllabus selector", "https://collegeadmissions.gndu.ac.in/StudentArea/ViewSyllabinew.aspx");
  return true;
}

function renderCanteens() {
  buildPageHeader("Canteens", "", null);
  buildPageDescription(
    "GNDU's published dining details focus on food services described in individual hostel profiles. They are useful for understanding the facilities associated with residential life, but do not amount to a current campus-wide directory of outlets. Menus, prices, vendor names, public access, and most operating hours are not published in the sources reviewed.",
  );
  buildDetailSection(
    "Boys' Hostel-I canteens",
    "GNDU's Hostels page describes two canteens inside Sahibzada Jujhar Singh Boys Hostel-I, run by separate contractors and serving hostel residents. The page lists service hours of 6:00 a.m. to 11:00 p.m. and says the canteens have furniture and fittings; products approved by the Dean, Students' Welfare are sold at fixed prices. The page does not name the outlets or publish a current menu or item-wise price list.",
    "These hours and arrangements are reproduced from the published hostel page, which does not give an effective date. Confirm current service, access, and prices with the hostel before relying on them.",
  );
  buildDetailSection(
    "Other hostel dining information",
    "The same official page mentions a canteen at Sahibzada Zorawar Singh Boys Hostel-II, with snacks, tea, coffee, juice, and milk products; it does not state its hours. Sahibzada Fateh Singh Boys Hostel-III is described as having a mess and a canteen operated by separate contractors, but no canteen menu or hours are given.",
    "Mata Nanaki Girls Hostel-I lists a canteen among its facilities without further operating details. Girls Hostel-II is described as having a separate canteen offering snacks, beverages, and fast food, with no hours published. Girls Hostel-IV's profile describes beverages, snacks, bakery items, and fast food, and lists 8:00 a.m.–10:00 p.m.; that page gives no date for those hours, so treat them as unconfirmed and check with the hostel.",
  );
  buildDetailSection(
    "Campus food courts and other outlets",
    "The official pages reviewed did not provide a current campus-wide food-court directory, a list of food-court units, named general-campus outlets, or verified locations and seating arrangements for them. The hostel canteen details above should not be read as proof that an outlet is open to all students or visitors.",
    "No current campus-wide menus, prices, vendor names, or operating hours were verified. Ask GNDU or the relevant hostel office for current information before visiting.",
  );
  buildDetailSection(
    "Food quality, hygiene, and photographs",
    "GNDU's Boys' Hostel-I page specifically says its canteens serve products approved by the Dean, Students' Welfare at fixed prices. Other hostel profiles describe food-service arrangements, but the sources reviewed do not establish a university-wide canteen inspection programme or a current food-safety certification. No identifiable canteen or food-court photograph was verified in the official gallery, so this page avoids using unrelated images.",
  );
  const grid = buildGrid();
  canteenRecords.forEach((canteen) => {
    grid.append(createCard(canteen.title, getText(canteen.source.querySelector("p")), "canteen", canteen.id, "Campus dining"));
  });
  addExternalLink(routeContent, "GNDU hostel facilities and dining information", "https://digital.gndu.ac.in/Hostels.aspx");
  addExternalLink(routeContent, "GNDU official hostel portal", "https://gndu.ac.in/hostel/");
}

function renderCanteen(id) {
  const canteen = canteenRecords.find((entry) => entry.id === id);
  if (!canteen) {
    return false;
  }
  buildPageHeader(canteen.title, "canteens", {}, "Canteens");
  const body = createElement("div", "route-detail-content");
  appendClonedContent(body, canteen.source);
  routeContent.append(body);
  if (id === "boys-hostel") {
    buildDetailSection(
      "Location, service, and prices",
      "GNDU's Hostels page places two canteens inside Sahibzada Jujhar Singh Boys Hostel-I and says they serve hostel residents from 6:00 a.m. to 11:00 p.m. Separate contractors operate them; the page describes furniture and fittings and says products approved by the Dean, Students' Welfare are sold at fixed prices.",
      "The official page does not identify the canteens by name, distinguish their locations within the hostel, or publish a current menu or item-wise prices. Its hours have no stated effective date, so confirm them and access arrangements with the hostel.",
    );
    buildDetailSection(
      "Separate hostel mess service",
      "The source describes two messes separately from the canteens. Student mess-cum-hostel welfare committees manage the contractor-run messes under the Warden; the dining halls have furniture, cooking gas, desert coolers, and inverter backup. These are hostel mess arrangements and do not establish a general campus dining service.",
    );
  } else {
    buildDetailSection(
      "Sahibzada Zorawar Singh Boys Hostel-II",
      "GNDU's hostel profile says a canteen is available in addition to the mess and lists snacks, tea, coffee, juice, and milk products. It does not publish canteen hours, current prices, a vendor name, or a more precise location.",
    );
    buildDetailSection(
      "Sahibzada Fateh Singh Boys Hostel-III",
      "The profile identifies a mess and a canteen run by separate contractors. It does not publish a canteen menu, prices, or service hours. The page's food-quality language is not a substitute for current inspection or menu information.",
    );
    buildDetailSection(
      "Mata Nanaki Girls Hostel-I and II",
      "Girls Hostel-I lists a canteen among its facilities but gives no menu or operating details. Girls Hostel-II describes a separate canteen offering snacks, beverages, and fast food; no hours or current prices are published.",
    );
    buildDetailSection(
      "Mata Nanaki Girls Hostel-IV",
      "GNDU's profile lists beverages, snacks, bakery items, and fast food and gives canteen hours of 8:00 a.m. to 10:00 p.m. Because the page does not date this schedule, treat it as unconfirmed and contact the hostel before visiting. It does not publish a current menu or item-wise prices.",
    );
    buildDetailSection(
      "Other campus dining and access",
      "The official hostel profiles reviewed do not provide a current campus-wide food-court or outlet directory, identify food-court units, or establish that hostel canteens are open to non-residents. They also do not provide verified seating details for general-campus outlets. Confirm access, location, hours, and service directly with GNDU or the relevant hostel.",
    );
  }
  addExternalLink(routeContent, "GNDU hostel facilities and dining information", "https://digital.gndu.ac.in/Hostels.aspx");
  addExternalLink(routeContent, "GNDU official hostel portal", "https://gndu.ac.in/hostel/");
  return true;
}

function renderHostelDetail(id) {
  if (!["boys-hostel", "girls-hostel-iii", "sports-hostel", "other-hostels"].includes(id)) {
    return false;
  }
  return renderFacility("hostels");
}

function renderCampusLife() {
  buildPageHeader("Campus Life", "", null);
  buildPageDescription("Campus life includes residential services, health and student support, academic resources, sports, and student activities. This guide summarises information published by GNDU; access, eligibility, and current arrangements should be confirmed with the relevant university unit.");
  buildMediaGallery(getOfficialPhotoTriples(["Boys Hostel", "Girls Hostel", "Students and Staff on Bicycle"]));
  const grid = buildGrid();
  const items = [
    ["Hostels", "Hostel information and admission arrangements published by GNDU.", "facility", "hostels"],
    ["Health Services", "Medical and related health services described by GNDU.", "facility", "health-services"],
    ["Student Support", "GNDU Student Facilitation Centre information and enquiry routes.", "facility", "student-support"],
    ["Campus Facilities", "Explore university facilities with current GNDU information.", "facility", "campus-facilities"],
    ["Library", "Bhai Gurdas Library services and facilities.", "library"],
    ["Sports", "Facilities and activities listed by GNDU.", "sports"],
    ["Student Life", "Student activities and support resources published by GNDU.", "student-life"],
    ["Campus Map", "Interactive campus search; building-level locations are not verified in this guide.", "campus-map"],
    ["Canteens", "Officially published canteen information and items not verified.", "canteens"],
    ["Photo Gallery", "Official GNDU campus photographs.", "photo-gallery"],
    ["Contact and Enquiries", "Official university enquiry information.", "contact"],
  ];
  items.forEach(([title, description, page, item]) => {
    grid.append(createCard(title, description, page, item, "Campus resource"));
  });
}

function renderFacility(id) {
  if (id === "hostels") {
    buildPageHeader("Hostels", "campus-life", {}, "Campus Life");
    buildPageDescription("Guru Nanak Dev University’s official Hostels page names three boys’ hostels, four Mata Nanaki girls’ hostels, and three residences at Regional Campuses. The detailed profiles below follow that page as the primary source. Main-campus and Regional Campus residences are kept separate; where the official page does not publish capacity, facilities, or rules, those details are identified as unavailable rather than inferred.");

    buildSectionHeading("Official GNDU hostel photographs");
    const hostelPhotos = [
      ...getOfficialPhotoTriples(["Boys Hostel", "Girls Hostel", "Sports Hostel"]),
      [
        "https://gndu.ac.in/hostel/images/bh3.jpeg",
        "GNDU hostel portal photograph of a residential block with a Block 1 sign; its named hostel is not identified",
        "Residential block (Block 1 shown; hostel not named) — GNDU official hostel portal",
      ],
      [
        "https://gndu.ac.in/hostel/images/redhallboys.jpeg",
        "GNDU hostel portal photograph of a study hall; its named hostel is not identified",
        "Study hall (hostel not named) — GNDU official hostel portal",
      ],
    ];
    routeContent.append(createMediaGallery(hostelPhotos));
    appendPhotoAttribution(routeContent, "GNDU official photo gallery (hostel captions do not identify numbered blocks)", "https://digital.gndu.ac.in/photo-gallery.aspx");
    appendPhotoAttribution(routeContent, "GNDU official hostel portal (building and study-space photos)", "https://gndu.ac.in/hostel/");

    buildSectionHeading("GNDU Main Campus Hostels");
    [
      {
        id: "boys-i",
        name: "Sahibzada Jujhar Singh Boys Hostel-I",
        intro: "GNDU describes this Wi-Fi-enabled residence as accommodation for 704 students in five blocks of cubicle rooms.",
        facts: [["Capacity", "704 students"], ["Rooms", "356 cubicle rooms"], ["Blocks", "5"]],
        sections: [
          ["Mess and dining", "Two contractor-run messes are overseen by student mess-cum-hostel welfare committees of five to seven students under the Warden. The dining halls have furniture, cooking gas, large desert coolers, and inverter backup. The page also notes separate residential accommodation for the mess workers who prepare and serve meals."],
          ["Canteens and common rooms", "Two canteens operated by separate contractors serve residents from 6:00 a.m. to 11:00 p.m. GNDU says products approved by the Dean, Students’ Welfare are sold at fixed prices. Two common rooms are listed, open from 7:00 a.m. to 11:00 p.m.; one has a 42-inch LCD and the other a 29-inch colour television, both with Dish TV. The published subscriptions include 14 newspapers and 14 magazines or periodicals in English, Hindi, and Punjabi."],
          ["Study and internet", "A furnished reading hall seats about 100 residents and is described as available for study during the day and night. It has curtains and two desert coolers. Wi-Fi is listed in the reading hall and all rooms, with high-fidelity cables on every floor in all five blocks."],
          ["Water, grounds, and maintenance", "Geysers and water coolers are reported in every block. Solar water heaters serve bathrooms in four blocks and the messes. The page also records two additional 150-litre coolers near the canteen and messes, and a submersible pump near the hostel for water supply. Solar lights illuminate the lawns, while electric lights illuminate the hostel roads; the landscaped grounds include trees, shrubs, seasonal flowers, and benches. Repair services cover electrical work, civil work, wooden furniture, water supply, and sewerage."],
          ["Games and guests", "Indoor facilities include table tennis and carrom; the grounds include one volleyball court and two badminton courts. One guest room is kept ready for overnight stays by parents or relatives. A second guest room is furnished with a sofa set and centre table for visitors meeting residents."],
        ],
        warden: "Dr. Amarinder Singh, Assistant Professor, Department of Agriculture.",
      },
      {
        id: "boys-ii",
        name: "Sahibzada Zorawar Singh Boys Hostel-II",
        intro: "GNDU reports accommodation for about 550 students. The designated page does not provide a room count, block count, or floor count for this residence.",
        facts: [["Capacity", "About 550 students"]],
        sections: [
          ["Mess and canteen", "Contractors run the messes, with student Mess Committees managing them under the Warden. The furnished dining halls are described with curtains, desert coolers, inverters, deep freezers, and fire extinguishers. A separate canteen serves snacks, tea, coffee, juice, and milk products; no opening hours are published on the page."],
          ["Rooms, water, and internet", "Residential blocks have geysers and water coolers, and Wi-Fi is available. The official description does not specify room-sharing arrangements."],
          ["Study, common rooms, and recreation", "The hostel has a reading room and well-equipped common rooms with LCD television and Dish TV. Indoor and outdoor games listed are volleyball, badminton, chess, table tennis, and carrom. The page reports subscriptions to about 11 newspapers and six magazines in Punjabi, Hindi, and English."],
          ["Guest accommodation", "A guest room is available for residents’ visitors. The official page does not publish additional guest-room capacity or booking arrangements."],
        ],
        warden: "Dr. Parminder Singh, Assistant Professor, Department of Physical Education.",
      },
      {
        id: "boys-iii",
        name: "Sahibzada Fateh Singh Boys Hostel-III",
        intro: "GNDU’s designated Hostels.aspx page says this residence began in July 2016 and provides shared accommodation in interconnected blocks over four storeys.",
        facts: [["Capacity", "300 students"], ["Rooms", "90"], ["Floors", "4"]],
        sections: [
          ["Accommodation and current figures", "Rooms are shared, well lit and ventilated, and have an attached balcony or verandah. Note: GNDU’s separate hostel portal publishes a different historical capacity and room count (231 students in 77 rooms). This profile follows the requested Hostels.aspx page’s figures of 300 students in 90 rooms; confirm the current allotment figures with GNDU."],
          ["Mess, canteen, and water", "Separate contractors run the mess and canteen, with GNDU requiring quality food and service; student Mess Committees oversee the mess under the Warden. The dining hall is described with desert coolers, a water cooler, filters, and fly or insect killers. Each floor has water coolers and purifiers, and geysers are provided in bathrooms. The page does not give canteen hours."],
          ["Study, common room, and internet", "A common room has an LED television with Dish TV, newspapers, magazines, and indoor games. A reading hall seats about 100 students. Wi-Fi is available."],
          ["Health, security, and recreation", "A common medical room with paramedical services is available in the nearby university health centre. CCTV cameras are reported at the hostel entrance gate. Volleyball, badminton, chess, table tennis, and carrom are listed. The grounds include spacious lawns, trees, and seasonal flower beds."],
        ],
        warden: "Dr. Prabhpreet Singh, Associate Professor, Department of Chemistry.",
      },
      {
        id: "girls-i",
        name: "Mata Nanaki Girls Hostel-I",
        intro: "Established in 1973, this hostel accommodates students from different university departments.",
        facts: [["Capacity", "470 students"], ["Rooms", "179"], ["Established", "1973"]],
        sections: [
          ["Accommodation and facilities", "The page lists two-, four-, and five-person rooms. Facilities include Wi-Fi, a medical room, utility shop, photocopy service, PCO-cum-stationery store, general store, reading hall, mess, and canteen. Hostel blocks have geysers and filtered water coolers. A furnished common room has an LED television with Dish connection. Newspapers and magazines in Punjabi, Hindi, and English are available to students on request."],
          ["Security, staff, and wellbeing", "GNDU describes 24-hour CCTV coverage at the entrance and boundaries, female attendants, and women night guards. Office staff are listed as available on weekdays from 9:00 a.m. to 5:00 p.m.; the Assistant Warden and Warden are described as available at all hours when needed. The hostel also has a sanitary-pad vending machine and an incinerator."],
          ["Recreation and green space", "Carrom, badminton, and table tennis are listed as indoor and outdoor games. The hostel has green lawns with benches."],
          ["Eligibility and allotment published for this hostel", "Admission rights are reserved by the Dean, Students’ Welfare. The published instructions call for the prescribed online form, two passport-size photographs, attestation by the Head of Department, the student’s own handwriting, and personal submission to the Warden. Students living within 25 km, evening students, employees, and part-time students are listed as ineligible. A fresh application is required each academic session. Seats are limited, so GNDU advises checking availability before choosing a course. Residents are expected to follow hostel rules; the page says the University may require a resident to leave for concerns about conduct, health, or rule compliance."],
        ],
        warden: "Dr. Satinder Kaur, Assistant Professor, Department of Agriculture.",
      },
      {
        id: "girls-ii",
        name: "Mata Nanaki Girls Hostel-II",
        intro: "GNDU reports accommodation for 630 students across six separate blocks.",
        facts: [["Capacity", "630 students"], ["Rooms", "232"], ["Blocks", "6"]],
        sections: [
          ["Room arrangements and water", "The listed room types accommodate two, three, four, or five students. Residential blocks have geysers, solar water heaters in bathrooms, and water coolers with RO systems. Wi-Fi is available in the blocks."],
          ["Mess and canteen", "The contract-run mess is described as serving clean, nutritious food according to a pre-decided menu. Its dining hall has a water cooler and fly or insect killers. A separate canteen offers snacks, beverages, and fast food; the page does not state its hours."],
          ["Study, common room, and guests", "Residents have a separate reading room and a common room with television, newspapers, magazines, and indoor games. A furnished guest room is provided for visitors."],
          ["Medical support and security", "A medical room with paramedical service is available in the hostel, with a qualified female nurse listed for night duty. Boundaries and entrance have CCTV surveillance; the page also lists female attendants, a male guard at the entrance, and women night guards. Office staff, the Assistant Warden, and the Warden are described as available at all hours when needed."],
          ["Resident responsibilities", "The page asks residents to maintain decorum and observe hostel rules. It says the University may ask a resident to leave if concerns arise about conduct, health, or compliance with hostel rules."],
        ],
        warden: "Dr. Sana Absar, Assistant Professor, Department of Mass Communication.",
      },
      {
        id: "girls-iii",
        name: "Mata Nanaki Girls Hostel-III",
        intro: "Started in January 2014, this residence is described as six-storey interconnected blocks with well-lit, ventilated rooms.",
        facts: [["Capacity", "761 students"], ["Rooms", "255"], ["Floors", "6"], ["Established", "January 2014"]],
        sections: [
          ["Room arrangements and eligibility", "Rooms are offered on a sharing basis. GNDU states that this hostel is allotted only to students in the second or a later year of their course. Each block has a separate lift with generator backup."],
          ["Mess and dining", "The contract-run mess is described as serving clean, nutritious food according to a pre-decided menu. Its dining hall has water coolers, purifiers, and fly or insect killers; food is served in hot-case bain-maries."],
          ["Water, study, and common rooms", "Bathrooms have geysers, with water coolers and purifiers in each block. The hostel provides Wi-Fi, a reading room, and a common room with LED television and Dish TV, newspapers, magazines, and indoor games."],
          ["Medical support, safety, and services", "A common medical room is available in the hostel; the page lists a nurse, attendant, and security guards on night duty. CCTV covers the boundaries and entrance. A common provisional store and shops supply stationery and other utility items, and photocopying is available. A sanitary-napkin vending machine and incinerator are also listed."],
          ["Outdoor space", "Spacious green lawns around the main building are described with seasonal flower beds and trees."],
        ],
        warden: "Dr. Harkirandeep Kaur, Assistant Professor, Department of Law.",
      },
      {
        id: "girls-iv",
        name: "Mata Nanaki Girls Hostel-IV",
        intro: "GNDU reports accommodation for nearly 600 regular Ph.D., M.Phil., and postgraduate students. The page notes that an additional block has been added.",
        facts: [["Capacity", "Nearly 600 students"], ["Rooms", "420"]],
        sections: [
          ["Room arrangements", "Ph.D. and M.Phil. students are offered individual rooms; postgraduate students are offered shared rooms. Rooms are described as well lit and ventilated, with an attached balcony or verandah."],
          ["Mess, canteen, and water", "Separate contractors run the mess and canteen and are expected by GNDU to provide quality food and service. The dining hall has seating, desert coolers, a water cooler and purifier, and fly or insect killers. The canteen offers beverages, snacks, bakery items, and fast food, and the published hours are 8:00 a.m. to 10:00 p.m. All blocks have geysers, water coolers, and purifiers."],
          ["Study, common room, and recreation", "The hostel has Wi-Fi and a common room with LED television and Dish system, carrom, ludo, and table tennis. The page reports subscriptions to about 10 newspapers and 12 magazines in Punjabi, Hindi, and English. A badminton court is provided; the premises are also used for festive celebrations."],
          ["Medical support, safety, and shopping", "CCTV cameras are reported around the hostel boundary. A stationery-cum-photostat shop and common paramedical services are available. The page lists a nurse, attendant, and lady security guards on night duty. Green lawns include seasonal flower beds and trees."],
          ["Warden listing discrepancy", "The designated Hostels.aspx page lists Ms. Sunaiana, Assistant Professor in the Department of Agriculture. GNDU’s separate hostel portal names Dr. Sandeep Kaur, Assistant Professor in the Department of Guru Nanak Studies. Confirm the current Warden with the hostel office."],
        ],
        warden: "Ms. Sunaiana, Assistant Professor, Department of Agriculture.",
      },
    ].forEach(buildHostelProfile);

    buildSectionHeading("Regional Campus Hostels");
    buildPageDescription("GNDU’s Hostels.aspx page lists the following Regional Campus residences and Wardens. It does not publish individual capacity, room counts, room-sharing arrangements, facilities, or hostel-specific eligibility for these three residences; none are inferred here.");
    [
      {
        id: "regional-jalandhar-girls",
        name: "Girls Hostel – Regional Campus, Jalandhar",
        intro: "A girls’ hostel is listed at the Regional Campus, Jalandhar. Hostel-specific accommodation and facility details are not provided on the designated page.",
        warden: "Dr. Varinder Kaur Attari, Assistant Professor, Department of Engineering & Technology, Regional Campus Jalandhar.",
      },
      {
        id: "regional-gurdaspur-boys",
        name: "Boys Hostel – Regional Campus, Gurdaspur",
        intro: "A boys’ hostel is listed at the Regional Campus, Gurdaspur. Hostel-specific accommodation and facility details are not provided on the designated page.",
        warden: "Sh. Sharanjeet Singh, Assistant Professor, Department of Engineering & Technology, Regional Campus Gurdaspur.",
      },
      {
        id: "regional-gurdaspur-girls",
        name: "Girls Hostel – Regional Campus, Gurdaspur",
        intro: "A girls’ hostel is listed at the Regional Campus, Gurdaspur. Hostel-specific accommodation and facility details are not provided on the designated page.",
        warden: "Dr. Harjot Kaur, Assistant Professor, Department of Engineering & Technology, Regional Campus Gurdaspur.",
      },
    ].forEach(buildHostelProfile);

    buildDetailSection(
      "General eligibility and application information published by GNDU",
      "GNDU reserves hostel admission decisions to the Dean, Students’ Welfare. The general instructions direct applicants to obtain the prescribed form from Warden offices, provide two passport-size photographs, have the form attested by the Head of Department, complete it in the student’s own handwriting, and submit it personally to the Warden. Mata Nanaki Girls Hostel-I separately describes an online form. The source says applications must be made afresh each academic session and that research fellows are treated on a par with other students.",
      "The general page lists local students within 40 km as ineligible, with a 25 km limit in the case of girls; it also lists evening students, employees, and part-time students as ineligible. Mata Nanaki Girls Hostel-I separately publishes its 25 km local-student limit. The number of places is limited and accommodation is not guaranteed for every applicant, so GNDU advises making an outside-campus accommodation plan if a place is unavailable.",
    );
    buildDetailSection(
      "Details to confirm before applying",
      "The official Hostels.aspx page does not show a last-updated date. Capacities, vacancies, eligibility rules, application forms, fees, operating hours, facility availability, and Warden assignments can change. Confirm the current schedule and rules on GNDU’s official hostel portal before relying on these published descriptions.",
    );
    addExternalLink(routeContent, "GNDU Hostels page (primary source)", "https://digital.gndu.ac.in/Hostels.aspx");
    addExternalLink(routeContent, "GNDU official hostel portal, current schedules and rules", "https://gndu.ac.in/hostel/");
    addExternalLink(routeContent, "GNDU anti-ragging and emergency Warden contacts (PDF)", "https://digital.gndu.ac.in/pdf/hostels/numbersofhostelwardens.pdf");
    return true;
  }

  if (id === "campus-facilities") {
    buildPageHeader("Campus Facilities", "campus-life", {}, "Campus Life");
    buildPageDescription("GNDU publishes information about academic and study spaces, residential facilities, health services, sports, and student support. These services are managed by different university units, so eligibility, access and hours can differ; use the relevant office's current instructions before visiting.");
    buildMediaGallery(getOfficialPhotoTriples(["Main Entrance", "Administration Block", "Bhai Gurdas Library"]));
    buildDetailSection(
      "Finding the right facility",
      "The pages below distinguish facilities with their own university information from services whose current details were not verified. Open the relevant guide for the official description and source link, then check whether the service is available to your student group and whether an appointment or campus access is required.",
      "Photographs on this page retain GNDU's gallery captions and show named locations only. They are not a building map and do not establish where a particular office or service counter is located.",
    );
    const grid = buildGrid();
    [
      ["Hostels", "Accommodation and resident facilities described by GNDU.", "facility", "hostels"],
      ["Health Services", "Primary care and related services offered by the University Health Centre.", "facility", "health-services"],
      ["Bhai Gurdas Library", "Reading facilities, collections, electronic resources, and catalogue.", "library"],
      ["Sports Facilities", "Sports grounds, stadiums, and training facilities listed by GNDU.", "sports"],
      ["Student Support", "Enquiries handled by GNDU’s Students Facilitation Centre.", "facility", "student-support"],
    ].forEach(([title, description, page, item]) => {
      grid.append(createCard(title, description, page, item, "University facility"));
    });
    return true;
  }

  const sourceMap = {
    hostels: ["#hostels", "Hostels"],
    "health-services": ["#health-services", "Health Services"],
    "student-support": ["#student-support", "Student Support"],
    "student-activities": ["#student-life .resource-card", "Activities and Events"],
  };
  const entry = sourceMap[id];
  if (!entry) {
    return false;
  }
  const source = id === "student-activities"
    ? Array.from(document.querySelectorAll("#student-life .resource-card")).find((card) => getText(card.querySelector("summary h4")) === entry[1])
    : getSource(entry[0]);
  buildPageHeader(entry[1], "campus-life", {}, "Campus Life");
  if (id === "health-services") {
    buildPageDescription("GNDU's University Health Centre is described as a primary-care facility serving the university community. Its published service list includes outpatient care and diagnostic support; students should confirm current eligibility, operating arrangements, and referral procedures with the Centre.");
    buildDetailSection(
      "Services described by GNDU",
      "The Health Centre page lists Medical, Dental, and Ayurvedic outpatient services, physiotherapy, laboratory, radiology, and pharmacy services. GNDU describes its routine services as operating Monday to Saturday, including declared holidays, and says emergency and ambulance services are available 24 hours.",
      "The university notes that primary care is provided to students, staff, pensioners, and their dependants; for care beyond the Centre's services, referral to hospitals is described. Confirm current eligibility and referral arrangements with the Health Centre.",
    );
    buildDetailSection(
      "Diagnostic and supporting facilities",
      "GNDU lists in-house equipment and services including digital ECG and X-ray, bone-density scans, mammography, dental X-ray, and orthopantomogram. Its page says some tests are available to students and staff at nominal rates, but the current rates and booking requirements should be confirmed directly.",
      "GNDU also describes a sample-collection arrangement with an accredited laboratory and a medical room in the Girls' Hostel. The published page says a nurse is available there overnight; residents should check the current notice and contact route for urgent care.",
    );
    addExternalLink(routeContent, "GNDU Health Centre information", "https://digital.gndu.ac.in/OtherCenterFacilities.aspx#health");
  } else if (id === "student-support") {
    buildPageDescription("GNDU identifies the Students Facilitation Centre as a first contact for prospective and enrolled students who need help finding the right university office. It supports a range of academic and administrative enquiries, but is not a substitute for programme-specific decisions made by the responsible branch.");
    buildDetailSection(
      "Enquiries supported",
      "The Centre lists admissions and course enquiries, student fee payments and refunds, examinations, results, transcripts, hostels, and student activities. GNDU also notes assistance for international students.",
      "For a faster referral, identify your programme, campus, admission session, and the notice or process you are asking about. Avoid sending sensitive documents through an unverified contact channel; check the Centre's official page for current contact details and opening arrangements.",
    );
    addExternalLink(routeContent, "Student Facilitation Centre", "https://digital.gndu.ac.in/StudentFacilitationCenter.aspx");
  } else if (id === "student-activities") {
    buildPageDescription("GNDU’s Dean Students’ Welfare, Youth Welfare, and Student Activity Clubs pages describe student groups, sports, festivals, camps, seminars, workshops, and cultural programmes. These are published activity areas, not announcements of current event dates.");
    buildDetailSection(
      "Activities described by GNDU",
      "The Dean Students’ Welfare page mentions indoor and outdoor sports events, youth festivals, hobby and drama clubs, and subject-related societies. The Youth Welfare Department describes zonal and inter-zonal youth festivals, leadership and hiking or trekking camps, tours, coaching camps, seminars, workshops, and cultural programmes. These descriptions do not guarantee a particular event or club is currently active; check the university pages for current schedules and participation details.",
    );
    buildDetailSection(
      "Photographs",
      "The official Student Activity Clubs page uses designed club graphics rather than documentary campus photographs. They are not presented here as photographs; use the official page to view the club graphics and current club information.",
    );
    addExternalLink(routeContent, "Dean Students’ Welfare", "https://digital.gndu.ac.in/dean-students-welfare.aspx");
    addExternalLink(routeContent, "Department of Youth Welfare", "https://digital.gndu.ac.in/YouthWelfareDepartment.aspx");
    addExternalLink(routeContent, "Student Activity Clubs", "https://digital.gndu.ac.in/StudentActivityClubs.aspx");
  }
  return true;
}

function renderResourcePage(id) {
  const routeMap = {
    library: ["#library", "Library"],
    sports: ["#sports", "Sports"],
    "student-life": ["#student-life", "Student Life"],
  };
  const entry = routeMap[id];
  const source = entry && getSource(entry[0]);
  if (!source) {
    return false;
  }
  buildPageHeader(entry[1], "campus-life", {}, "Campus Life");
  if (id === "library") {
    buildPageDescription("Established in March 1970 and named after Bhai Gurdas, the University Library supports undergraduate and postgraduate study, teaching, and research. GNDU describes its five-storey inverted-pyramid building as centrally located on campus and visible from the main gate. Students can use its print and digital collections, study spaces, reference sections, and online discovery services; access rules can vary by collection and membership.");
    buildDetailSection(
      "Collections and research resources",
      "The library homepage reports a collection of 543,357 documents. Its collection listings include printed books and reference works, 134 Indian and 52 foreign journals, 92,296 journal backsets, 139 maps, 150 gifted journal items, and 12,732 theses and dissertations. These are figures published by GNDU without a clear as-of date, so treat them as a snapshot rather than a live inventory.",
      "The homepage also lists 24 newspapers, more than 13,000 e-journals, and more than 15,612 e-books. Electronic holdings and subscriptions change, and an older Digital Section page reports a different e-book total; the homepage figures are presented here as GNDU's currently published overview, not a guarantee that every title is available.",
      "Use the Online Public Access Catalogue (OPAC) to search the library catalogue before visiting. Printed journals, backsets, reference materials, and other collections may have different consultation and borrowing rules, so ask library staff about the particular item you need.",
    );
    buildDetailSection(
      "Special collections and departmental libraries",
      "The library identifies separate Rare Books and Manuscripts, Punjabi Reference Library, Theses and Dissertation, Periodical, Reference, and Nanak Singh Centre sections. Official GNDU pages give conflicting totals for rare books and manuscripts, so this guide does not repeat a quantity that cannot be reconciled. The pages reviewed do not establish current consultation or reproduction rules for the rare collection; confirm these with the library before planning access.",
      "The Punjabi Reference Library page lists about 7,903 books for consultation rather than issue or return. That page appears to be an older publication, so confirm that the collection, figure, and access conditions remain current before planning research around it.",
      "GNDU lists 22 departmental libraries in addition to Bhai Gurdas Library. They support subject-specific study close to academic departments, but their holdings, opening arrangements, and access rules are managed locally and should be checked with the relevant department.",
    );
    buildDetailSection(
      "Reading, computer, and orientation facilities",
      "GNDU publishes a 24-hour air-conditioned reading hall with 250 seats, a Digital Lounge with 100 computer systems, and a 50-seat seminar and orientation hall equipped for multimedia presentations. These spaces support individual study, computer-based research, and group orientation; confirm admission to each space and any current operating arrangements with the library.",
      "Library orientation programmes introduce students and research scholars to the catalogue, electronic resources, and library services. The activities page also describes awareness sessions and demonstrations of online resources. Sessions are scheduled by the library, so check its notices or contact staff for current dates.",
    );
    buildDetailSection(
      "Digital access, KOHA, RFID, and OPAC",
      "The library describes KOHA as its Library Management System and publishes RFID-enabled library cards, automated entry and circulation, and biometric entry as part of its library automation. OPAC search points are available in the building, and the online catalogue lets students check bibliographic records before requesting an item. Use your own valid library credentials and follow the current instructions displayed by GNDU.",
      "GNDU's electronic resources include e-books, e-journals, and online databases. The library describes IP-based access on the campus network, DELNET inter-library services, and participation in the Government of India's One Nation One Subscription initiative. Off-campus access, account setup, database coverage, and the ability to place holds or view due dates depend on current subscriptions and account permissions; check the library's live portal for instructions.",
    );
    buildDetailSection(
      "Library membership and consultation",
      "GNDU's undated FAQ says that a non-member may consult material with prior permission from the Librarian. It lists a Rs. 10 daily entry fee and a reference from a department head or college principal; it also describes affiliated-college faculty membership with a refundable Rs. 5,000 security deposit. These are FAQ-listed terms, not confirmed current fees or rules. Contact the library before visiting, applying for membership, or paying any amount.",
      "Borrowing eligibility and access to special collections can depend on student status, membership category, and the material requested. Ask circulation staff about registration, borrowing limits, renewals, reservations, and any requirements for theses, rare materials, or reference-only books.",
    );
    buildDetailSection(
      "Published hours and holidays",
      "Monday–Friday: 9:00 a.m.–9:00 p.m. Saturday, Sunday, and other holidays: 9:00 a.m.–5:00 p.m. The air-conditioned reading hall is published as open 24 hours. GNDU's hours page lists closures on January 26 and August 15; schedules can change for university notices, maintenance, or special circumstances.",
      "Reconfirm the library's opening hours, holiday access, and reading-hall arrangements with Bhai Gurdas Library before travelling, especially during examination periods and university holidays.",
    );
    const library = officialGalleryPhotos.find((photo) => photo.title === "Bhai Gurdas Library");
    const libraryPresentation = "https://docs.google.com/presentation/d/e/2PACX-1vQj5b9xN1HMV42pPs7Z4IokW7V8LamWVMd1ysbBkKM3XEQ9zMVJYC74F692vx4vXQ/pub?start=false&loop=false&delayms=3000";
    const libraryPhotoGallery = createElement("div", "photo-grid route-photo-grid route-detail-gallery library-photo-gallery");
    libraryPhotoGallery.append(
      buildMediaFigure(galleryImageUrl(library), library.alt, "Bhai Gurdas Library — GNDU official photo gallery"),
      buildMediaFigure(
        "https://library.gndu.ac.in/Digital.jpg",
        "GNDU Library Digital Section image showing study seating, automated entry gates, and computer workstations",
        "Digital Lounge and library automation — GNDU Library Digital Section",
      ),
    );
    const librarySlideEmbed = "https://docs.google.com/presentation/d/e/2PACX-1vQj5b9xN1HMV42pPs7Z4IokW7V8LamWVMd1ysbBkKM3XEQ9zMVJYC74F692vx4vXQ/embed?start=false&loop=false&delayms=3000&slide=";
    const slideFigure = createElement("figure", "route-media-figure library-slide-figure");
    const slideFrame = document.createElement("iframe");
    slideFrame.className = "library-slide-frame";
    slideFrame.src = `${librarySlideEmbed}g3684530c1e4_0_5`;
    slideFrame.title = "GNDU Bhai Gurdas Library 18-slide photo presentation";
    slideFrame.loading = "lazy";
    slideFrame.allowFullscreen = true;
    const presentationLink = createElement("a", "button button-primary library-presentation-link", "Open the full 18-slide presentation");
    presentationLink.href = libraryPresentation;
    presentationLink.target = "_blank";
    presentationLink.rel = "noopener noreferrer";
    slideFigure.append(
      presentationLink,
      slideFrame,
      createElement("figcaption", "", "Browse GNDU's 18-slide Bhai Gurdas Library photo presentation, including its labeled Periodical Section (First Floor), Rare Books and Manuscript Section, and other library areas."),
    );
    libraryPhotoGallery.append(slideFigure);
    routeContent.append(libraryPhotoGallery);
    appendPhotoAttribution(routeContent, "GNDU official photo gallery", "https://digital.gndu.ac.in/photo-gallery.aspx");
    appendPhotoAttribution(routeContent, "GNDU Library 'Glimpses of Library' photo presentation", libraryPresentation);
    appendPhotoAttribution(routeContent, "GNDU Library Digital Section", "https://library.gndu.ac.in/digital-section.htm");
    buildDetailSection(
      "Contact Bhai Gurdas Library",
      "Published contact details are library@gndu.ac.in, +91-183-282-3101, and 0183-282-3107. The listed address is Bhai Gurdas Library, Guru Nanak Dev University, Grand Trunk Road, Amritsar-143005, Punjab, India. Confirm current contact numbers and office availability on the official library website before travelling.",
    );
    const sources = createElement("div", "directory-links route-source-links");
    addExternalLink(sources, "Bhai Gurdas Library", "https://library.gndu.ac.in/");
    addExternalLink(sources, "Library hours and holidays", "https://library.gndu.ac.in/library-hours-and-holidays.html");
    addExternalLink(sources, "Library FAQs", "https://library.gndu.ac.in/faqs.html");
    addExternalLink(sources, "Digital Section and automation", "https://library.gndu.ac.in/digital-section.htm");
    addExternalLink(sources, "Library activities and orientation", "https://library.gndu.ac.in/library-activities.html");
    addExternalLink(sources, "Collections", "https://library.gndu.ac.in/collections.html");
    addExternalLink(sources, "Punjabi Reference Library", "https://library.gndu.ac.in/punjabi-reference-library.html");
    addExternalLink(sources, "Glimpses of Library photo presentation", libraryPresentation);
    routeContent.append(sources);
    return true;
  }

  if (id === "sports") {
    buildPageDescription(
      "GNDU's Department of Physical Education describes a campus sports complex spanning indoor and outdoor disciplines, alongside coaching, training camps, and university competition. The facility details below follow GNDU's sports and infrastructure pages. Their facility counts and achievement totals are not dated consistently, so they are presented as published descriptions rather than guaranteed current availability.",
    );
    buildMediaGallery(
      [
        [
          "https://www.gndusports.org/wpimages/hockey-pic10-b.jpg",
          "Hockey Astro Turf at GNDU, shown on the official Sports infrastructure page",
          "Hockey Astro Turf — GNDU Sports infrastructure gallery",
        ],
        [
          "https://www.gndusports.org/wpimages/swiming-pool1.jpg",
          "GNDU swimming pool facility, shown on the official Sports infrastructure page",
          "Swimming Pool — GNDU Sports infrastructure gallery",
        ],
        [
          "https://www.gndusports.org/wpimages/gymnasium-img1.jpg",
          "GNDU Multipurpose Indoor Gymnasium, shown on the official Sports infrastructure page",
          "Multipurpose Indoor Gymnasium — GNDU Sports infrastructure gallery",
        ],
        [
          "https://www.gndusports.org/wpimages/velodrome-img5b.jpg",
          "GNDU Velodrome, shown on the official Sports infrastructure page",
          "Velodrome — GNDU Sports infrastructure gallery",
        ],
        [
          "https://www.gndusports.org/wpimages/shooting-pic8-b.jpg",
          "GNDU 10 Meter Shooting Range, shown on the official Sports infrastructure page",
          "10 Meter Shooting Range — GNDU Sports infrastructure gallery",
        ],
      ],
      "GNDU Sports infrastructure gallery",
      "https://www.gndusports.org/infrastructure.html",
    );
    buildDetailSection(
      "Department of Physical Education",
      "GNDU identifies the Department of Physical Education as responsible for organizing university sports and supporting teams across disciplines. Its official overview describes coaching, special training camps, inter-college tournaments, and participation in inter-university tournaments. Current coaching schedules, team selections, eligibility, and access rules should be confirmed with the Department.",
    );
    buildDetailSection(
      "Hockey Astro Turf Stadium",
      "GNDU's Sports page describes an international-quality astro-turf hockey stadium, and the official infrastructure gallery publishes photographs specifically under the Hockey Astro Turf heading. The venue is part of the university's organized sports facilities; current booking, practice hours, and team access are not stated in the reviewed pages.",
    );
    buildDetailSection(
      "Swimming Pool Stadium",
      "The Sports overview describes an Olympic-standard swimming-pool stadium with separate facilities for training, diving, and competition. GNDU's infrastructure page also publishes a Swimming Pool section. The sources do not specify current public access, coaching hours, session schedules, or operating conditions; confirm these with the Department before visiting.",
    );
    buildDetailSection(
      "Multipurpose Indoor Gymnasium",
      "GNDU's official infrastructure page identifies a Multipurpose Indoor Gymnasium and provides photographs of the facility. The published page does not describe its equipment inventory, sports schedule, access criteria, or opening hours, so those details should be checked with the university.",
    );
    buildDetailSection(
      "Velodrome and Shooting Range",
      "The infrastructure gallery has dedicated sections for a Velodrome and a 10 Meter Shooting Range, with facility photographs under each heading. The cited pages do not publish a current schedule, user eligibility, equipment arrangements, or coaching availability for either facility.",
    );
    buildDetailSection(
      "Tennis and Volleyball Courts",
      "GNDU's infrastructure page lists one cemented and one grassy tennis court. It lists two cinder and two grassy volleyball courts. These are the counts published on the official page, which does not state when the inventory was last updated; verify court availability and access with the Department.",
    );
    buildDetailSection(
      "Basketball, Football, and Cricket",
      "The same page lists one cemented and two grassy basketball courts, two football grounds, and two cricket pitches. It does not publish surface specifications for the grounds and pitches, current maintenance status, or student booking procedures.",
    );
    buildDetailSection(
      "Athletics Facilities",
      "Athletics is a named section in GNDU's infrastructure gallery, which includes athletics photographs. The reviewed source does not specify track dimensions, event equipment, training schedules, or which athletics facilities are currently available; ask the Department for current details.",
    );
    buildDetailSection(
      "Archery and Judo",
      "GNDU's infrastructure page includes separate Archery and Judo sections with photographs. Their listing confirms that these disciplines are represented in the university's published sports infrastructure, but the page does not give equipment, coaching, or participation details.",
    );
    buildDetailSection(
      "Table Tennis, Carrom, and Handball",
      "The official infrastructure page lists Table Tennis, Carrom, and Handball under its sports facilities. The main Sports overview also names handball among the playground sports. Current venue details, equipment, and activity schedules are not published in the pages reviewed.",
    );
    buildDetailSection(
      "Other listed sports",
      "GNDU's Sports overview also names softball, kho-kho, and kabaddi among the sports with playground facilities. Wrestling and weightlifting are not individually described in the Sports overview or infrastructure inventory reviewed for this page; this guide therefore cannot confirm a dedicated current facility or coaching arrangement for those disciplines.",
    );
    buildDetailSection(
      "Training, tournaments, and athlete support",
      "The Department's overview describes coaching and special training camps, inter-college tournaments, and participation in inter-university competitions. It also refers to a separate Sports Hostel and NSO scholarships for promising players. The published pages do not establish current scholarship numbers or criteria, hostel capacity or vacancies, or current training schedules; check the Department and hostel office for session-specific information.",
    );
    buildDetailSection(
      "Achievements and awards",
      "GNDU's official Sports pages describe the University's history with the Maulana Abul Kalam Azad Trophy, Dr. B.L. Gupta General Championship Trophy, Osmania University Platinum Jubilee Trophy, and Kridamaharshi Shri Meghnath Negeskhar Trophy. The pages publish conflicting trophy totals and do not consistently date those figures, so this guide does not present a numerical tally as current. Check the latest university announcements for dated results and awards.",
    );
    addExternalLink(routeContent, "GNDU sports facilities", "https://digital.gndu.ac.in/Sports.aspx");
    addExternalLink(routeContent, "GNDU Sports infrastructure and photographs", "https://www.gndusports.org/infrastructure.html");
    addExternalLink(routeContent, "GNDU Department of Physical Education", "https://online.gndu.ac.in/department-of-physical-education.aspx");
    addExternalLink(routeContent, "GNDU Sports achievements and awards", "https://www.gndusports.org/sports-achievements.html");
    addExternalLink(routeContent, "GNDU Prospectus 2025–26", "https://iqac.gndu.ac.in/Pdf/prospectus/Prospectus2025_26.pdf");
    return true;
  }

  if (id === "student-life") {
    buildPageDescription("Student life at GNDU extends beyond classes through student clubs, cultural and sports activities, and university support services. The summaries below are based on GNDU pages; event schedules, club activity, and participation arrangements can change.");
    buildDetailSection(
      "Student clubs and interests",
      "GNDU's Student Activity Clubs page lists Dance, Drama, Fine Arts, Fitness, Literary, Photography, Science, and Cycling clubs. Their published descriptions include creative practice, fitness, student-led performances, science activities, and cycling. Check the official club page and the Office of the Dean Students' Welfare for current incharges, mentors, and participation details.",
    );
    buildDetailSection(
      "Festivals and university activities",
      "The Department of Youth Welfare describes youth festivals, leadership and hiking or trekking camps, tours, coaching camps, seminars, workshops, and cultural programmes. These are programme types described by the department, not announcements of current dates or open registration.",
    );
    buildMediaGallery(getOfficialPhotoTriples([
      "Hexi Bicycle Stand",
      "Student riding on Bicycle",
      "Students and Staff on Bicycle",
    ]));
    const cards = Array.from(source.querySelectorAll(".resource-card"));
    const grid = buildGrid();
    cards.forEach((card, index) => {
      const title = getText(card.querySelector("summary h4"));
      const paragraph = getText(card.querySelector("p"));
      const target = index === 0 ? "student-activities" : "student-support";
      grid.append(createCard(title, paragraph, "facility", target, "Student resource"));
    });
    addExternalLink(routeContent, "Student Facilitation Centre", "https://digital.gndu.ac.in/StudentFacilitationCenter.aspx");
    addExternalLink(routeContent, "Dean Students’ Welfare", "https://digital.gndu.ac.in/dean-students-welfare.aspx");
    addExternalLink(routeContent, "Department of Youth Welfare", "https://digital.gndu.ac.in/YouthWelfareDepartment.aspx");
    return true;
  }

  return true;
}

function renderMap() {
  const source = getSource("#campus-map");
  buildPageHeader("Campus Map", "campus-life", {}, "Campus Life");
  buildPageDescription("Use the interactive map to find GNDU Main Campus, Amritsar, and plan travel to the university. A verified building-level plan was not available in the sources reviewed, so this guide does not assign campus buildings to map pins or infer walking routes.");
  const frame = document.createElement("iframe");
  frame.className = "route-map";
  frame.title = "Interactive map search for Guru Nanak Dev University, Amritsar";
  frame.loading = "lazy";
  frame.referrerPolicy = "no-referrer-when-downgrade";
  frame.allowFullscreen = true;
  frame.src = "https://www.google.com/maps?q=Guru%20Nanak%20Dev%20University%2C%20Amritsar&output=embed";
  routeContent.append(frame);
  buildDetailSection(
    "Using the map and campus photographs",
    "The embedded map is a general map search for the university, not an official indoor or building directory. The photographs below retain GNDU's captions and provide visual context only; they do not indicate the location of a building within campus.",
  );
  buildMediaGallery(getOfficialPhotoTriples(["Main Entrance", "Administration Block", "Bhai Gurdas Library"]));
  buildSectionHeading("Explore verified facility information");
  const grid = buildGrid();
  [
    ["Bhai Gurdas Library", "Library facilities, services, and catalogue details.", "library"],
    ["Hostels", "GNDU-published hostel descriptions and verified hostel identities.", "facility", "hostels"],
    ["Health Services", "University Health Centre services described by GNDU.", "facility", "health-services"],
    ["Sports facilities", "GNDU sports complex and facilities information.", "sports"],
    ["Campus photographs", "Official gallery photographs with GNDU captions.", "photo-gallery"],
  ].forEach(([title, description, page, item]) => {
    grid.append(createCard(title, description, page, item, "Campus information"));
  });
  appendSourceLinks(routeContent, source);
}

function renderGallery() {
  buildPageHeader("Photo Gallery", "campus-life", {}, "Campus Life");
  buildPageDescription("Photographs below are from GNDU’s official photo gallery and retain its captions. Select an image to open the larger on-page viewer. Captions identify what GNDU labels the image; they do not establish an unlabelled building or hostel number.");
  const imageGroups = [...new Set(officialGalleryPhotos.flatMap((photo) => photo.groups))];
  imageGroups.forEach((groupName) => {
    buildSectionHeading(groupName);
    const grid = buildGrid("photo-grid route-photo-grid");
    officialGalleryPhotos
      .filter((photo) => photo.groups.includes(groupName))
      .forEach((photo) => {
        grid.append(buildMediaFigure(galleryImageUrl(photo), photo.alt, photo.title));
      });
  });
  const sources = createElement("div", "directory-links route-source-links");
  addExternalLink(sources, "GNDU official photo gallery", "https://digital.gndu.ac.in/photo-gallery.aspx");
  routeContent.append(sources);
}

function renderAbout() {
  buildPageHeader("About Guru Nanak Dev University", "", null);
  buildPageDescription("A student-friendly introduction to GNDU based on information published by the University. Programme availability, campus facilities, and current notices can change; use the linked official pages to confirm details.");
  buildDetailSection(
    "Introduction to GNDU",
    "Guru Nanak Dev University (GNDU) is a public university in Amritsar, Punjab. The University describes its academic purpose in terms of knowledge, intellectual inquiry, ethical leadership, inclusion, service, and social transformation.",
  );
  buildDetailSection(
    "History and establishment",
    "GNDU was established on 24 November 1969 under the Guru Nanak Dev University Act, 1969 (Punjab Act No. 21 of 1969). The University is named after Guru Nanak Dev Ji. Consult GNDU's official website for the current institutional record and university information.",
  );
  buildDetailSection(
    "Vision and mission",
    "GNDU's official welcome message emphasizes inclusive learning, service, enlightenment, academic rigour, humanistic values, and preparing responsible citizens. This summary paraphrases that message rather than presenting a separate, unverified policy statement.",
  );
  buildDetailSection(
    "Academic structure, faculties, and departments",
    "The University groups academic units under faculties and lists departments, schools, and centres in its official directory. The guide's faculties-and-departments directory is a navigational overview; consult GNDU's listing for current unit names and programme availability.",
  );
  buildDetailSection(
    "Campuses and academic centres",
    "GNDU's current university profile describes a residential and affiliating university, with a Main Campus in Amritsar, regional campuses, and affiliated and constituent colleges. The profile also publishes campus-size and enrolment figures; these are time-sensitive institutional totals and should be checked on the current GNDU profile rather than treated as fixed facts.",
    "Admissions distinguish regular Main Campus programmes from constituent-college and Open and Distance Learning routes. Programme availability and application steps depend on the campus or institution, so confirm the correct listing before applying. GNDU's official department directory links its academic units and centres.",
  );
  buildDetailSection(
    "Research and academic activities",
    "GNDU departments describe discipline-specific teaching and research. The Department of Computer Science, for example, reports work in software engineering, distributed and parallel computing, databases and big-data analytics, machine learning, and image processing. The university profile also describes shared research facilities, centres, and support for research scholars.",
    "Research programmes, laboratories, supervision, and current opportunities depend on the academic unit and admission session. Consult the department and the official research or admissions notice for current eligibility and availability.",
  );
  buildDetailSection(
    "Library and campus facilities",
    "Bhai Gurdas Library describes study spaces, digital resources, an online catalogue, collections, and inter-library services. GNDU also publishes information about health services, hostels, sports, and student support. Access and availability should be confirmed with the relevant official unit.",
  );
  buildDetailSection(
    "Student life and engagement",
    "GNDU’s student-welfare pages describe sports events, youth festivals, hobby and drama clubs, subject-related societies, seminars, workshops, and cultural programmes. Schedules and participation arrangements may change; check the university pages for current details.",
  );
  buildDetailSection(
    "Student support and services",
    "GNDU's Students Facilitation Centre is a first point of contact for prospective and admitted students. Its listed support includes admissions and course enquiries, fees and refunds, examinations, results, transcripts, hostels, and student activities.",
  );

  const entrance = officialGalleryPhotos.find((photo) => photo.title === "Main Entrance");
  const library = officialGalleryPhotos.find((photo) => photo.title === "Bhai Gurdas Library");
  const sports = officialGalleryPhotos.find((photo) => photo.title === "Hockey Stadium");
  buildMediaGallery([
    [galleryImageUrl(entrance), entrance.alt, "Main Entrance — GNDU official photo gallery"],
    [galleryImageUrl(library), library.alt, "Bhai Gurdas Library — GNDU official photo gallery"],
    [galleryImageUrl(sports), sports.alt, "Hockey Stadium — GNDU official photo gallery"],
  ]);
  const sources = createElement("div", "directory-links route-source-links");
  addExternalLink(sources, "GNDU official website", "https://digital.gndu.ac.in/");
  addExternalLink(sources, "GNDU official university profile", "https://digital.gndu.ac.in/about-university.aspx");
  addExternalLink(sources, "Official faculties and departments directory", "https://online.gndu.ac.in/Departments.aspx");
  addExternalLink(sources, "Main Campus admissions", "https://www.gnduadmissions.org/CampusAdmissions/");
  addExternalLink(sources, "Constituent-college admissions", "https://www.gnduadmissions.org/CampusAdmissions/DefaultConstituentColleges.aspx");
  addExternalLink(sources, "Bhai Gurdas Library", "https://library.gndu.ac.in/");
  addExternalLink(sources, "Student Facilitation Centre", "https://digital.gndu.ac.in/StudentFacilitationCenter.aspx");
  addExternalLink(sources, "Dean Students’ Welfare", "https://digital.gndu.ac.in/dean-students-welfare.aspx");
  addExternalLink(sources, "Department of Youth Welfare", "https://digital.gndu.ac.in/YouthWelfareDepartment.aspx");
  routeContent.append(sources);
}

function renderContact() {
  const source = admissionTopics.find((topic) => topic.id === "student-facilitation")?.source;
  buildPageHeader("Contact and Enquiries", "admissions", {}, "Admissions");
  buildPageDescription("GNDU handles admissions, academic, examination, hostel, and student-support enquiries through different offices. Use the directory below to identify a suitable starting point, then confirm current contact details with the official university page before calling or emailing.");
  const body = createElement("div", "route-detail-content");
  appendClonedContent(body, source);
  routeContent.append(body);
  buildDetailSection(
    "Choose the relevant office",
    "Questions about a Main Campus application, a constituent college, Open and Distance Learning, examinations, registration, or student services may have different contact routes. GNDU's contact directory lists separate offices for campus admission, private admission, registration and migration, examination branches, certificates, placements, and the Students Facilitation Centre.",
    "Use the office that handles your enquiry rather than sending personal or application details to an unrelated address. Include only the information needed to identify your question, and verify any request for documents or payment against the official notice.",
  );
  buildDetailSection(
    "Campus landmarks",
    "The photographs below use GNDU's official captions to identify campus landmarks. They provide campus context only and do not identify a specific enquiry counter or administrative office.",
  );
  buildMediaGallery(getOfficialPhotoTriples(["Main Entrance", "Administration Block"]));
  addExternalLink(routeContent, "GNDU official contact directory", "https://digital.gndu.ac.in/ContactUs.aspx");
  addExternalLink(routeContent, "GNDU Main Campus admissions contacts", "https://www.gnduadmissions.org/CampusAdmissions/ContactUs.aspx");
  routeContent.append(createInternalLink("facility", "student-support", "Student Support", "text-link"));
}

function renderPlacements() {
  buildPageHeader("Placements", "", null);
  buildPageDescription("GNDU's placement portal describes a centralized placement system, campus placement activity, internships, and industrial training. This guide summarizes those published areas without promising a placement, internship, particular recruiter, or salary outcome.");
  buildDetailSection(
    "Placement and internship information",
    "GNDU's official placement portal describes a centralized placement system, campus placement activity, and regular internships and industrial trainings. These are service areas identified by the university, not a guarantee of placement or internship for an individual student.",
    "The portal is the authoritative place to check current registration steps, employer notices, eligibility, interview schedules, and any programme or department-specific instructions. Ask your department which notices apply to your course and year.",
  );
  buildDetailSection(
    "How to check current opportunities",
    "Use the official placement portal and department notices for current schedules, eligibility, application requirements, and employer information. Read the reporting period and scope of any statistics before comparing outcomes across courses or years.",
    "The placement website displays salary and placement highlights, but the reviewed page does not clearly establish a reporting period for each measure. This guide therefore does not present those figures as current outcomes or make comparisons between programmes.",
  );
  buildDetailSection(
    "Contact and verification",
    "The GNDU contact directory lists a Placement Department contact. Confirm that the published number and email remain current on the official contact page before sharing personal information or application documents. No placement-specific photograph was verified, so this page does not use a generic campus image.",
  );
  addExternalLink(routeContent, "GNDU official placement portal", "https://eservices3.gndu.ac.in/placement/homepage.aspx");
  addExternalLink(routeContent, "GNDU official contact directory", "https://digital.gndu.ac.in/ContactUs.aspx");
  const related = buildGrid();
  related.append(
    createCard("Courses", "Review programme information and confirm current availability.", "courses", "", "Related page"),
    createCard("Student Life", "Explore student clubs, activities, and support information.", "student-life", "", "Related page"),
    createCard("Contact and Enquiries", "Find GNDU's published enquiry routes.", "contact", "", "Related page"),
  );
}

function renderScholarships() {
  buildPageHeader("Scholarships", "admissions", {}, "Admissions");
  buildPageDescription("Scholarship schemes, eligibility, award amounts, and deadlines depend on the scheme and admission session. This guide has not verified any currently open GNDU scholarship or universal award details.");
  buildDetailSection(
    "How to check current opportunities",
    "Check current GNDU notices and the relevant scholarship authority for scheme-specific eligibility, required documents, application steps, deadlines, and renewal rules. Some schemes are administered outside the University, so verify which portal or office receives the application.",
    "Confirm that a notice applies to your course, applicant category, institution, and session before applying. Keep the notice and any acknowledgement for your records, and use only contact channels named by the responsible authority.",
  );
  buildDetailSection(
    "Fees and financial support",
    "Do not rely on a general fee or scholarship amount: GNDU fees and financial-support rules may vary by programme, category, and session. Read the applicable fee schedule and scheme rules together so that fee payment and scholarship eligibility are not confused.",
    "Ask the Student Facilitation Centre or the office named in the current official notice if the published instructions are unclear. This guide does not claim that a particular scheme is currently open or that a student will receive an award.",
  );
  addExternalLink(routeContent, "GNDU official website and notices", "https://digital.gndu.ac.in/");
  addExternalLink(routeContent, "GNDU Main Campus admissions and prospectus", "https://www.gnduadmissions.org/CampusAdmissions/");
  addExternalLink(routeContent, "Student Facilitation Centre", "https://digital.gndu.ac.in/StudentFacilitationCenter.aspx");
  const related = buildGrid();
  related.append(
    createCard("Admissions", "Check the correct route and current session notices.", "admissions", "", "Related page"),
    createCard("Student Support", "Find GNDU's listed enquiry and facilitation services.", "facility", "student-support", "Related page"),
  );
}

function renderExamsResults() {
  buildPageHeader("Exams and Results", "student-support", {}, "Student Support");
  buildPageDescription("Examination schedules, results, counselling, and merit lists are programme- and session-specific. Confirm the course and session on the official GNDU pages before acting on a notice.");
  buildDetailSection(
    "Schedules and results",
    "GNDU admission pages publish counselling schedules and results for specific programmes. Check the programme name, session, campus, round, and publication or revision date on the notice before relying on a schedule or list.",
    "A result page may retain records from earlier sessions. A previous date, merit list, or counselling instruction should not be treated as current merely because it remains accessible.",
  );
  buildDetailSection(
    "Examination support",
    "GNDU lists examinations, results, and transcripts among the enquiries supported by its Students Facilitation Centre. For a course-specific issue, identify the relevant examination branch and follow the instructions in the official notice.",
    "Before contacting an office, note the course, campus, session, and examination or result in question. Use GNDU's current contact directory for the correct branch and current contact channels.",
  );
  addExternalLink(routeContent, "GNDU counselling schedules and results", "https://www.gnduadmissions.org/CampusAdmissions/CounsellingSchedule.aspx");
  addExternalLink(routeContent, "GNDU Main Campus admissions notices", "https://www.gnduadmissions.org/CampusAdmissions/");
  addExternalLink(routeContent, "Student Facilitation Centre", "https://digital.gndu.ac.in/StudentFacilitationCenter.aspx");
  const related = buildGrid();
  related.append(
    createCard("Courses", "Review GNDU programme information and confirm the current offering.", "courses", "", "Related page"),
    createCard("Student Support", "Find the university's listed support route for examination enquiries.", "facility", "student-support", "Related page"),
  );
}

function renderFaqs() {
  buildPageHeader("Frequently Asked Questions", "", null);
  buildPageDescription("Quick answers based on verified information already included in this guide. Current prospectuses, notices, and GNDU offices remain authoritative.");
  [
    ["How do I apply to GNDU?", "First identify whether your programme is offered through Main Campus, a constituent college, or Open and Distance Learning; the application route can differ. Then use the current session prospectus and notices for course-specific eligibility, documents, fees, and counselling steps. Do not rely on an old process guide for current dates."],
    ["Where can I check courses and eligibility?", "Start with GNDU's official programme listing, then match the exact programme and offering institution to its session-specific prospectus. Check the qualifying examination, subject prerequisites, category criteria, and selection method; a programme mentioned in a department page is not by itself proof of a current admission opening."],
    ["What are the fees or scholarship deadlines?", "Fees and financial support are programme-, category-, and session-specific. Read the current fee schedule and the separate scholarship notice, including the responsible authority and deadline; this guide does not publish an unverified universal amount or claim that a scheme is open."],
    ["Where do I find exam schedules and results?", "Use GNDU's official schedules, counselling, and results pages and check the course, campus, session, and any revised notice. Older schedules and result lists can remain online, so confirm the date and applicable round before attending or drawing a conclusion."],
    ["How can I learn about hostels and campus facilities?", "Open the relevant guide for GNDU-published information about the Boys' Hostel complex, Mata Nanaki Girls Hostel III, Sports Hostel, library, health services, and sports. Published descriptions do not establish current vacancies or individual access; confirm arrangements with the office responsible for that facility."],
    ["Who can answer a university enquiry?", "GNDU describes the Students Facilitation Centre as a first point of contact for prospective and admitted students. For programme decisions, examination matters, hostel allotment, or a placement notice, the responsible academic unit or branch may be more appropriate; use the official contact directory to find the current route."],
  ].forEach(([question, answer]) => buildDetailSection(question, answer));
  const related = buildGrid();
  related.append(
    createCard("Admissions", "See official application routes and session-specific guidance.", "admissions", "", "Related page"),
    createCard("Exams and Results", "Find official schedules, results, and examination enquiry guidance.", "exams-results", "", "Related page"),
    createCard("Student Support", "Open GNDU's student facilitation and support information.", "facility", "student-support", "Related page"),
  );
}

function renderEvents() {
  buildPageHeader("Events", "", null);
  buildPageDescription("GNDU's student-welfare pages describe youth festivals, camps, seminars, workshops, cultural programmes, sports, and student clubs. The guide combines these verified activity areas with photographs that GNDU itself labels as event or club activity images. It does not claim that undated photographs depict a current event, and it does not list unverified dates, venues, registration details, or announcements.");

  const filters = createElement("div", "event-filters");
  filters.setAttribute("aria-label", "Filter GNDU activity categories");
  const grid = buildGrid("route-card-grid event-programme-grid");
  const categories = [...new Set(verifiedActivityTypes.map((activity) => activity.category))];
  const filterButton = (label, category) => {
    const button = createElement("button", "event-filter", label);
    button.type = "button";
    button.setAttribute("aria-pressed", String(category === ""));
    button.addEventListener("click", () => {
      filters.querySelectorAll(".event-filter").forEach((filter) => {
        filter.setAttribute("aria-pressed", String(filter === button));
      });
      grid.querySelectorAll(".route-card").forEach((card) => {
        card.hidden = category !== "" && card.dataset.category !== category;
      });
      routeContent.querySelectorAll(".event-photo-group").forEach((group) => {
        group.hidden = category !== "" && group.dataset.category !== category;
      });
    });
    return button;
  };
  filters.append(filterButton("All activities", ""));
  categories.forEach((category) => filters.append(filterButton(category, category)));
  routeContent.insertBefore(filters, grid);
  verifiedActivityTypes.forEach((activity) => {
    const card = createElement("article", "route-card");
    card.dataset.category = activity.category;
    card.append(
      createElement("span", "route-card-label", "GNDU activity type"),
      createElement("h2", "", activity.title),
      createElement("p", "", activity.description),
    );
    grid.append(card);
  });
  buildSectionHeading("GNDU activity photographs");
  const inaugurationSection = createElement("section", "event-photo-group");
  inaugurationSection.dataset.category = "University event";
  inaugurationSection.append(
    createElement("h2", "", "University inauguration"),
    createElement("p", "", "This university-photo-gallery image is captioned 'Inauguration Day of University'. No date or additional event details are supplied with the caption."),
    createMediaGallery(getOfficialPhotoTriples(["Inauguration Day of University"])),
  );
  appendPhotoAttribution(inaugurationSection, "GNDU official photo gallery", "https://digital.gndu.ac.in/photo-gallery.aspx");
  routeContent.append(inaugurationSection);

  officialActivityPhotoGroups.forEach((group) => {
    const section = createElement("section", "event-photo-group");
    section.dataset.category = group.category;
    section.append(
      createElement("h2", "", group.title),
      createElement("p", "", group.note),
    );
    const gallery = createElement("div", "photo-grid route-photo-grid route-detail-gallery");
    group.photos.forEach(([file, caption]) => {
      const figure = buildMediaFigure(
        `https://digital.gndu.ac.in/images/studentclubs/${file}`,
        `${caption} — GNDU official activity gallery`,
        caption,
      );
      gallery.append(figure);
    });
    section.append(gallery);
    appendPhotoAttribution(section, group.sourceLabel, group.sourceUrl);
    routeContent.append(section);
  });
  const sources = createElement("div", "directory-links route-source-links");
  addExternalLink(sources, "GNDU Dean Students’ Welfare", "https://digital.gndu.ac.in/dean-students-welfare.aspx");
  addExternalLink(sources, "GNDU Department of Youth Welfare", "https://digital.gndu.ac.in/YouthWelfareDepartment.aspx");
  addExternalLink(sources, "GNDU Student Activity Clubs", "https://digital.gndu.ac.in/StudentActivityClubs.aspx");
  routeContent.append(sources);
}

function renderNotFound() {
  buildPageHeader("Page not found", "", null);
  buildPageDescription("This guide page could not be found. Return to Home or choose a section from the navigation.");
  routeContent.append(createInternalLink("home", "", "Return to Home", "button button-primary"));
}

function openPhotoViewer(link) {
  let dialog = document.querySelector(".photo-viewer");
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.className = "photo-viewer";
    dialog.setAttribute("aria-label", "GNDU photo viewer");
    const close = createElement("button", "photo-viewer-close", "Close");
    close.type = "button";
    close.addEventListener("click", () => dialog.close());
    const image = document.createElement("img");
    const caption = createElement("p", "photo-viewer-caption");
    dialog.append(close, image, caption);
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        dialog.close();
      }
    });
    document.body.append(dialog);
  }
  const image = dialog.querySelector("img");
  image.src = link.href;
  image.alt = link.querySelector("img")?.alt || getText(link);
  dialog.querySelector(".photo-viewer-caption").textContent =
    getText(link.closest("figure")?.querySelector("figcaption"));
  dialog.showModal();
}

function renderCurrentRoute() {
  const params = new URLSearchParams(window.location.search);
  const pathRoute = canonicalRoutesByPath.get(window.location.pathname);
  const page = params.get("page") || pathRoute?.page || "home";
  const item = params.get("item") || pathRoute?.item || "";
  routeContent.replaceChildren();

  if (page === "home") {
    renderHome();
    return;
  }

  const homePhotoShowcase = document.querySelector("#home-photo-showcase");
  if (homePhotoShowcase) {
    homePhotoShowcase.hidden = true;
  }
  document.body.classList.remove("guide-home-active");
  document.body.classList.add("guide-route-active");
  routeContent.hidden = false;
  let found = true;
  switch (page) {
    case "admissions":
      renderAdmissions();
      break;
    case "admission-topic":
      found = renderAdmissionTopic(item);
      break;
    case "faculties":
      renderFaculties();
      break;
    case "faculty":
      found = renderFaculty(item);
      break;
    case "department":
      found = renderDepartment(item);
      break;
    case "courses":
      renderCourses();
      break;
    case "course-category":
      found = renderCourseCategory(item);
      break;
    case "course":
      found = renderCourse(item);
      break;
    case "canteens":
      renderCanteens();
      break;
    case "canteen":
      found = renderCanteen(item);
      break;
    case "hostel":
      found = renderHostelDetail(item);
      break;
    case "campus-life":
      renderCampusLife();
      break;
    case "facility":
      found = renderFacility(item);
      break;
    case "campus-map":
      renderMap();
      break;
    case "library":
    case "sports":
    case "student-life":
      found = renderResourcePage(page);
      break;
    case "photo-gallery":
      renderGallery();
      break;
    case "about":
      renderAbout();
      break;
    case "events":
      renderEvents();
      break;
    case "placements":
      renderPlacements();
      break;
    case "contact":
      renderContact();
      break;
    case "scholarships":
      renderScholarships();
      break;
    case "exams-results":
      renderExamsResults();
      break;
    case "faqs":
      renderFaqs();
      break;
    default:
      found = false;
  }

  if (!found) {
    routeContent.replaceChildren();
    renderNotFound();
    document.title = "Page not found | GNDU Freshers Guide";
  } else {
    const title = routeContent.querySelector(".route-title");
    document.title = `${getText(title)} | GNDU Freshers Guide`;
    title?.focus({ preventScroll: true });
  }
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  const route = internalHashRoutes[link.getAttribute("href")];
  if (route) {
    link.href = getRouteUrl(route[0], route[1]);
    link.dataset.guideRoute = "";
  }
});

document.querySelectorAll('a[href^="/"]').forEach((link) => {
  if (canonicalRoutesByPath.has(link.pathname)) {
    link.dataset.guideRoute = "";
  }
});

const departmentsFeature = Array.from(document.querySelectorAll(".feature-card")).find(
  (card) => getText(card.querySelector("h3")) === "Departments",
);
if (departmentsFeature) {
  departmentsFeature.append(createInternalLink("courses", "", "Explore courses", "text-link"));
}

document.addEventListener("click", (event) => {
  const photoLink = event.target instanceof Element
    ? event.target.closest(".photo-grid a:not(.library-presentation-link)")
    : null;
  if (photoLink) {
    event.preventDefault();
    openPhotoViewer(photoLink);
    return;
  }
  const routeLink = event.target instanceof Element ? event.target.closest("a[data-guide-route]") : null;
  if (!routeLink || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }
  event.preventDefault();
  window.history.pushState({}, "", routeLink.href);
  renderCurrentRoute();
  window.scrollTo(0, 0);
});

window.addEventListener("popstate", () => {
  renderCurrentRoute();
  window.scrollTo(0, 0);
});

renderCurrentRoute();
