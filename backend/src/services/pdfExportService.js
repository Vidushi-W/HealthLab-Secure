/**
 * PDF export service.
 * Builds researcher reports for documentation and analysis.
 */

const PDFDocument = require("pdfkit");

const TITLE = "Health Lab – Researcher Report";
const MARGIN = 50;
const FONT_TITLE = 18;
const FONT_SUBTITLE = 10;
const FONT_ROW = 12;
const FONT_DETAIL = 10;
const PURPOSE_MAX_LEN = 200;
const NOTES_MAX_LEN = 80;

/**
 * Pipe a researcher report PDF to the given response stream.
 * @param {Array} researchers - List of researcher docs (with populated user, reviewedBy)
 * @param {object} res - Express response object (stream)
 */
function pipeResearchersReportToResponse(researchers, res) {
  const filename = `researchers-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  const doc = new PDFDocument({ margin: MARGIN });
  doc.pipe(res);

  doc.fontSize(FONT_TITLE).text(TITLE, { align: "center" });
  doc.moveDown();
  doc.fontSize(FONT_SUBTITLE).text(`Generated: ${new Date().toISOString()}`, { align: "center" });
  doc.moveDown(2);

  researchers.forEach((r, i) => {
    const u = r.user || {};
    doc.fontSize(FONT_ROW).text(`${i + 1}. ${u.name || "—"} (${u.email || "—"})`, { continued: false });
    doc.fontSize(FONT_DETAIL);
    doc.text(`   Role: ${u.role || "—"} | Researcher status: ${r.status}`);
    doc.text(`   NIC: ${r.nic || "—"} | Gender: ${r.gender || "—"} | Workplace: ${r.currentWorkplace || "—"}`);
    doc.text(`   Qualification: ${r.highestAcademicQualification || "—"} | Type: ${r.researcherType || "—"}`);
    const purpose = (r.purpose || "").slice(0, PURPOSE_MAX_LEN);
    doc.text(`   Purpose: ${purpose}${(r.purpose && r.purpose.length > PURPOSE_MAX_LEN) ? "..." : ""}`);
    if (r.reviewedAt) {
      const notes = r.reviewNotes ? ` – ${r.reviewNotes.slice(0, NOTES_MAX_LEN)}` : "";
      doc.text(`   Reviewed: ${r.reviewedAt.toISOString().slice(0, 10)}${notes}`);
    }
    doc.moveDown(1);
  });

  doc.end();
}

module.exports = {
  pipeResearchersReportToResponse,
};
