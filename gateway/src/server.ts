import "dotenv/config";
import cors from "cors";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "*", credentials: true }));

app.use((req: any, _res: any, next: any) => {
  console.log(`[gateway] ${req.method} ${req.url}`);
  next();
});

const authUrl = `http://localhost:${process.env.AUTH_PORT}`
const coreUrl = `http://localhost:${process.env.CORE_PORT}`
const outgoingUrl = `http://localhost:${process.env.OUTGOING_PORT}`
const incomingUrl = `http://localhost:${process.env.INCOMING_PORT}`

const supabaseFunctionsUrl =
  process.env.SUPABASE_FUNCTIONS_URL ||
  (process.env.SUPABASE_URL ? `${process.env.SUPABASE_URL}/functions/v1` : "");
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || "";

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "gateway" });
});

// Use pathFilter for v3 to avoid prefix stripping and ensure correct mapping
app.use(createProxyMiddleware({ 
  target: authUrl, 
  changeOrigin: true, 
  pathFilter: "/api/auth",
  pathRewrite: { "^/api/auth": "/auth" } 
}));

app.use(createProxyMiddleware({ 
  target: coreUrl, 
  changeOrigin: true, 
  ws: true,
  pathFilter: "/api/core",
  pathRewrite: { "^/api/core": "/core" } 
}));

app.use(createProxyMiddleware({ 
  target: coreUrl, 
  changeOrigin: true, 
  pathFilter: "/api/webhooks",
  pathRewrite: { "^/api/webhooks": "/core/webhooks" } 
}));

app.use(createProxyMiddleware({ 
  target: outgoingUrl, 
  changeOrigin: true, 
  pathFilter: "/api/outgoing",
  pathRewrite: { "^/api/outgoing": "/outgoing" } 
}));

app.use(createProxyMiddleware({ 
  target: incomingUrl, 
  changeOrigin: true, 
  pathFilter: "/api/incoming",
  pathRewrite: { "^/api/incoming": "/incoming" } 
}));

const edgeBackedFunctions: string[] = [];

if (supabaseFunctionsUrl) {
  for (const fnName of edgeBackedFunctions) {
    app.use(
      createProxyMiddleware({
        target: supabaseFunctionsUrl,
        changeOrigin: true,
        pathFilter: `/api/${fnName}`,
        pathRewrite: { [`^/api/${fnName}`]: `/${fnName}` },
        on: {
          proxyReq: (proxyReq: any) => {
            if (supabasePublishableKey) {
              proxyReq.setHeader("apikey", supabasePublishableKey);
            }
          },
        },
      })
    );
  }
}

const adminApiUrl = `http://localhost:${process.env.ADMIN_PORT}`;
app.use(createProxyMiddleware({ 
  target: adminApiUrl, 
  changeOrigin: true, 
  pathFilter: "/api/admin-api",
  pathRewrite: { "^/api/admin-api": "/admin-api" } 
}));

const leadsApiUrl = `http://localhost:${process.env.LEADS_PORT}`;
app.use(createProxyMiddleware({ 
  target: leadsApiUrl, 
  changeOrigin: true, 
  pathFilter: "/api/leads-api",
  pathRewrite: { "^/api/leads-api": "/leads-api" } 
}));

const dealsApiUrl = `http://localhost:${process.env.DEALS_PORT}`;
app.use(createProxyMiddleware({ 
  target: dealsApiUrl, 
  changeOrigin: true, 
  pathFilter: "/api/deals-api",
  pathRewrite: { "^/api/deals-api": "/deals-api" } 
}));

const teamApiUrl = `http://localhost:${process.env.TEAM_PORT}`;
app.use(createProxyMiddleware({ 
  target: teamApiUrl, 
  changeOrigin: true, 
  pathFilter: "/api/team-api",
  pathRewrite: { "^/api/team-api": "/team-api" } 
}));

const settingsApiUrl = `http://localhost:${process.env.SETTINGS_PORT}`;
app.use(createProxyMiddleware({ 
  target: settingsApiUrl, 
  changeOrigin: true, 
  pathFilter: "/api/settings-api",
  pathRewrite: { "^/api/settings-api": "/settings-api" } 
}));

const tasksApiUrl = `http://localhost:${process.env.TASKS_PORT}`;
app.use(createProxyMiddleware({ 
  target: tasksApiUrl, 
  changeOrigin: true, 
  pathFilter: "/api/tasks-api",
  pathRewrite: { "^/api/tasks-api": "/tasks-api" } 
}));

const meetingsApiUrl = `http://localhost:${process.env.MEETINGS_PORT}`;
app.use(createProxyMiddleware({ 
  target: meetingsApiUrl, 
  changeOrigin: true, 
  pathFilter: "/api/meetings-api",
  pathRewrite: { "^/api/meetings-api": "/meetings-api" } 
}));

