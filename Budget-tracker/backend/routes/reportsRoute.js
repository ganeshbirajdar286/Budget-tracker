import express from "express";
import pool from "../config/db.js";
import verifyToken from "../middlewares/authMiddleware.js";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

const router = express.Router();

async function buildReportData(userId) {
  const totalsQ = await pool.query(
    `SELECT
       COALESCE(SUM(CASE WHEN type='income' THEN amount END),0)::numeric AS total_income,
       COALESCE(SUM(CASE WHEN type='expense' THEN amount END),0)::numeric AS total_expense
     FROM transactions
     WHERE user_id = $1`,
    [userId]
  );
  const totals = totalsQ.rows[0] || { total_income: 0, total_expense: 0 };
  const net_savings = Number(totals.total_income) - Number(totals.total_expense);

  const byCatQ = await pool.query(
    `SELECT COALESCE(c.name, 'Uncategorized') AS name, COALESCE(SUM(t.amount),0)::numeric AS total
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.category_id
     WHERE t.user_id = $1 AND t.type = 'expense'
     GROUP BY name
     ORDER BY total DESC`,
    [userId]
  );

  const monthlyQ = await pool.query(
    `SELECT to_char(date_trunc('month', transaction_date), 'Mon YYYY') AS month,
            SUM(CASE WHEN type='income' THEN amount ELSE 0 END)::numeric AS income,
            SUM(CASE WHEN type='expense' THEN amount ELSE 0 END)::numeric AS expenses
     FROM transactions
     WHERE user_id = $1
       AND transaction_date >= (date_trunc('month', now()) - interval '11 months')
     GROUP BY date_trunc('month', transaction_date)
     ORDER BY date_trunc('month', transaction_date)`,
    [userId]
  );

  const merchantsQ = await pool.query(
    `SELECT merchant, SUM(amount)::numeric AS total, COUNT(*) AS count
     FROM transactions
     WHERE user_id = $1 AND type = 'expense' AND merchant IS NOT NULL
     GROUP BY merchant
     ORDER BY total DESC
     LIMIT 10`,
    [userId]
  );

  const recentQ = await pool.query(
    `SELECT t.*, c.name AS category_name
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.category_id
     WHERE t.user_id = $1
     ORDER BY t.transaction_date DESC
     LIMIT 200`,
    [userId]
  );

  let budgetsRows = [];
  try {
    const budgetsQ = await pool.query(`SELECT * FROM budgets WHERE user_id = $1 ORDER BY updated_at DESC`, [userId]);
    budgetsRows = budgetsQ.rows;
  } catch (e) {
    budgetsRows = [];
  }

  return {
    generated_at: new Date().toISOString(),
    totals: {
      total_income: Number(totals.total_income),
      total_expense: Number(totals.total_expense),
      net_savings: Number(net_savings),
    },
    by_category: byCatQ.rows.map(r => ({ name: r.name, total: Number(r.total) })),
    monthly: monthlyQ.rows.map(r => ({ month: r.month, income: Number(r.income), expenses: Number(r.expenses) })),
    top_merchants: merchantsQ.rows.map(r => ({ merchant: r.merchant, total: Number(r.total), count: Number(r.count) })),
    budgets: budgetsRows,
    recent_transactions: recentQ.rows,
  };
}

