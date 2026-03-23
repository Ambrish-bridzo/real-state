import "dotenv/config";
import express from "express";
import { getRequestContext } from "../../../shared/src/auth";
import { connectDB } from "../../../shared/src/mongodb";
import { Workflow, WorkflowRun, WorkflowRunStep } from "../../../shared/src/models/workflow";

const app = express();
app.use(express.json());

connectDB();

app.get("/health", (_req: express.Request, res: express.Response) => res.json({ status: "ok", service: "workflow-runner" }));

// ─── WORKFLOW EXECUTION CORE ───
async function executeWorkflow(runId: string, workflow: any, triggerData: any) {
  const nodes = workflow.nodes || [];
  let context = { ...triggerData };

  await WorkflowRun.findByIdAndUpdate(runId, { status: "running", started_at: new Date() });

  for (const node of nodes) {
    try {
      let output: any = {};
      // Simplified execution logic from Edge Function
      switch (node.type) {
        case "trigger": output = { triggered: true }; break;
        case "condition": output = { passed: true }; break; // Simplified
        case "action": output = { success: true }; break; // Simplified
      }

      await WorkflowRunStep.create({
        run_id: runId,
        node_id: node.id,
        node_type: node.type,
        status: "completed",
        input_data: context,
        output_data: output,
        started_at: new Date(),
        finished_at: new Date()
      });
      context = { ...context, ...output };
    } catch (err) {
      await WorkflowRun.findByIdAndUpdate(runId, { status: "failed", error_message: String(err) });
      return;
    }
  }

  await WorkflowRun.findByIdAndUpdate(runId, { status: "completed", finished_at: new Date() });
  if (workflow && workflow._id) {
    await Workflow.findByIdAndUpdate(workflow._id, { last_run_at: new Date() });
  }
}

// ─── ENDPOINTS ───
app.post("/workflow-runner/process-triggers", async (req: express.Request, res: express.Response) => {
  const { trigger_type, trigger_data } = req.body;
  // This is usually called internally by DB webhooks or cron
  const workflows = await Workflow.find({
    company_id: trigger_data.company_id,
    is_active: true
  });

  for (const wf of workflows || []) {
    const triggerNode = (wf.nodes as any[])?.find(n => n.type === "trigger");
    if (triggerNode?.config?.event === trigger_type) {
      const run = await WorkflowRun.create({
        workflow_id: wf._id.toString(),
        company_id: wf.company_id,
        trigger_type,
        trigger_data,
        status: "pending"
      });
      if (run) executeWorkflow(run._id.toString(), wf, trigger_data);
    }
  }
  return res.json({ status: "triggered" });
});

app.use(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path === "/health" || req.path === "/process-triggers") return next();
  const ctx = await getRequestContext(req);
  if (!ctx) return res.status(401).json({ error: "Unauthorized" });
  (req as any).context = ctx;
  next();
});

app.post("/workflow-runner/run/:id", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  const { id } = req.params;
  const workflow = await Workflow.findOne({ _id: id, company_id: ctx.companyId });
  if (!workflow) return res.status(404).json({ error: "Workflow not found" });

  const run = await WorkflowRun.create({
    workflow_id: id as string,
    company_id: ctx.companyId as string,
    trigger_type: "manual",
    trigger_data: { triggered_by: ctx.userId },
    status: "pending"
  });

  if (run) executeWorkflow(run._id.toString(), workflow, { triggered_by: ctx.userId });
  return res.json(run);
});

app.get("/workflow-runner/runs", async (req: express.Request, res: express.Response) => {
  const ctx = (req as any).context;
  // Simplified: Not doing the count here for now, or could use aggregation
  const data = await WorkflowRun.find({ company_id: String(ctx.companyId) })
    .sort({ createdAt: -1 })
    .limit(50);
  return res.json({ runs: data });
});

const port = Number(process.env.WORKFLOW_RUNNER_PORT || 8095);
app.listen(port, () => console.log(`[workflow-runner] listening on ${port}`));
