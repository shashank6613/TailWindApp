import express from "express";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import {
  KubeConfig,
  CoreV1Api,
  AppsV1Api,
  NetworkingV1Api,
  CustomObjectsApi,
  Log
} from "@kubernetes/client-node";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 8082;
// Serve everything under this base path so the app works at /k8ui
const BASE_PATH = process.env.BASE_PATH || "/k8ui";

const kc = new KubeConfig();
kc.loadFromDefault(); // works in-cluster or with kubeconfig if run locally

const core = kc.makeApiClient(CoreV1Api);
const apps = kc.makeApiClient(AppsV1Api);
const net = kc.makeApiClient(NetworkingV1Api);
const co = kc.makeApiClient(CustomObjectsApi);
const logClient = new Log(kc);

const app = express();
app.disable("x-powered-by");
app.use(morgan("tiny"));

// ---------- API ----------
const api = express.Router();

// cluster summary
api.get("/summary", async (_req, res) => {
  try {
    const [ns, pods, svcs, deps, ings] = await Promise.all([
      core.listNamespace(),
      core.listPodForAllNamespaces(),
      core.listServiceForAllNamespaces(),
      apps.listDeploymentForAllNamespaces(),
      net.listIngressForAllNamespaces()
    ]);

    // Try to fetch Argo CD Applications (if CRD exists)
    let argocdApps = { body: { items: [] } };
    try {
      argocdApps = await co.listClusterCustomObject(
        "argoproj.io", "v1alpha1", "applications"
      );
    } catch {
      // no CRD present; ignore
    }

    // Naive “presence” check for monitoring stack by common names/labels
    const allSvcs = svcs.body.items || [];
    const monitoring = {
      grafana: allSvcs.some(s => /grafana/i.test(s.metadata?.name || "")),
      prometheus: allSvcs.some(s => /prometheus/i.test(s.metadata?.name || "")),
      alertmanager: allSvcs.some(s => /alertmanager/i.test(s.metadata?.name || "")),
    };

    res.json({
      namespaces: ns.body.items.length,
      pods: pods.body.items.length,
      services: svcs.body.items.length,
      deployments: deps.body.items.length,
      ingresses: ings.body.items.length,
      argocdApplications: (argocdApps.body.items || []).length,
      monitoring
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// list resources
api.get("/namespaces", async (_req, res) => {
  try {
    const r = await core.listNamespace();
    res.json(r.body.items.map(n => n.metadata?.name));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

api.get("/resources", async (req, res) => {
  const ns = req.query.ns;
  try {
    const [
      pods, svcs, deps, ings
    ] = await Promise.all([
      ns ? core.listNamespacedPod(ns) : core.listPodForAllNamespaces(),
      ns ? core.listNamespacedService(ns) : core.listServiceForAllNamespaces(),
      ns ? apps.listNamespacedDeployment(ns) : apps.listDeploymentForAllNamespaces(),
      ns ? net.listNamespacedIngress(ns) : net.listIngressForAllNamespaces()
    ]);

    // ArgoCD Apps
    let argocdApps = { body: { items: [] } };
    try {
      argocdApps = ns
        ? await co.listNamespacedCustomObject("argoproj.io","v1alpha1", ns, "applications")
        : await co.listClusterCustomObject("argoproj.io","v1alpha1","applications");
    } catch { /* ignore */ }

    res.json({
      pods: pods.body.items,
      services: svcs.body.items,
      deployments: deps.body.items,
      ingresses: ings.body.items,
      argocdApplications: argocdApps.body.items || []
    });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// pod logs (last N lines)
api.get("/logs", async (req, res) => {
  const ns = req.query.ns;
  const pod = req.query.pod;
  const container = req.query.container;
  const tailLines = parseInt(req.query.tail || "200", 10);

  if (!ns || !pod) {
    res.status(400).json({ error: "ns and pod are required" });
    return;
  }

  try {
    const log = await new Promise((resolve, reject) => {
      let data = "";
      logClient.log(
        ns, pod, container || undefined,
        (chunk) => { data += chunk; },
        (err) => err ? reject(err) : resolve(data),
        { tailLines, timestamps: true, pretty: false, follow: false }
      );
    });
    res.type("text/plain").send(log);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.use(`${BASE_PATH}/api`, api);

// ---------- STATIC UI ----------
app.use(`${BASE_PATH}`, express.static(path.join(__dirname, "public"), {
  index: "index.html",
  extensions: ["html"]
}));

// health
app.get("/healthz", (_req, res) => res.send("ok"));

// root hint
app.get("/", (_req, res) => res.redirect(BASE_PATH));

app.listen(PORT, () => {
  console.log(`K8UI listening on :${PORT} basePath=${BASE_PATH}`);
});