// GET /api/reports/export/excel
router.get("/export/excel", verifyToken, async (req, res) => {
  const userId = req.user?.user_id || req.user?.id;
  if (!userId) return res.status(400).json({ error: "Invalid user" });

  try {
    const report = await buildReportData(userId);

    const wb = new ExcelJS.Workbook();
    wb.creator = "BudgetTracker";
    wb.created = new Date();

    // Summary sheet
    const summary = wb.addWorksheet("Summary");
    summary.columns = [{ header: "Metric", key: "metric" }, { header: "Value", key: "value" }];
    summary.addRow({ metric: "Generated At", value: report.generated_at });
    summary.addRow({ metric: "Total Income", value: report.totals.total_income });
    summary.addRow({ metric: "Total Expense", value: report.totals.total_expense });
    summary.addRow({ metric: "Net Savings", value: report.totals.net_savings });

    // By Category
    const catSheet = wb.addWorksheet("By Category");
    catSheet.columns = [{ header: "Category", key: "category" }, { header: "Total", key: "total" }];
    report.by_category.forEach(r => catSheet.addRow({ category: r.name, total: r.total }));

    // Monthly
    const monthly = wb.addWorksheet("Monthly");
    monthly.columns = [
      { header: "Month", key: "month" },
      { header: "Income", key: "income" },
      { header: "Expenses", key: "expenses" },
    ];
    report.monthly.forEach(r => monthly.addRow({ month: r.month, income: r.income, expenses: r.expenses }));

    // Top merchants
    const merchants = wb.addWorksheet("Top Merchants");
    merchants.columns = [{ header: "Merchant", key: "merchant" }, { header: "Total", key: "total" }, { header: "Count", key: "count" }];
    report.top_merchants.forEach(m => merchants.addRow({ merchant: m.merchant, total: m.total, count: m.count }));

    // Recent transactions
    const tx = wb.addWorksheet("Recent Transactions");
    const txCols = Object.keys(report.recent_transactions[0] || {}).slice(0, 30); // limit columns
    tx.columns = txCols.map(c => ({ header: c, key: c }));
    report.recent_transactions.forEach(r => {
      // ensure numeric/strings are serializable
      const row = {};
      txCols.forEach(c => row[c] = r[c]);
      tx.addRow(row);
    });

    const buffer = await wb.xlsx.writeBuffer();
    const filename = `budget-report-${new Date().toISOString().replace(/[:.]/g, "-")}.xlsx`;

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("Excel export error:", err);
    res.status(500).json({ error: "Failed to generate Excel report" });
  }
});

// GET /api/reports/export/pdf
router.get("/export/pdf", verifyToken, async (req, res) => {
  const userId = req.user?.user_id || req.user?.id;
  if (!userId) return res.status(400).json({ error: "Invalid user" });

  try {
    const report = await buildReportData(userId);
    const filename = `budget-report-${new Date().toISOString().replace(/[:.]/g, "-")}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ size: "A4", margin: 40 });
    doc.pipe(res);

    // Title
    doc.fontSize(18).fillColor("#8b5cf6").text("Budget Tracker — Report", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#d1c4e9").text(`Generated at: ${report.generated_at}`, { align: "center" });
    doc.moveDown(1);

    // Totals
    doc.fontSize(12).fillColor("#fff").text("Summary", { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor("#fff");
    doc.text(`Total Income: ₹${report.totals.total_income.toLocaleString("en-IN")}`);
    doc.text(`Total Expense: ₹${report.totals.total_expense.toLocaleString("en-IN")}`);
    doc.text(`Net Savings: ₹${report.totals.net_savings.toLocaleString("en-IN")}`);
    doc.moveDown(0.6);

    // By category (top 10)
    doc.fontSize(12).fillColor("#fff").text("Top Categories", { underline: true });
    doc.moveDown(0.3);
    report.by_category.slice(0, 20).forEach((c, i) => {
      doc.fontSize(10).fillColor("#fff").text(`${i + 1}. ${c.name} — ₹${Number(c.total).toLocaleString("en-IN")}`);
    });
    doc.moveDown(0.6);

    // Top merchants
    doc.fontSize(12).fillColor("#fff").text("Top Merchants", { underline: true });
    doc.moveDown(0.3);
    report.top_merchants.forEach((m, i) => {
      doc.fontSize(10).text(`${i + 1}. ${m.merchant} — ₹${Number(m.total).toLocaleString("en-IN")} (${m.count} tx)`);
    });
    doc.moveDown(0.6);

    // Recent transactions (first 30)
    doc.fontSize(12).fillColor("#fff").text("Recent Transactions (latest)", { underline: true });
    doc.moveDown(0.3);
    const recent = report.recent_transactions.slice(0, 30);
    recent.forEach((t) => {
      const date = new Date(t.transaction_date).toLocaleDateString();
      doc.fontSize(10).text(`${date} — ${t.description || t.merchant || "Tx"} — ${t.type} — ₹${Number(t.amount).toLocaleString("en-IN")}`);
    });

    doc.end();
  } catch (err) {
    console.error("PDF export error:", err);
    res.status(500).json({ error: "Failed to generate PDF report" });
  }
});

export default router;