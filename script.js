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
};

const getText = (element) => element?.textContent.trim().replace(/\s+/g, " ") || "";
const getSource = (selector) => document.querySelector(selector);
const getRouteUrl = (page, item) => {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
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
const facultyRecords = collectFaculties();
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

const sampleEvents = [
  {
    title: "Campus Cultural Showcase",
    category: "Cultural Events",
    description: "A sample listing for a student-led showcase of performances and creative work.",
    image: "photo-gallery-3.jpg",
    alt: "Illustrative GNDU official gallery photograph captioned Inauguration Day of University",
  },
  {
    title: "Ideas in Technology",
    category: "Academic & Technical Events",
    description: "A sample listing for a student-focused exchange on technology and innovation.",
    image: "photo-gallery-17s.jpg",
    alt: "Illustrative GNDU official gallery photograph of the Lecture Theatre Complex",
  },
  {
    title: "Inter-College Sports Meet",
    category: "Sports",
    description: "A sample listing for a friendly sporting meet and student participation.",
    image: "photo-gallery-13s.jpg",
    alt: "Illustrative GNDU official gallery photograph of the Hockey Stadium",
  },
  {
    title: "Skills Lab Workshop",
    category: "Workshops",
    description: "A sample listing for a practical, peer-supported learning session.",
    image: "photo-gallery-15s.jpg",
    alt: "Illustrative GNDU official gallery photograph of Bhai Gurdas Library",
  },
  {
    title: "Research & Ideas Seminar",
    category: "Seminars",
    description: "A sample listing for a discussion connecting students with academic ideas.",
    image: "photo-gallery-17s.jpg",
    alt: "Illustrative GNDU official gallery photograph of the Lecture Theatre Complex",
  },
  {
    title: "Student Clubs Meet-up",
    category: "Student Activities",
    description: "A sample listing for students to explore activities, societies, and shared interests.",
    image: "studentsandstaffathexi.jpg",
    alt: "Illustrative GNDU official gallery photograph captioned Students and Staff on Bicycle",
  },
].map((event) => ({
  ...event,
  image: `https://digital.gndu.ac.in/images/photogallery/${event.image}`,
}));

function createEventCard(event) {
  const card = createElement("article", "event-card");
  card.dataset.category = event.category;

  const image = document.createElement("img");
  image.className = "event-card-image";
  image.src = event.image;
  image.alt = event.alt;
  image.loading = "lazy";

  const content = createElement("div", "event-card-content");
  const topline = createElement("div", "event-card-topline");
  topline.append(createElement("span", "event-category", event.category));
  content.append(
    topline,
    createElement("h3", "", event.title),
    createElement("p", "event-card-description", event.description),
  );

  const facts = createElement("dl", "event-facts");
  [
    ["Date", "To be announced"],
    ["Time", "To be announced"],
    ["Venue", "To be confirmed by GNDU"],
    ["Registration", "Not announced"],
  ].forEach(([label, value]) => {
    const row = createElement("div");
    row.append(createElement("dt", "", label), createElement("dd", "", value));
    facts.append(row);
  });
  content.append(facts);
  if (event.detailsUrl) {
    const details = createElement("a", "text-link", "Official event details →");
    details.href = event.detailsUrl;
    details.target = "_blank";
    details.rel = "noopener noreferrer";
    content.append(details);
  }
  card.append(image, content);
  return card;
}

const eventPreviewGrid = document.querySelector("#home-events-grid");
if (eventPreviewGrid) {
  sampleEvents.slice(0, 3).forEach((event) => eventPreviewGrid.append(createEventCard(event)));
}

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

function buildMediaGallery(images) {
  const gallery = createElement("div", "photo-grid route-detail-gallery");
  images.forEach(([imageUrl, alt, caption]) => {
    gallery.append(buildMediaFigure(imageUrl, alt, caption));
  });
  routeContent.append(gallery);
}

function buildDetailSection(title, text) {
  const section = createElement("section", "route-detail-section");
  section.append(createElement("h2", "", title), createElement("p", "", text));
  routeContent.append(section);
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
}

function renderAdmissions() {
  const source = getSource("#admissions");
  buildPageHeader("Admissions", "", null);
  buildPageDescription(getText(source?.querySelector(".summary-description")));
  const grid = buildGrid();
  admissionTopics.forEach((topic) => {
    const paragraph = topic.source.querySelector("p");
    grid.append(createCard(topic.title, getText(paragraph), "admission-topic", topic.id, "Admission guidance"));
  });
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
  buildPageDescription(getText(source?.querySelector(".summary-description")));
  const grid = buildGrid();
  facultyRecords.forEach((faculty) => {
    grid.append(createCard(
      faculty.title,
      `${faculty.description} ${faculty.departments.length} listed academic units.`,
      "faculty",
      faculty.id,
      "Faculty",
    ));
  });
  appendSourceLinks(routeContent, source);
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
  const related = courseRecords.filter((course) =>
    faculty.departments.some((department) => course.facts.toLowerCase().includes(department.name.toLowerCase())),
  );
  if (related.length) {
    buildSectionHeading("Related programmes listed in this guide");
    const programGrid = buildGrid();
    related.forEach((course) => programGrid.append(createCard(course.name, course.facts, "course", course.slug, course.category)));
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
  const related = courseRecords.filter((course) =>
    course.facts.toLowerCase().includes(department.name.toLowerCase()),
  );
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
  buildPageDescription(getText(source?.querySelector(".summary-description")));
  const grid = buildGrid();
  courseCategories.forEach((category) => {
    grid.append(createCard(
      category.title,
      category.note || `${category.courses.length} programme${category.courses.length === 1 ? "" : "s"} listed. For current availability, check the official GNDU admission portal.`,
      "course-category",
      category.slug,
      "Programme category",
    ));
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
    ["Related faculty or department", relatedUnit || "Please check the official GNDU website for details."],
    ["Admission process", course.provider?.includes("not identified")
      ? "GNDU's reviewed source does not identify the current institution offering this programme. Check the constituent-college and campus listings before applying; this guide does not claim Main Campus availability."
      : "Admission steps and current availability vary by programme and session. Confirm the selected campus or college, then check its current GNDU course listing, prospectus, and admission notices."],
    ["Syllabus or curriculum", "Please select the relevant session, campus, and course in the official GNDU syllabus selector."],
  ]);
  addExternalLink(routeContent, "Official programme / department information", course.officialUrl);
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
  const source = getSource("#canteens");
  buildPageHeader("Canteens", "", null);
  buildPageDescription(getText(source?.querySelector(".summary-description")));
  const grid = buildGrid();
  canteenRecords.forEach((canteen) => {
    grid.append(createCard(canteen.title, getText(canteen.source.querySelector("p")), "canteen", canteen.id, "Campus dining"));
  });
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
      "Location and verified details",
      "GNDU reports two canteens inside the Boys’ Hostel, available to hostel residents from 6:00 a.m. to 11:00 p.m. The official page says products approved by the Dean, Students’ Welfare are served at fixed prices. It does not publish individual canteen names, separate locations within the complex, current menus, or item prices. No specific canteen photograph was identified in the official gallery.",
    );
  } else {
    buildDetailSection(
      "Information not verified",
      "The official sources reviewed do not identify other campus canteens by name or provide verified locations, menus, prices, or opening hours. No unrelated photograph is used.",
    );
  }
  return true;
}

