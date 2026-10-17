import express from "express";

import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "127.0.0.1";

const requestWindowMs = 10 * 60 * 1000;
const requestLimit = 20;
const rateBuckets = new Map();
const faqEntries = [
  {
    keywords: ["admission", "admissions", "apply", "application", "prospectus", "eligibility", "entrance", "counselling", "admission kaise", "how to apply", "प्रवेश", "दाखिला", "एडमिशन", "आवेदन", "पात्रता"],
    en: "GNDU admission routes, eligibility, schedules, and documents depend on the programme, campus, and session. Check the current prospectus and notices before applying.",
    hi: "GNDU mein admission, eligibility, schedule aur documents course, campus aur session ke hisaab se alag hote hain. Apply karne se pehle current prospectus aur notices zaroor check karein.",
    sources: [
      ["GNDU Admissions Portal", "https://www.gnduadmissions.org/"],
      ["GNDU Main Campus courses", "https://www.gnduadmissions.org/CampusAdmissions/coursesoffered.aspx"],
    ],
  },
  {
    keywords: ["course", "courses", "programme", "programmes", "degree", "syllabus", "department", "faculty", "bca", "btech", "b.tech", "mca", "m.com", "कोर्स", "पाठ्यक्रम", "डिग्री", "विभाग"],
    en: "This guide has a programme directory with verified examples, but it is not a complete or guaranteed current course list. Confirm current availability, campus, eligibility, and syllabus in GNDU's official listings.",
    hi: "Is guide mein kuch verified courses ki directory hai, lekin yeh poori ya har session ki current list nahi hai. Course availability, campus, eligibility aur syllabus GNDU ki official listings mein verify karein.",
    sources: [
      ["Main Campus courses offered", "https://www.gnduadmissions.org/CampusAdmissions/coursesoffered.aspx"],
      ["GNDU department directory", "https://online.gndu.ac.in/Departments.aspx"],
      ["Official syllabus selector", "https://collegeadmissions.gndu.ac.in/StudentArea/ViewSyllabinew.aspx"],
    ],
  },
  {
    keywords: ["fee", "fees", "tuition", "refund", "payment", "फीस", "फी", "शुल्क", "रिफंड", "फीस कितनी", "फी कितनी"],
    en: "Fees and refund rules vary by course, campus, category, and admission session. The current applicable amount should be checked in the official prospectus or fee schedule; this guide does not verify a universal fee.",
    hi: "Fees aur refund rules course, campus, category aur admission session ke hisaab se badalte hain. Current amount official prospectus ya fee schedule mein check karein; is guide mein universal fee verify nahi hai.",
    sources: [
      ["GNDU Admissions Portal", "https://www.gnduadmissions.org/"],
      ["Student Facilitation Centre", "https://digital.gndu.ac.in/StudentFacilitationCenter.aspx"],
    ],
  },
  {
    keywords: ["scholarship", "scholarships", "scholarship eligibility", "scholarship deadline", "financial aid", "fellowship", "छात्रवृत्ति", "छात्रवृत्ति की पात्रता", "स्कॉलरशिप", "वजीफा"],
    en: "Scholarship eligibility, amounts, and deadlines are scheme- and session-specific; this guide does not verify current scholarship openings. Check GNDU notices and the relevant scholarship authority.",
    hi: "Scholarship ki eligibility, amount aur last date scheme aur session ke hisaab se alag hote hain. Is guide mein current scholarship opening verify nahi hai; GNDU notices aur sambandhit scholarship authority check karein.",
    sources: [
      ["GNDU official website and notices", "https://digital.gndu.ac.in/"],
      ["Student Facilitation Centre", "https://digital.gndu.ac.in/StudentFacilitationCenter.aspx"],
    ],
  },
  {
    keywords: ["canteen", "canteens", "canteen location", "where is canteen", "food", "mess", "menu", "khana", "dining", "कैफेटेरिया", "कैंटीन", "खाना", "मेस"],
    en: "GNDU's published Boys' Hostel information describes two canteens for residents, open from 6:00 a.m. to 11:00 p.m., with products approved by the Dean, Students' Welfare sold at fixed prices. Current menus and other canteen locations were not verified.",
    hi: "GNDU ki Boys' Hostel information ke mutabik residents ke liye do canteens hain, 6:00 a.m. se 11:00 p.m. tak; Dean, Students' Welfare se approved items fixed prices par milte hain. Current menu aur doosri canteens ki location verify nahi hai.",
    sources: [
      ["Official hostel facilities and canteen information", "https://digital.gndu.ac.in/Hostels.aspx"],
      ["GNDU hostel website", "https://gndu.ac.in/hostel/"],
    ],
  },
  {
    keywords: ["library", "bhai gurdas", "books", "reading room", "catalogue", "catalog", "opac", "लाइब्रेरी", "पुस्तकालय", "किताब", "भाई गुरदास"],
    en: "Bhai Gurdas Library information in this guide includes a 24-hour air-conditioned reading hall, digital lounge, electronic resources, OPAC catalogue, and reference, periodical, manuscript, and rare-book sections. Confirm current access arrangements with the library.",
    hi: "Bhai Gurdas Library ke baare mein guide mein 24-hour AC reading hall, digital lounge, e-resources, OPAC catalogue aur reference, periodical, manuscript aur rare-book sections diye gaye hain. Current access library se confirm karein.",
    sources: [["Bhai Gurdas Library", "https://library.gndu.ac.in/"]],
  },
  {
    keywords: ["event", "events", "event date", "event dates", "event registration", "youth festival", "festival", "workshop", "seminar", "cultural", "activity", "activities", "कार्यक्रम", "इवेंट", "युवा उत्सव", "वर्कशॉप", "सेमिनार", "कार्यक्रम की तारीख"],
    en: "GNDU's student-welfare pages describe cultural programmes, youth festivals, sports, clubs, seminars, and workshops. The events in this guide are clearly marked as samples; their dates, venues, and registration details are not verified. Check official announcements for confirmed events.",
    hi: "GNDU ke student-welfare pages par cultural programmes, youth festivals, sports, clubs, seminars aur workshops ka zikr hai. Guide ke event cards sample hain; unki dates, venue aur registration verify nahi hain. Confirmed events ke liye official announcements dekhein.",
    sources: [
      ["Dean Students' Welfare", "https://digital.gndu.ac.in/dean-students-welfare.aspx"],
      ["Department of Youth Welfare", "https://digital.gndu.ac.in/YouthWelfareDepartment.aspx"],
      ["Official press releases", "https://digital.gndu.ac.in/AllPressReleases.aspx"],
      ["University Calendar", "https://digital.gndu.ac.in/UniversityCalender.aspx"],
    ],
  },
  {
    keywords: ["hostel", "hostels", "accommodation", "boys hostel", "girls hostel", "sports hostel", "हॉस्टल", "छात्रावास", "रहने"],
    en: "GNDU publishes separate hostel information. This guide describes the Boys' Hostel facilities, Mata Nanaki Girls Hostel III, and the Sports Hostel; current vacancies, eligibility, charges, and applications must be confirmed with the official hostel portal.",
    hi: "GNDU hostels ki alag information publish karta hai. Guide mein Boys' Hostel, Mata Nanaki Girls Hostel III aur Sports Hostel ka zikr hai; current vacancy, eligibility, fees aur application official hostel portal se confirm karein.",
    sources: [
      ["GNDU Boys' Hostel information", "https://digital.gndu.ac.in/Hostels.aspx"],
      ["Mata Nanaki Girls Hostel III", "https://gndu.ac.in/hostel/"],
      ["GNDU Hostel Portal", "https://gndu.ac.in/Hostel/index.aspx"],
    ],
  },
  {
    keywords: ["health", "medical", "doctor", "health centre", "health center", "ambulance", "स्वास्थ्य", "डॉक्टर", "मेडिकल", "एम्बुलेंस"],
    en: "GNDU's Health Centre information lists medical, dental, and Ayurvedic outpatient services, physiotherapy, laboratory, radiology, and pharmacy services. It describes emergency and ambulance services as available 24 hours; confirm current arrangements with GNDU.",
    hi: "GNDU Health Centre mein medical, dental aur Ayurvedic OPD, physiotherapy, laboratory, radiology aur pharmacy services listed hain. Emergency aur ambulance services 24 hours batayi gayi hain; current arrangements GNDU se confirm karein.",
    sources: [["GNDU Health Centre information", "https://digital.gndu.ac.in/OtherCenterFacilities.aspx#health"]],
  },
  {
    keywords: ["sports", "stadium", "gym", "hockey", "swimming", "खेल", "स्टेडियम", "जिम", "हॉकी", "तैराकी"],
    en: "GNDU's sports information lists an astro-turf hockey stadium, swimming-pool stadium, open-air gymnasium, and grounds for several sports. Facility access, training, and schedules should be confirmed with the Department of Physical Education.",
    hi: "GNDU sports information mein astro-turf hockey stadium, swimming-pool stadium, open-air gymnasium aur kai sports ke grounds listed hain. Access, training aur schedule Department of Physical Education se confirm karein.",
    sources: [
      ["GNDU Sports facilities", "https://digital.gndu.ac.in/Sports.aspx"],
      ["Department of Physical Education", "https://online.gndu.ac.in/department-of-physical-education.aspx"],
    ],
  },
  {
    keywords: ["student life", "student activities", "clubs", "hobby club", "drama club", "student society", "students welfare", "विद्यार्थी जीवन", "छात्र गतिविधि", "क्लब", "सोसाइटी"],
    en: "GNDU's student-welfare pages describe indoor and outdoor sports, youth festivals, hobby and drama clubs, subject-related societies, seminars, workshops, and cultural programmes. Current club schedules and participation details should be confirmed with the university.",
    hi: "GNDU student-welfare pages par indoor/outdoor sports, youth festivals, hobby aur drama clubs, subject societies, seminars, workshops aur cultural programmes ka zikr hai. Current schedule aur participation university se confirm karein.",
    sources: [
      ["Dean Students' Welfare", "https://digital.gndu.ac.in/dean-students-welfare.aspx"],
      ["Department of Youth Welfare", "https://digital.gndu.ac.in/YouthWelfareDepartment.aspx"],
    ],
  },
  {
    keywords: ["map", "directions", "location", "where is gndu", "campus map", "address", "नक्शा", "रास्ता", "लोकेशन", "पता", "कहाँ है"],
    en: "The guide links an interactive map search for GNDU Main Campus, Amritsar. Building-by-building locations are not verified here. The listed university address is Grand Trunk Road, Off NH 1, Amritsar, Punjab 143005, India.",
    hi: "Guide mein GNDU Main Campus, Amritsar ke liye interactive map search hai; buildings ki alag-alag locations verify nahi hain. Listed address: Grand Trunk Road, Off NH 1, Amritsar, Punjab 143005, India.",
    sources: [
      ["Open GNDU in Google Maps", "https://www.google.com/maps/search/?api=1&query=Guru+Nanak+Dev+University%2C+Amritsar"],
      ["GNDU official website", "https://digital.gndu.ac.in/"],
    ],
  },
  {
    keywords: ["about gndu", "about university", "what is gndu", "gndu kya hai", "university", "gndu", "history", "established", "mission", "research", "academic environment", "अमृतसर यूनिवर्सिटी", "गुरु नानक देव यूनिवर्सिटी", "विश्वविद्यालय", "इतिहास"],
    en: "Guru Nanak Dev University is a residential and affiliating university in Amritsar, established on 24 November 1969. Its academic work spans humanities, sciences, professional disciplines, and technology. GNDU describes its mission through knowledge, inquiry, ethical leadership, inclusion, service, and social transformation.",
    hi: "Guru Nanak Dev University Amritsar mein ek residential aur affiliating university hai, jo 24 November 1969 ko sthapit hui. Yahan humanities, sciences, professional disciplines aur technology mein padhai aur research hoti hai. GNDU knowledge, inquiry, ethical leadership, inclusion aur service par zor deta hai.",
    sources: [["About Guru Nanak Dev University", "https://digital.gndu.ac.in/about-university.aspx"]],
  },
  {
    keywords: ["campus facilities", "facilities", "campus life", "campus", "student support", "सुविधा", "कैम्पस", "कैंपस", "छात्र सहायता"],
    en: "The guide covers GNDU hostels, Health Centre, Bhai Gurdas Library, sports facilities, student support, campus dining, map search, and photo gallery. Details and access can change; follow the linked GNDU sources for current information.",
    hi: "Guide mein GNDU hostels, Health Centre, Bhai Gurdas Library, sports facilities, student support, canteens, campus map aur photo gallery ki information hai. Details badal sakti hain; current info ke liye linked GNDU sources dekhein.",
    sources: [
      ["GNDU official website", "https://digital.gndu.ac.in/"],
      ["Student Facilitation Centre", "https://digital.gndu.ac.in/StudentFacilitationCenter.aspx"],
    ],
  },
  {
    keywords: ["photo gallery", "photos", "pictures", "images", "फोटो", "तस्वीरें", "चित्र"],
    en: "The guide's Photo Gallery uses images and captions from GNDU's official photo gallery.",
    hi: "Guide ka Photo Gallery section GNDU ki official photo gallery ke photos aur captions dikhata hai.",
    sources: [["GNDU official photo gallery", "https://digital.gndu.ac.in/photo-gallery.aspx"]],
  },
  {
    keywords: ["contact", "phone", "email", "facilitation centre", "facilitation center", "enquiry", "query", "संपर्क", "फोन", "ईमेल", "पूछताछ"],
    en: "The guide lists university enquiry contacts and identifies the Student Facilitation Centre as a first point of contact for prospective and admitted students. For current details, check GNDU's official contact page.",
    hi: "Guide mein university enquiry contacts diye gaye hain aur Student Facilitation Centre prospective aur admitted students ke liye first contact point hai. Current details official GNDU contact page par check karein.",
    sources: [
      ["Student Facilitation Centre", "https://digital.gndu.ac.in/StudentFacilitationCenter.aspx"],
      ["GNDU Contact Us", "https://digital.gndu.ac.in/ContactUs.aspx"],
    ],
  },
  {
    keywords: ["exam", "examination", "result", "transcript", "marksheet", "revaluation", "परीक्षा", "नतीजा", "रिजल्ट", "अंकपत्र"],
    en: "For examinations, results, transcripts, and related student enquiries, the guide points students to GNDU's Student Facilitation Centre. Check the official university portals for current examination notices and results.",
    hi: "Exams, results, transcripts aur student enquiries ke liye guide GNDU Student Facilitation Centre ka reference deta hai. Current examination notices aur results official portals par check karein.",
    sources: [
      ["Student Facilitation Centre", "https://digital.gndu.ac.in/StudentFacilitationCenter.aspx"],
      ["GNDU official website", "https://digital.gndu.ac.in/"],
    ],
  },
  {
    keywords: ["navigation", "navigate", "website section", "where can i find", "how do i find", "guide sections", "नेविगेशन", "कहाँ मिलेगा", "कहां मिलेगा"],
    en: "Use the top navigation or the homepage guide cards to open Admissions, Campus Life, Departments, Courses, Campus Map, Canteens, About, and Events. Each section links to its related information.",
    hi: "Top navigation ya homepage cards se Admissions, Campus Life, Departments, Courses, Campus Map, Canteens, About aur Events khol sakte hain. Har section mein usse judi information ke links hain.",
    sources: [],
  },
  {
    keywords: ["hello", "hi", "hey", "namaste", "sat sri akal", "good morning", "good evening", "नमस्ते", "हैलो", "ਸਤ ਸ੍ਰੀ ਅਕਾਲ"],
    en: "Hello! I’m the GNDU Freshers Guide FAQ assistant. Ask me about admissions, courses, campus facilities, library, canteens, fees, student life, or events.",
    hi: "Namaste! Main GNDU Freshers Guide ka FAQ assistant hoon. Admission, courses, campus facilities, library, canteen, fees, student life ya events ke baare mein poochhein.",
    sources: [],
  },
];

