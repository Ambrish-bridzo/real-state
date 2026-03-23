import "dotenv/config";
import express from "express";
import { getRequestContext } from "../../../shared/src/auth";
import { connectDB } from "../../../shared/src/mongodb";
import { BillingTransaction, BillingUsage, BillingCoupon } from "../../../shared/src/models/billing";
import { Company } from "../../../shared/src/models/company_profile";
import { Plan } from "../../../shared/src/models/lead_plan";

const app = express();
app.use(express.json());

connectDB();

app.get("/health", (_req: express.Request, res: express.Response) => res.json({ status: "ok", service: "billing-api" }));

// ─── MIDDLEWARE: AUTH ───
app.use(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path === "/health" || req.path.startsWith("/billing-api/webhooks")) return next();

  const ctx = await getRequestContext(req);
  if (!ctx) return res.status(401).json({ error: "Unauthorized" });

  (req as any).context = ctx;
  next();
});

// Admin Middleware
const adminOnly = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const ctx = (req as any).context;
  if (!ctx || (ctx.role !== "owner" && ctx.role !== "super_admin")) {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }
  next();
};

// ─── BILLING OVERVIEW & USAGE ───
app.get("/billing-api/overview", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  try {
    const usage = await BillingUsage.findOne({ company_id: ctx.companyId }).sort({ billing_period_start: -1 });
    const company = await Company.findById(ctx.companyId, 'plan plan_id subscription_status next_billing_date');

    if (!company) return res.status(404).json({ error: "Company not found" });

    return res.json({ usage, company });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── TRANSACTIONS / INVOICES ───
app.get("/billing-api/invoices", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  try {
    const transactions = await BillingTransaction.find({ company_id: ctx.companyId }).sort({ createdAt: -1 });

    // Manually join plan info if needed, or assume it's good
    return res.json(transactions);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── COUPONS ───
app.get("/billing-api/coupons", async (req: express.Request, res: express.Response) => {
  try {
    const coupons = await BillingCoupon.find({ is_active: true });
    return res.json(coupons);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── RAZORPAY ORDER CREATION ───
app.post("/billing-api/create-order", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const { planId, billingCycle } = req.body;

  if (!planId) return res.status(400).json({ error: "planId required" });

  try {
    const plan = await Plan.findById(planId);
    if (!plan) return res.status(404).json({ error: "Plan not found" });

    const amount = billingCycle === "yearly" ? plan.price_yearly : plan.price_monthly;
    if (!amount) return res.status(400).json({ error: "Invalid billing cycle for this plan" });

    // Mock Razorpay Order for now
    const dummyOrderId = `order_${Math.random().toString(36).substring(7)}`;

    const transaction = await BillingTransaction.create({
      company_id: ctx.companyId,
      razorpay_order_id: dummyOrderId,
      amount: amount * 100, // in paise
      plan_id: planId,
      billing_cycle: billingCycle,
      status: "created"
    });

    return res.json({
      order_id: dummyOrderId,
      amount: amount * 100,
      currency: "INR",
      key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_dummy"
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── PAYMENT VERIFICATION ───
app.post("/billing-api/verify-payment", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  try {
    const tx = await BillingTransaction.findOneAndUpdate(
      { razorpay_order_id },
      {
        razorpay_payment_id,
        razorpay_signature,
        status: "paid"
      },
      { new: true }
    );

    if (!tx) return res.status(404).json({ error: "Transaction not found" });

    // Update company plan
    await Company.findByIdAndUpdate(ctx.companyId, {
      plan_id: tx.plan_id,
      subscription_status: "active",
      next_billing_date: new Date(Date.now() + (tx.billing_cycle === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000)
    });

    return res.json({ success: true, plan_id: tx.plan_id });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── ADMIN: ALL TRANSACTIONS ───
app.get("/billing-api/admin/transactions", adminOnly, async (req: express.Request, res: express.Response) => {
  try {
    const transactions = await BillingTransaction.find().sort({ createdAt: -1 });
    return res.json(transactions);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

const port = Number(process.env.BILLING_API_PORT || 8110);
app.listen(port, () => console.log(`[billing-api] listening on ${port}`));
