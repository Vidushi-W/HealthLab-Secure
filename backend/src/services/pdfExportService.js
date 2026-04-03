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

/**
 * Pipe an admin overview analytics report PDF to the given response stream.
 * @param {object} analytics - Analytics payload from analyticsService.getDashboardStats
 * @param {object} res - Express response object (stream)
 * @param {number} days - Number of days used for trend generation
 */
function pipeOverviewReportToResponse(analytics, res, days) {
  const filename = `admin-overview-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  const doc = new PDFDocument({ margin: MARGIN });
  doc.pipe(res);

  const summary = analytics?.summary || {};
  const userRoles = analytics?.userRoles || {};
  const researcherStatus = analytics?.researcherStatus || {};
  const qualifications = Array.isArray(analytics?.qualifications) ? analytics.qualifications : [];
  const trend = Array.isArray(analytics?.registrationTrend) ? analytics.registrationTrend : [];

  doc.fontSize(FONT_TITLE).text("Health Lab - Admin Overview Report", { align: "center" });
  doc.moveDown();
  doc.fontSize(FONT_SUBTITLE).text(`Generated: ${new Date().toISOString()}`, { align: "center" });
  doc.fontSize(FONT_SUBTITLE).text(`Range: Last ${days} days`, { align: "center" });
  doc.moveDown(2);

  doc.fontSize(14).text("Summary", { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(FONT_DETAIL);
  doc.text(`Total Users: ${Number(summary.totalUsers || 0)}`);
  doc.text(`Total Researchers: ${Number(summary.totalResearchers || 0)}`);
  doc.text(`Pending Researchers: ${Number(summary.pendingResearchers || 0)}`);
  doc.text(`Approved Researchers: ${Number(summary.approvedResearchers || 0)}`);
  doc.text(`Rejected Researchers: ${Number(summary.rejectedResearchers || 0)}`);
  doc.text(`New Users This Week: ${Number(summary.newUsersThisWeek || 0)}`);
  doc.text(`Growth Rate: ${Number(summary.growthRate || 0)}%`);
  doc.moveDown(1.5);

  doc.fontSize(14).text("User Role Distribution", { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(FONT_DETAIL);
  const roleEntries = Object.entries(userRoles);
  if (roleEntries.length === 0) {
    doc.text("No role distribution data available.");
  } else {
    roleEntries.forEach(([name, value]) => {
      doc.text(`${name}: ${Number(value || 0)}`);
    });
  }
  doc.moveDown(1.5);

  doc.fontSize(14).text("Researcher Status Distribution", { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(FONT_DETAIL);
  const statusEntries = Object.entries(researcherStatus);
  if (statusEntries.length === 0) {
    doc.text("No researcher status data available.");
  } else {
    statusEntries.forEach(([name, value]) => {
      doc.text(`${name}: ${Number(value || 0)}`);
    });
  }
  doc.moveDown(1.5);

  doc.fontSize(14).text("Top Qualifications", { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(FONT_DETAIL);
  if (qualifications.length === 0) {
    doc.text("No qualification data available.");
  } else {
    qualifications.slice(0, 15).forEach((row, idx) => {
      doc.text(`${idx + 1}. ${row?.name || "Unspecified"}: ${Number(row?.count || 0)}`);
    });
  }
  doc.moveDown(1.5);

  doc.fontSize(14).text("Registration Trend", { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(FONT_DETAIL);
  if (trend.length === 0) {
    doc.text("No registration trend data available.");
  } else {
    trend.forEach((row) => {
      doc.text(`${row?.date || "Unknown date"}: ${Number(row?.count || 0)}`);
      if (doc.y > doc.page.height - 60) {
        doc.addPage();
      }
    });
  }

  doc.end();
}

module.exports = {
  pipeResearchersReportToResponse,
  pipeOverviewReportToResponse,
};