function normalizeMessage(value) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function findFaq(message) {
  const normalized = normalizeMessage(message);
  const searchable = ` ${normalized} `;
  let bestMatch = null;
  let bestScore = 0;

  for (const entry of faqEntries) {
    const score = entry.keywords.reduce((total, keyword) => {
      const normalizedKeyword = normalizeMessage(keyword);
      const index = searchable.indexOf(` ${normalizedKeyword}`);
      const matches = index !== -1 && searchable[index + normalizedKeyword.length + 1] === " ";
      return matches ? total + normalizedKeyword.length : total;
    }, 0);
    if (score > bestScore) {
      bestMatch = entry;
      bestScore = score;
    }
  }
  return bestMatch;
}

function getAnswer(entry, message) {
  if (!entry) {
    if (/\p{Script=Devanagari}/u.test(message)) {
      return "माफ़ कीजिए, मुझे इस विषय की जानकारी GNDU Freshers Guide में नहीं मिली। GNDU से जुड़े प्रश्नों के लिए आधिकारिक वेबसाइट देखें या प्रवेश, कोर्स, परिसर सुविधाओं और छात्र जीवन के बारे में पूछें।";
    }
    if (/\b(kya|kaise|kahan|kab|hai|hain|mujhe|batao|btao|kripya|karo|chahiye|ke|ki|ka)\b/i.test(message)) {
      return "Is topic ki jaankari GNDU Freshers Guide mein nahi mili. GNDU ke sawaal ke liye official website dekhein, ya admission, courses, campus facilities aur student life ke baare mein poochhein.";
    }
    return "I couldn't find that topic in the GNDU Freshers Guide. For GNDU questions, visit the official university website or ask about admissions, courses, campus facilities, or student life.";
  }

  if (/\p{Script=Devanagari}/u.test(message)) return entry.hi;
  if (/\b(kya|kaise|kahan|kab|hai|hain|mujhe|batao|btao|kripya|karo|chahiye|ke|ki|ka)\b/i.test(message)) return entry.hi;
  return entry.en;
}

function validateChatBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Send a valid chat request.";
  }
  if (typeof body.message !== "string" || !body.message.trim() || body.message.length > 4000) {
    return "Enter a question of 1 to 4,000 characters.";
  }
  if (body.history !== undefined && (!Array.isArray(body.history) || body.history.length > 12)) {
    return "Conversation history is invalid. Clear the chat and try again.";
  }

  let historyLength = 0;
  for (const turn of body.history || []) {
    if (
      !turn ||
      typeof turn !== "object" ||
      !["user", "assistant"].includes(turn.role) ||
      typeof turn.content !== "string" ||
      !turn.content.trim() ||
      turn.content.length > 4000
    ) {
      return "Conversation history is invalid. Clear the chat and try again.";
    }
    historyLength += turn.content.length;
  }
  if (historyLength > 10000) return "Conversation history is too long. Clear the chat and try again.";
  return null;
}

function takeRateLimit(req, res, next) {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || "unknown";
  let bucket = rateBuckets.get(key);

  if (!bucket || now - bucket.startedAt >= requestWindowMs) {
    if (rateBuckets.size >= 5000) {
      for (const [ip, entry] of rateBuckets) {
        if (now - entry.startedAt >= requestWindowMs) rateBuckets.delete(ip);
      }
      if (rateBuckets.size >= 5000 && !rateBuckets.has(key)) {
        return res.status(429).json({ error: "The chat service is busy. Please try again later." });
      }
    }
    bucket = { startedAt: now, count: 0 };
    rateBuckets.set(key, bucket);
  }

  if (bucket.count >= requestLimit) {
    const retrySeconds = Math.max(1, Math.ceil((requestWindowMs - (now - bucket.startedAt)) / 1000));
    res.set("Retry-After", String(retrySeconds));
    return res.status(429).json({ error: "You have sent several questions. Please wait a few minutes and try again." });
  }

  bucket.count += 1;
  next();
}

