import { parseVtopMarksTableHtml } from "../src/lib/parseVtopMarksTable";

describe("parseVtopMarksTableHtml", () => {
  it("extracts rows with course code and numeric scores", () => {
    const html = `
      <table>
        <tr><td>CAT-I</td><td>BCSE203E</td><td>Theory</td><td>40</td><td>50</td></tr>
        <tr><td>Internal</td><td>MATH101</td><td>—</td><td>18</td><td>20</td></tr>
      </table>
    `;
    const rows = parseVtopMarksTableHtml(html);
    expect(rows.length).toBe(2);
    expect(rows[0]).toMatchObject({
      courseCode: "BCSE203E",
      component: "CAT-I",
      scored: 40,
      maxScore: 50,
    });
    expect(rows[1].courseCode).toBe("MATH101");
  });

  it("returns empty for tables without course codes", () => {
    const html = `<table><tr><td>foo</td><td>bar</td><td>1</td></tr></table>`;
    expect(parseVtopMarksTableHtml(html)).toEqual([]);
  });
});