const reportsApiUrl = `http://localhost:${process.env.REPORTS_PORT}`;
app.use(createProxyMiddleware({ 
  target: reportsApiUrl, 
  changeOrigin: true, 
  pathFilter: "/api/reports-api",
  pathRewrite: { "^/api/reports-api": "/reports-api" } 
}));

const attendanceApiUrl = `http://localhost:${process.env.ATTENDANCE_PORT}`;
app.use(createProxyMiddleware({ 
  target: attendanceApiUrl, 
  changeOrigin: true, 
  pathFilter: "/api/attendance-api",
  pathRewrite: { "^/api/attendance-api": "/attendance-api" } 
}));

const workflowsApiUrl = `http://localhost:${process.env.WORKFLOWS_PORT}`;
app.use(createProxyMiddleware({ 
  target: workflowsApiUrl, 
  changeOrigin: true, 
  pathFilter: "/api/workflows-api",
  pathRewrite: { "^/api/workflows-api": "/workflows-api" } 
}));

const workflowRunnerUrl = `http://localhost:${process.env.WORKFLOW_RUNNER_PORT}`;
app.use(createProxyMiddleware({ 
  target: workflowRunnerUrl, 
  changeOrigin: true, 
  pathFilter: "/api/workflow-runner",
  pathRewrite: { "^/api/workflow-runner": "/workflow-runner" } 
}));

const integrationManagerUrl = `http://localhost:${process.env.INTEGRATION_MANAGER_PORT}`;
app.use(createProxyMiddleware({ 
  target: integrationManagerUrl, 
  changeOrigin: true, 
  pathFilter: "/api/integration-manager",
  pathRewrite: { "^/api/integration-manager": "/integration-manager" } 
}));

const campaignsApiUrl = `http://localhost:${process.env.CAMPAIGNS_PORT}`;
app.use(createProxyMiddleware({ 
  target: campaignsApiUrl, 
  changeOrigin: true, 
  pathFilter: "/api/campaigns-api",
  pathRewrite: { "^/api/campaigns-api": "/campaigns-api" } 
}));

const communicationsApiUrl = `http://localhost:${process.env.COMMUNICATIONS_PORT}`;
app.use(createProxyMiddleware({ 
  target: communicationsApiUrl, 
  changeOrigin: true, 
  pathFilter: "/api/communications-api",
  pathRewrite: { "^/api/communications-api": "/communications-api" } 
}));

const commissionsApiUrl = `http://localhost:${process.env.COMMISSIONS_PORT}`;
app.use(createProxyMiddleware({ 
  target: commissionsApiUrl, 
  changeOrigin: true, 
  pathFilter: "/api/commissions-api",
  pathRewrite: { "^/api/commissions-api": "/commissions-api" } 
}));

const apiKeysApiUrl = `http://localhost:${process.env.API_KEYS_PORT}`;
app.use(createProxyMiddleware({ 
  target: apiKeysApiUrl, 
  changeOrigin: true, 
  pathFilter: "/api/api-keys-api",
  pathRewrite: { "^/api/api-keys-api": "/api-keys-api" } 
}));

const callingApiUrl = `http://localhost:${process.env.CALLING_PORT}`;
app.use(createProxyMiddleware({ 
  target: callingApiUrl, 
  changeOrigin: true, 
  pathFilter: "/api/calling-api",
  pathRewrite: { "^/api/calling-api": "/calling-api" } 
}));

const webhooksApiUrl = `http://localhost:${process.env.WEBHOOKS_PORT}`;
app.use(createProxyMiddleware({ 
  target: webhooksApiUrl, 
  changeOrigin: true, 
  pathFilter: "/api/webhooks-api",
  pathRewrite: { "^/api/webhooks-api": "/webhooks-api" } 
}));

const healthApiUrl = `http://localhost:${process.env.HEALTH_PORT}`;
app.use(createProxyMiddleware({ 
  target: healthApiUrl, 
  changeOrigin: true, 
  pathFilter: "/api/health",
  pathRewrite: { "^/api/health": "/health" } 
}));

const billingApiUrl = `http://localhost:${process.env.BILLING_PORT}`;
app.use(createProxyMiddleware({ 
  target: billingApiUrl, 
  changeOrigin: true, 
  pathFilter: "/api/billing-api",
  pathRewrite: { "^/api/billing-api": "/billing-api" } 
}));

const adsManagerApiUrl = `http://localhost:${process.env.ADS_MANAGER_PORT}`;
app.use(createProxyMiddleware({ 
  target: adsManagerApiUrl, 
  changeOrigin: true, 
  pathFilter: "/api/ads-manager-api",
  pathRewrite: { "^/api/ads-manager-api": "/ads-manager-api" } 
}));

const port = Number(process.env.GATEWAY_PORT || 8080);
app.listen(port, () => {
  console.log(`[gateway] listening on ${port}`);
});