function renderHostelDetail(id) {
  const hostelPages = {
    "boys-hostel": "Boys’ Hostel (five-block complex)",
    "girls-hostel-iii": "Mata Nanaki Girls Hostel III",
    "sports-hostel": "Sports Hostel",
    "other-hostels": "Other hostel names and blocks",
  };
  const title = hostelPages[id];
  if (!title) {
    return false;
  }
  buildPageHeader(title, "facility", { item: "hostels" }, "Hostels");

  if (id === "boys-hostel") {
    buildPageDescription("GNDU’s official Boys’ Hostel page describes the residential complex and the services available to its residents.");
    buildDetailSection(
      "Accommodation and facilities",
      "GNDU reports capacity for 704 students in five blocks containing 356 cubicle rooms. The hostel page describes two messes, water coolers and geysers, a reading hall with seating for about 100, two common rooms, Wi-Fi, indoor table tennis and carrom, and volleyball and badminton courts. It also describes maintenance services and guest-room facilities. These are facilities listed on the official page; current operation and access should be confirmed with the hostel.",
    );
    buildDetailSection(
      "Canteens and common rooms",
      "The official page reports two canteens inside the Boys’ Hostel, open to residents from 6:00 a.m. to 11:00 p.m.; it says products approved by the Dean, Students’ Welfare are sold at fixed prices. It does not identify the individual canteens or publish current menus or item prices. The page lists common-room hours as 7:00 a.m. to 11:00 p.m.; verify current arrangements before relying on these hours.",
    );
    buildDetailSection(
      "Hostel admission",
      "Hostel application dates, current vacancies, eligibility, charges, and required documents were not verified. The five blocks are described as one Boys’ Hostel complex; the reviewed source does not identify these as separate Boys’ Hostel I, II, and III hostels.",
    );
    buildMediaGallery([[
      galleryImageUrl(officialGalleryPhotos.find((photo) => photo.title === "Boys Hostel")),
      "GNDU official photo gallery caption: Boys Hostel",
      "Boys Hostel — GNDU official photo gallery",
    ]]);
    addExternalLink(routeContent, "Official Boys’ Hostel facilities", "https://digital.gndu.ac.in/Hostels.aspx");
  } else if (id === "girls-hostel-iii") {
    buildPageDescription("Mata Nanaki Girls Hostel III is the girls’ hostel individually described on the GNDU hostel page reviewed for this guide.");
    buildDetailSection(
      "Accommodation and eligibility described by GNDU",
      "GNDU reports provision for 761 students in 255 rooms across six interconnected storeys. Its page states that this hostel is allotted on a sharing basis only to students in the second or higher year of their courses. Confirm whether those conditions, occupancy, and application requirements remain current with the university.",
    );
    buildDetailSection(
      "Facilities and services",
      "The official page lists lifts with generator backup, geysers, water coolers and purifiers, a contract-run mess, common and reading rooms, Wi-Fi, a medical room, a nurse and attendant, night security, CCTV, a provisional store and utility shops, and a sanitary-napkin vending machine with incinerator. These are descriptions published by GNDU; confirm current availability and access.",
    );
    buildDetailSection(
      "Hostel admission",
      "Current applications, vacancies, fees, application dates, and required documents were not verified. Check the current GNDU hostel notices before applying.",
    );
    const girlsPhoto = officialGalleryPhotos.find((photo) => photo.title === "Girls Hostel");
    buildMediaGallery([[
      galleryImageUrl(girlsPhoto),
      "GNDU official photo gallery caption: Girls Hostel; the specific hostel number is not identified",
      "Girls Hostel — GNDU official gallery image (the image is not identified specifically as Hostel III)",
    ]]);
    addExternalLink(routeContent, "Mata Nanaki Girls Hostel III information", "https://gndu.ac.in/hostel/");
  } else if (id === "sports-hostel") {
    buildPageDescription("GNDU’s Department of Physical Education describes a separate Sports Hostel associated with its sports facilities.");
    buildDetailSection(
      "Published information",
      "The GNDU sports page states that a separate sports hostel is maintained to lodge nearly 200 players at a time. The page does not identify hostel blocks, current capacity, eligibility, fees, application steps, or vacancies; confirm current arrangements directly with the university.",
    );
    buildMediaGallery([[
      galleryImageUrl(officialGalleryPhotos.find((photo) => photo.title === "Sports Hostel")),
      "GNDU official photo gallery caption: Sports Hostel",
      "Sports Hostel — GNDU official photo gallery",
    ]]);
    addExternalLink(routeContent, "GNDU sports facilities and Sports Hostel reference", "https://digital.gndu.ac.in/Sports.aspx");
  } else {
    buildPageDescription("The official hostel sources reviewed for this guide do not confirm additional numbered Boys’ Hostel I/II/III or Girls Hostel I/II/IV identities, or hostels at Regional Campuses.");
    buildDetailSection(
      "Information not verified",
      "GNDU’s Boys’ Hostel page describes one five-block complex, while the university hostel page describes Mata Nanaki Girls Hostel III. The photo gallery also has generic captions for Boys Hostel and Girls Hostel but does not identify numbered blocks. No separate hostel names, facilities, admission rules, or Regional Campus hostel details are invented here.",
    );
    addExternalLink(routeContent, "GNDU Boys’ Hostel information", "https://digital.gndu.ac.in/Hostels.aspx");
    addExternalLink(routeContent, "GNDU hostel information", "https://gndu.ac.in/hostel/");
  }
  return true;
}