app.disable("x-powered-by");
if (process.env.TRUST_PROXY === "1") app.set("trust proxy", 1);
app.use(express.json({ limit: "64kb", strict: true }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", assistant: "predefined-faq", ready: true });
});

app.post("/api/chat", takeRateLimit, (req, res) => {
  const validationError = validateChatBody(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const message = req.body.message.trim();
  const entry = findFaq(message);
  const answer = getAnswer(entry, message);
  const sources = (entry?.sources || []).map(([title, url]) => ({ title, url }));
  return res.json({ answer, sources });
});



app.get(["/", "/index.html", "/styles.css", "/script.js", "/chatbot.js"], (req, res) => {
  const fileName = req.path === "/" ? "index.html" : req.path.slice(1);
  res.sendFile(path.join(projectRoot, fileName));
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found." });
});

app.use((error, _req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.type === "entity.too.large") {
    return res.status(413).json({ error: "The request is too large." });
  }
  if (error instanceof SyntaxError && error.status === 400) {
    return res.status(400).json({ error: "The request body must be valid JSON." });
  }
  console.error("Unexpected server error:", error instanceof Error ? error.name : "Unknown error");
  return res.status(500).json({ error: "The server encountered an unexpected error." });
});

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error("PORT must be a valid TCP port between 1 and 65535.");
  process.exitCode = 1;
} else {
  app.listen(port, host, () => {
    console.log(`GNDU Freshers Guide server listening at http://${host}:${port}`);
  });
}
