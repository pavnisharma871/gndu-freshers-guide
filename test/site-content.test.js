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
      throw new Error(`Site-content test server exited with code ${child.exitCode}.`);
    }
    try {
      const response = await fetch(`${url}/api/health`);
      if (response.ok) return;
    } catch {
      await delay(100);
    }
  }
  throw new Error("Site-content test server did not start.");
}

test("placements, campus facilities, verified-photo activity, and official content are served", async (t) => {
  const port = await getAvailablePort();
  const url = `http://127.0.0.1:${port}`;
  const env = { ...process.env, HOST: "127.0.0.1", PORT: String(port), MONGODB_URI: "" };
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

  const placementsPage = await fetch(`${url}/placements`);
  assert.equal(placementsPage.status, 200);
  assert.match(await placementsPage.text(), /href="\/placements">Placements<\/a>/);

  const scriptResponse = await fetch(`${url}/script.js`);
  assert.equal(scriptResponse.status, 200);
  const script = await scriptResponse.text();
  const indexResponse = await fetch(`${url}/`);
  assert.equal(indexResponse.status, 200);
  const index = await indexResponse.text();
  assert.match(script, /\{ path: "\/placements", page: "placements" \}/);
  assert.match(script, /function renderPlacements\(\)/);
  assert.match(script, /https:\/\/digital\.gndu\.ac\.in\/StudentActivityClubs\.aspx/);
  assert.match(script, /Inauguration Day of University/);
  assert.match(script, /Dance Club activity gallery/);
  assert.match(script, /SciRox Science Club activity gallery/);
  assert.doesNotMatch(script, /img_1607211544\.jpg|DramaClub\.jpg|ScienceClub\.jpg/);
  assert.match(script, /showcase\.hidden = false/);
  assert.match(script, /homePhotoShowcase\.hidden = true/);
  assert.doesNotMatch(script, /Campus Cultural Showcase|Ideas in Technology/);

  const departmentRendererStart = script.indexOf("function renderFaculties()");
  const departmentRendererEnd = script.indexOf("function renderFaculty(id)", departmentRendererStart);
  assert.ok(departmentRendererStart >= 0 && departmentRendererEnd > departmentRendererStart);
  const departmentRenderer = script.slice(departmentRendererStart, departmentRendererEnd);
  assert.match(departmentRenderer, /createElement\("details", "faculty-card faculty-disclosure"\)/);
  assert.match(departmentRenderer, /Other GNDU academic centres/);
  assert.match(departmentRenderer, /createElement\("details", "faculty-card faculty-disclosure academic-centre"\)/);
  assert.match(departmentRenderer, /centre\.overview/);
  assert.match(departmentRenderer, /getCoursesForAcademicUnit\(centre\.title\)/);
  assert.match(script, /function getCoursesForAcademicUnit\(unitName\)/);
  assert.match(script, /course\.department,/);
  assert.match(index, /class="academic-centre faculty-card"/);

  const courseRendererStart = script.indexOf("function renderCourses()");
  const courseRendererEnd = script.indexOf("function renderCourseCategory(id)", courseRendererStart);
  assert.ok(courseRendererStart >= 0 && courseRendererEnd > courseRendererStart);
  const courseRenderer = script.slice(courseRendererStart, courseRendererEnd);
  assert.match(courseRenderer, /createElement\("details", "course-category"\)/);
  assert.match(courseRenderer, /appendClonedContent\(disclosure, category\.source, false\)/);
  assert.match(script, /GNDU course-related enquiries \(BCA is listed; offering details are not stated\)/);
  [
    "Bachelor of Computer Applications (BCA)",
    "Bachelor of Hotel Management and Catering Technology (BHMCT)",
    "Master of Physical Education (M.P.Ed.)",
    "M.Sc. Physics (FYIC) (USHS)",
    "M.Sc. Physics</strong>",
    "bachelor's degree in any discipline with 50% marks",
    "one-year B.P.Ed. or four-year B.P.E. degree",
    "offering institution,",
    "Duration not verified",
  ].forEach((detail) => assert.ok(index.includes(detail), `Missing course catalogue detail: ${detail}`));

  const hostelNames = [
    "Sahibzada Jujhar Singh Boys Hostel-I",
    "Sahibzada Zorawar Singh Boys Hostel-II",
    "Sahibzada Fateh Singh Boys Hostel-III",
    "Mata Nanaki Girls Hostel-I",
    "Mata Nanaki Girls Hostel-II",
    "Mata Nanaki Girls Hostel-III",
    "Mata Nanaki Girls Hostel-IV",
    "Girls Hostel – Regional Campus, Jalandhar",
    "Boys Hostel – Regional Campus, Gurdaspur",
    "Girls Hostel – Regional Campus, Gurdaspur",
  ];
  hostelNames.forEach((name) => assert.ok(script.includes(name), `Missing hostel profile: ${name}`));
  assert.ok(script.indexOf("GNDU Main Campus Hostels") < script.indexOf("Regional Campus Hostels"));
  assert.match(script, /704 students/);
  assert.match(script, /About 550 students/);
  assert.match(script, /300 students/);
  assert.match(script, /Nearly 600 students/);
  assert.match(script, /General eligibility and application information published by GNDU/);
  assert.match(script, /https:\/\/digital\.gndu\.ac\.in\/Hostels\.aspx/);
  assert.match(script, /numbersofhostelwardens\.pdf/);
  assert.match(script, /https:\/\/gndu\.ac\.in\/hostel\/images\/bh3\.jpeg/);
  assert.match(script, /https:\/\/gndu\.ac\.in\/hostel\/images\/redhallboys\.jpeg/);
  assert.match(script, /231 students in 77 rooms/);
  assert.match(script, /Dr\. Sandeep Kaur/);

  const libraryStart = script.indexOf('if (id === "library")');
  const sportsStart = script.indexOf('if (id === "sports")', libraryStart);
  assert.ok(libraryStart >= 0 && sportsStart > libraryStart, "Library renderer should remain a separate route");
  const library = script.slice(libraryStart, sportsStart);
  assert.match(library, /Established in March 1970/);
  assert.match(library, /543,357 documents/);
  assert.match(library, /134 Indian and 52 foreign journals/);
  assert.match(library, /more than 13,000 e-journals/);
  assert.match(library, /24-hour air-conditioned reading hall with 250 seats/);
  assert.match(library, /Digital Lounge with 100 computer systems/);
  assert.match(library, /KOHA/);
  assert.match(library, /RFID-enabled library cards/);
  assert.match(library, /Online Public Access Catalogue \(OPAC\)/);
  assert.match(library, /Monday–Friday: 9:00 a\.m\.–9:00 p\.m\./);
  assert.match(library, /Rs\. 10 daily entry fee/);
  assert.match(library, /refundable Rs\. 5,000 security deposit/);
  assert.match(library, /Official GNDU pages give conflicting totals for rare books and manuscripts/);
  assert.match(library, /https:\/\/library\.gndu\.ac\.in\/Digital\.jpg/);
  assert.match(library, /Periodical Section \(First Floor\)/);
  assert.match(library, /Rare Books and Manuscript Section/);
  assert.match(library, /librarySlideEmbed/);
  assert.match(library, /g3684530c1e4_0_5/);
  assert.match(library, /slideFrame\.className = "library-slide-frame"/);
  assert.match(library, /Open the full 18-slide presentation/);
  assert.match(library, /presentationLink\.href = libraryPresentation/);
  assert.match(library, /presentationLink\.target = "_blank"/);
  assert.ok(script.includes('event.target.closest(".photo-grid a:not(.library-presentation-link)")'));
  assert.match(library, /https:\/\/library\.gndu\.ac\.in\/library-hours-and-holidays\.html/);
  assert.match(library, /https:\/\/library\.gndu\.ac\.in\/faqs\.html/);

  const sportsRouteStart = script.indexOf('if (id === "sports")');
  const studentLifeRouteStart = script.indexOf('if (id === "student-life")', sportsRouteStart);
  assert.ok(sportsRouteStart >= 0 && studentLifeRouteStart > sportsRouteStart, "Sports should remain an individual route");
  const sports = script.slice(sportsRouteStart, studentLifeRouteStart);
  [
    "Hockey Astro Turf Stadium",
    "Swimming Pool Stadium",
    "Multipurpose Indoor Gymnasium",
    "Velodrome and Shooting Range",
    "Tennis and Volleyball Courts",
    "Basketball, Football, and Cricket",
    "Athletics Facilities",
    "Archery and Judo",
    "Table Tennis, Carrom, and Handball",
    "Wrestling and weightlifting are not individually described",
    "trophy totals and do not consistently date those figures",
    "GNDU Prospectus 2025–26",
  ].forEach((detail) => assert.ok(sports.includes(detail), `Missing verified Sports content: ${detail}`));
  assert.equal((sports.match(/https:\/\/www\.gndusports\.org\/wpimages\//g) || []).length, 5);
  assert.match(sports, /https:\/\/www\.gndusports\.org\/infrastructure\.html/);
  assert.match(sports, /https:\/\/www\.gndusports\.org\/sports-achievements\.html/);

  const canteensStart = script.indexOf("function renderCanteens()");
  const canteenDetailStart = script.indexOf("function renderCanteen(id)", canteensStart);
  assert.ok(canteensStart >= 0 && canteenDetailStart > canteensStart, "Canteens should remain an individual route");
  const canteens = script.slice(canteensStart, script.indexOf("function renderHostelDetail(id)", canteenDetailStart));
  [
    "Boys' Hostel-I canteens",
    "Sahibzada Zorawar Singh Boys Hostel-II",
    "Sahibzada Fateh Singh Boys Hostel-III",
    "Mata Nanaki Girls Hostel-I and II",
    "Mata Nanaki Girls Hostel-IV",
    "Campus food courts and other outlets",
    "does not give an effective date",
    "food-court or outlet directory",
    "No identifiable canteen or food-court photograph was verified",
    "https://digital.gndu.ac.in/Hostels.aspx",
  ].forEach((detail) => assert.ok(canteens.includes(detail), `Missing verified Canteens content: ${detail}`));
});