function renderCampusLife() {
  buildPageHeader("Campus Life", "", null);
  buildPageDescription("Explore university-published accommodation, health, support, and student resources. Availability and access details should be confirmed with GNDU.");
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
    buildPageDescription("GNDU’s official pages describe the Boys’ Hostel complex, Mata Nanaki Girls Hostel III, and a separate Sports Hostel. Hostel names, rules, and vacancies below are limited to what those pages confirm.");
    const grid = buildGrid();
    [
      ["Boys’ Hostel (five-block complex)", "GNDU describes five blocks and 356 cubicle rooms; individual Boys’ Hostel I/II/III identities were not confirmed.", "hostel", "boys-hostel"],
      ["Mata Nanaki Girls Hostel III", "GNDU’s page describes this named hostel and its accommodation and facilities.", "hostel", "girls-hostel-iii"],
      ["Sports Hostel", "GNDU’s sports page describes a separate sports hostel; current eligibility and availability are not verified.", "hostel", "sports-hostel"],
      ["Other hostel names and blocks", "The reviewed official pages do not confirm other numbered hostel identities or current vacancies.", "hostel", "other-hostels"],
    ].forEach(([title, description, page, item]) => {
      grid.append(createCard(title, description, page, item, "GNDU hostel information"));
    });
    addExternalLink(routeContent, "GNDU Boys’ Hostel information", "https://digital.gndu.ac.in/Hostels.aspx");
    addExternalLink(routeContent, "GNDU hostel information", "https://gndu.ac.in/hostel/");
    return true;
  }

  if (id === "campus-facilities") {
    buildPageHeader("Campus Facilities", "campus-life", {}, "Campus Life");
    buildPageDescription("Explore facilities documented by GNDU. This guide links to verified descriptions; it does not claim that every facility or service is available to every student.");
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
    buildPageDescription("GNDU’s University Health Centre provides primary care and related services for the university community.");
    buildDetailSection(
      "Services described by GNDU",
      "The Health Centre page lists Medical, Dental, and Ayurvedic outpatient services, physiotherapy, laboratory, radiology, and pharmacy services. It also describes emergency and ambulance services as available 24 hours and health services from Monday to Saturday, including declared holidays. Check the official page for current arrangements, eligibility, and service availability.",
    );
    addExternalLink(routeContent, "GNDU Health Centre information", "https://digital.gndu.ac.in/OtherCenterFacilities.aspx#health");
  } else if (id === "student-support") {
    buildPageDescription("GNDU identifies the Students Facilitation Centre as a first point of contact for prospective and admitted students.");
    buildDetailSection(
      "Enquiries supported",
      "The Centre lists admissions, academic course enquiries, student fee payments and refunds, examinations, results, transcripts, hostels, and student activities. GNDU also notes special assistance for international students. Check the official page for current contact channels and opening arrangements.",
    );
    addExternalLink(routeContent, "Student Facilitation Centre", "https://digital.gndu.ac.in/StudentFacilitationCenter.aspx");
  } else if (id === "student-activities") {
    buildPageDescription("GNDU’s Dean Students’ Welfare and Youth Welfare pages describe university student activities and cultural programmes.");
    buildDetailSection(
      "Activities described by GNDU",
      "The Dean Students’ Welfare page mentions indoor and outdoor sports events, youth festivals, hobby and drama clubs, and subject-related societies. The Youth Welfare Department describes zonal and inter-zonal youth festivals, leadership and hiking or trekking camps, tours, coaching camps, seminars, workshops, and cultural programmes. These descriptions do not guarantee a particular event or club is currently active; check the university pages for current schedules and participation details.",
    );
    addExternalLink(routeContent, "Dean Students’ Welfare", "https://digital.gndu.ac.in/dean-students-welfare.aspx");
    addExternalLink(routeContent, "Department of Youth Welfare", "https://digital.gndu.ac.in/YouthWelfareDepartment.aspx");
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
    buildPageDescription("Bhai Gurdas Library is GNDU’s university library, housed in a five-storey building near the centre of the campus.");
    buildDetailSection(
      "Reading and study facilities",
      "The library describes a 24-hour air-conditioned reading room with seating for 250, a digital lounge, and a 50-seat seminar and orientation hall with multimedia facilities. The library’s opening notice says it remains open throughout the year except on 26 January and 15 August; confirm current access arrangements with the library.",
    );
    buildDetailSection(
      "Collections and services",
      "Library sections include circulation, computer services, periodicals, reference, Punjabi reference, manuscripts and rare books, theses and dissertations, and an electronic theses and dissertation lab. GNDU’s library page reports a collection of 543,357 documents and describes 22 departmental libraries. Collection figures and access conditions can change.",
    );
    buildDetailSection(
      "Digital resources and catalogue",
      "The library describes access to electronic journals and books, an OPAC online catalogue, DELNET inter-library services, and IP-based electronic-resource access through the campus network. It also reports membership of the Government of India’s One Nation One Subscription initiative. Check the library site for current resource access and login requirements.",
    );
    buildMediaGallery([
      [
        "https://digital.gndu.ac.in/images/photogallery/photo-gallery-15s.jpg",
        "Bhai Gurdas Library, as captioned in the official university photo gallery",
        "Bhai Gurdas Library — GNDU official photo gallery",
      ],
    ]);
    addExternalLink(routeContent, "Bhai Gurdas Library catalogue and resources", "https://library.gndu.ac.in/");
    addExternalLink(routeContent, "Official GNDU syllabus selector", "https://collegeadmissions.gndu.ac.in/StudentArea/ViewSyllabinew.aspx");
    return true;
  }

  if (id === "sports") {
    buildPageDescription("GNDU’s sports complex and Department of Physical Education publish information about university facilities and sports activities.");
    buildDetailSection(
      "Facilities described by GNDU",
      "GNDU lists an astro-turf hockey stadium, a swimming-pool stadium with facilities for training, diving, and competition, an open-air gymnasium, and grounds for football, cricket, lawn tennis, basketball, volleyball, handball, softball, kho-kho, and kabaddi. Its page also describes coaching, training camps, and inter-college tournaments. Confirm current access, schedules, and availability with the university.",
    );
    buildMediaGallery([
      [
        "https://digital.gndu.ac.in/images/photogallery/photo-gallery-13s.jpg",
        "GNDU Hockey Stadium, as captioned in the official university photo gallery",
        "Hockey Stadium — GNDU official photo gallery",
      ],
    ]);
    addExternalLink(routeContent, "GNDU sports facilities", "https://digital.gndu.ac.in/Sports.aspx");
    addExternalLink(routeContent, "Department of Physical Education", "https://online.gndu.ac.in/department-of-physical-education.aspx");
    return true;
  }

  if (id === "student-life") {
    buildPageDescription("Explore GNDU-published student support and activities. Current events and participation arrangements should be checked with the university.");
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
  buildPageDescription("Use the interactive map search to locate GNDU Main Campus, Amritsar. GNDU building markers or a verified campus plan were not available in the official sources reviewed, so no building positions are marked or inferred.");
  const frame = document.createElement("iframe");
  frame.className = "route-map";
  frame.title = "Interactive map search for Guru Nanak Dev University, Amritsar";
  frame.loading = "lazy";
  frame.referrerPolicy = "no-referrer-when-downgrade";
  frame.allowFullscreen = true;
  frame.src = "https://www.google.com/maps?q=Guru%20Nanak%20Dev%20University%2C%20Amritsar&output=embed";
  routeContent.append(frame);
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
    "GNDU was established by the State Legislature Act No. 21 of 1969. The University is named Guru Nanak Dev University. For the formal institutional record and current university information, consult GNDU's official website.",
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
    "GNDU admissions distinguish regular Main Campus programmes from constituent-college admissions. Programme availability and application routes depend on the campus or institution; confirm the relevant listing before applying. GNDU's official department directory also links academic units and centres.",
  );
  buildDetailSection(
    "Research and academic activities",
    "GNDU departments describe discipline-specific teaching and research. The Department of Computer Science, for example, reports research in software engineering, distributed and parallel computing, databases and big data analytics, machine learning, and image processing. Research programmes and current opportunities are department- and session-specific.",
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
  addExternalLink(sources, "GNDU official photo gallery", "https://digital.gndu.ac.in/photo-gallery.aspx");
  routeContent.append(sources);
}

