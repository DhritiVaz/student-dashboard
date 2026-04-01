import {
  parseVtopGradeHistoryHtml,
  normVtopSemesterLabel,
  buildSemesterSummariesFromCourses,
} from "../src/lib/parseVtopGradeHistory";

describe("parseVtopGradeHistoryHtml", () => {
  it("parses CGPA, semester headers, courses, and semester GPA row", () => {
    const html = `
      <html><body>
        <p>Your CGPA : 8.45</p>
        <table>
          <tr><th colspan="6">Fall Semester 2024-25</th></tr>
          <tr><td>1</td><td>CSE1001</td><td>Intro</td><td>4</td><td>A</td><td>9</td></tr>
          <tr><td colspan="6">GPA : 9.00</td></tr>
          <tr><th colspan="6">Winter Semester 2023-24</th></tr>
          <tr><td>1</td><td>BMAT202P</td><td>Statistics Lab</td><td>1</td><td>S</td><td>10</td></tr>
        </table>
      </body></html>`;
    const p = parseVtopGradeHistoryHtml(html);
    expect(p.cgpaFromPortal).toBe(8.45);
    expect(p.semesters.map((s) => s.semesterLabel)).toEqual([
      "Fall Semester 2024-25",
      "Winter Semester 2023-24",
    ]);
    expect(p.semesters[0].gpaFromPortal).toBe(9);
    expect(p.rows).toHaveLength(2);
    expect(p.rows[0]).toMatchObject({
      semesterLabel: "Fall Semester 2024-25",
      courseCode: "CSE1001",
      credits: 4,
      grade: "A",
      gradePoint: 9,
    });
    expect(p.rows[1].semesterLabel).toBe("Winter Semester 2023-24");
  });

  it("normalizes empty semester to Unknown", () => {
    expect(normVtopSemesterLabel(null)).toBe("Unknown");
    expect(normVtopSemesterLabel("   ")).toBe("Unknown");
  });

  it("parses rows when course code is first column (no Sl.No)", () => {
    const html = `
      <html><body>
        <p>CGPA-8.12</p>
        <table>
          <tr><th colspan="5">Monsoon Semester 2024-25</th></tr>
          <tr><td>CSE1001</td><td>Problem Solving</td><td>4</td><td>B</td><td>8</td></tr>
          <tr><td>BMAT202P</td><td>Statistics Lab</td><td>1</td><td>S</td><td>10</td></tr>
        </table>
      </body></html>`;
    const p = parseVtopGradeHistoryHtml(html);
    expect(p.cgpaFromPortal).toBe(8.12);
    expect(p.rows).toHaveLength(2);
    expect(p.rows[0].courseCode).toBe("CSE1001");
    expect(p.rows[0].credits).toBe(4);
    expect(p.rows[1].courseCode).toBe("BMAT202P");
  });

  it("parses VTOP CC examinations layout: h4 + Sl.No header + type column", () => {
    const html = `
      <html><body>
        <p>CGPA : 8.20</p>
        <h4>Winter Semester 2025-26</h4>
        <table>
          <tr>
            <th>Sl.No</th><th>Course Code</th><th>Course Title</th><th>Course Type</th>
            <th>Credits</th><th>Grade</th><th>Grade Point</th><th>Result</th>
          </tr>
          <tr>
            <td>1</td><td>CSE1001</td><td>Problem Solving</td><td>ETH</td>
            <td>4</td><td>A</td><td>9</td><td>Pass</td>
          </tr>
          <tr>
            <td>2</td><td>BSTS101P</td><td>Soft Skills</td><td>SS</td>
            <td>2</td><td>S</td><td></td><td>Pass</td>
          </tr>
        </table>
        <h4>Fall Semester 2024-25</h4>
        <table>
          <tr>
            <th>Sl.No</th><th>Course Code</th><th>Course Title</th><th>Credits</th><th>Grade</th><th>Grade Point</th>
          </tr>
          <tr>
            <td>1</td><td>BMAT202P</td><td>Stats Lab</td><td>1</td><td>S</td><td>10</td>
          </tr>
        </table>
      </body></html>`;
    const p = parseVtopGradeHistoryHtml(html);
    expect(p.cgpaFromPortal).toBe(8.2);
    expect(p.rows).toHaveLength(3);
    const w = p.rows.filter((r) => r.courseCode === "CSE1001")[0];
    expect(w.semesterLabel).toBe("Winter Semester 2025-26");
    expect(w.credits).toBe(4);
    expect(w.grade).toBe("A");
    expect(w.gradePoint).toBe(9);
    expect(w.category).toBe("ETH");
    const srow = p.rows.filter((r) => r.courseCode === "BSTS101P")[0];
    expect(srow.grade).toBe("S");
    expect(srow.gradePoint).toBe(10);
    const f = p.rows.filter((r) => r.courseCode === "BMAT202P")[0];
    expect(f.semesterLabel).toBe("Fall Semester 2024-25");
  });

  it("parses rows with VTOP session/duration column between title and credits", () => {
    const html = `
      <html><body>
        <p>CGPA : 8.00</p>
        <h4>CH20242505</h4>
        <table>
          <tr>
            <th>Sl.No</th><th>Course Code</th><th>Course Title</th><th>Session</th>
            <th>Credits</th><th>Grade</th><th>Grade Point</th>
          </tr>
          <tr>
            <td>1</td><td>BCHY101L</td><td>Engineering Chemistry</td><td>Apr-2025 - 02-Jun-2025</td>
            <td>3</td><td>A</td><td>9</td>
          </tr>
          <tr>
            <td>2</td><td>BSTS101P</td><td>Quantitative Skills Practice I</td><td>Apr-2025 - 20-May-2025</td>
            <td>1.5</td><td>S</td><td>10</td>
          </tr>
        </table>
      </body></html>`;
    const p = parseVtopGradeHistoryHtml(html);
    const bchy = p.rows.find((r) => r.courseCode === "BCHY101L");
    expect(bchy).toBeDefined();
    expect(bchy!.credits).toBe(3);
    expect(bchy!.grade).toBe("A");
    expect(bchy!.gradePoint).toBe(9);
    expect(bchy!.slot).toMatch(/Apr-2025/i);
    const bsts = p.rows.find((r) => r.courseCode === "BSTS101P");
    expect(bsts!.credits).toBe(1.5);
    expect(bsts!.grade).toBe("S");
    expect(bsts!.gradePoint).toBe(10);
  });

  it("repairs shifted row when session column breaks naive tail parse (no Sl.No header map)", () => {
    const html = `
      <html><body>
        <table>
          <tr><th colspan="7">CH20242505</th></tr>
          <tr>
            <td>BCHY101L</td><td>Engineering Chemistry</td><td>Apr-2025 - 02-Jun-2025</td>
            <td>3</td><td>A</td><td>9</td>
          </tr>
        </table>
      </body></html>`;
    const p = parseVtopGradeHistoryHtml(html);
    expect(p.rows).toHaveLength(1);
    expect(p.rows[0].credits).toBe(3);
    expect(p.rows[0].grade).toBe("A");
    expect(p.rows[0].gradePoint).toBe(9);
    expect(p.rows[0].slot).toMatch(/Apr-2025/i);
  });

  it("buildSemesterSummariesFromCourses preserves order and GPAs", () => {
    const rows = [
      { semesterLabel: "S1", courseCode: "A", courseName: "", credits: null, grade: null, gradePoint: null, faculty: null, slot: null, category: null },
      { semesterLabel: "S2", courseCode: "B", courseName: "", credits: null, grade: null, gradePoint: null, faculty: null, slot: null, category: null },
      { semesterLabel: "S1", courseCode: "C", courseName: "", credits: null, grade: null, gradePoint: null, faculty: null, slot: null, category: null },
    ];
    const g = new Map<string, number>([["S1", 8.5]]);
    const s = buildSemesterSummariesFromCourses(rows as any, g);
    expect(s.map((x) => x.semesterLabel)).toEqual(["S1", "S2"]);
    expect(s[0].gpaFromPortal).toBe(8.5);
    expect(s[1].gpaFromPortal).toBeNull();
  });
});