function renderContact() {
  const source = admissionTopics.find((topic) => topic.id === "student-facilitation")?.source;
  buildPageHeader("Contact and Enquiries", "admissions", {}, "Admissions");
  buildPageDescription("For university matters, use the contact details and official enquiry links published by GNDU. Verify current contact information on the official pages.");
  const body = createElement("div", "route-detail-content");
  appendClonedContent(body, source);
  routeContent.append(body);
}

function renderEvents() {
  buildPageHeader("Events", "", null);
  buildPageDescription("Explore the kinds of events and activities students may look out for. This guide does not have verified current event listings.");

  const disclaimer = createElement(
    "p",
    "events-disclaimer",
    "Sample content only: event names and descriptions below are illustrative. GNDU dates, times, venues, upcoming or past status, and registration details have not been verified. Check official university notices for current information.",
  );
  routeContent.append(disclaimer);

  const filters = createElement("div", "event-filters");
  filters.setAttribute("aria-label", "Filter events by category");
  const grid = buildGrid("event-grid route-event-grid");
  const categories = [...new Set(sampleEvents.map((event) => event.category))];
  const filterButton = (label, category) => {
    const button = createElement("button", "event-filter", label);
    button.type = "button";
    button.setAttribute("aria-pressed", String(category === ""));
    button.addEventListener("click", () => {
      filters.querySelectorAll(".event-filter").forEach((filter) => {
        filter.setAttribute("aria-pressed", String(filter === button));
      });
      grid.querySelectorAll(".event-card").forEach((card) => {
        card.hidden = category !== "" && card.dataset.category !== category;
      });
    });
    return button;
  };
  filters.append(filterButton("All categories", ""));
  categories.forEach((category) => filters.append(filterButton(category, category)));
  routeContent.insertBefore(filters, grid);
  sampleEvents.forEach((event) => grid.append(createEventCard(event)));

  const imageNote = createElement(
    "p",
    "event-image-note",
    "Images are illustrative campus photographs from GNDU’s official photo gallery, not depictions of the sample events.",
  );
  routeContent.append(imageNote);
  const sources = createElement("div", "directory-links route-source-links");
  addExternalLink(sources, "GNDU Dean Students’ Welfare", "https://digital.gndu.ac.in/dean-students-welfare.aspx");
  addExternalLink(sources, "GNDU Department of Youth Welfare", "https://digital.gndu.ac.in/YouthWelfareDepartment.aspx");
  routeContent.append(sources);
}

function renderNotFound() {
  buildPageHeader("Page not found", "", null);
  buildPageDescription("This guide page could not be found. Return to Home or choose a section from the navigation.");
  routeContent.append(createInternalLink("home", "", "Return to Home", "button button-primary"));
}

function openPhotoViewer(link) {
  let dialog = routeContent.querySelector(".photo-viewer");
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
    routeContent.append(dialog);
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
  const page = params.get("page") || "home";
  const item = params.get("item") || "";
  routeContent.replaceChildren();

  if (page === "home") {
    renderHome();
    return;
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
    case "contact":
      renderContact();
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

const departmentsFeature = Array.from(document.querySelectorAll(".feature-card")).find(
  (card) => getText(card.querySelector("h3")) === "Departments",
);
if (departmentsFeature) {
  departmentsFeature.append(createInternalLink("courses", "", "Explore courses", "text-link"));
}

document.addEventListener("click", (event) => {
  const photoLink = event.target instanceof Element ? event.target.closest(".photo-grid a") : null;
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
