(function () {
  // --- FIXED BASE PATH DETECTION ---
  const BASE = (new URL(document.currentScript.src)).pathname.replace(/\/app\.js$/, "");
  const API = BASE + "/api";

  // Tabs
  const tabs = document.querySelectorAll(".tab");
  const panes = document.querySelectorAll(".tab-pane");
  tabs.forEach(btn => btn.addEventListener("click", () => {
    tabs.forEach(b => b.classList.remove("bg-slate-800"));
    btn.classList.add("bg-slate-800");
    panes.forEach(p => p.classList.add("hidden"));
    document.getElementById("tab-" + btn.dataset.tab).classList.remove("hidden");
  }));

  // Elements
  const clusterSummary = document.getElementById("clusterSummary");
  const quickStats = document.getElementById("quickStats");
  const nsSelect = document.getElementById("nsSelect");
  const deployments = document.getElementById("deployments");
  const services = document.getElementById("services");
  const pods = document.getElementById("pods");
  const ingresses = document.getElementById("ingresses");
  const argocd = document.getElementById("argocd");
  const monitoringCards = document.getElementById("monitoringCards");

  async function jget(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }

  function pill(text) {
    return `<span class="text-[11px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700">${text}</span>`;
  }

  function itemCard(title, body) {
    return `<div class="p-3 rounded border border-slate-700 bg-slate-800/50">
      <div class="font-medium">${title}</div>
      <div class="text-sm text-slate-300">${body}</div>
    </div>`;
  }

  async function loadSummary() {
    const s = await jget(`${API}/summary`);
    clusterSummary.textContent =
      `NS: ${s.namespaces} • Pods: ${s.pods} • Svc: ${s.services} • Ing: ${s.ingresses} • Depl: ${s.deployments} • ArgoApps: ${s.argocdApplications}`;

    quickStats.innerHTML = [
      ["Namespaces", s.namespaces],
      ["Pods", s.pods],
      ["Services", s.services],
      ["Ingresses", s.ingresses],
      ["Deployments", s.deployments]
    ].map(([k,v]) => `<div class="p-4 rounded bg-slate-800 border border-slate-700 text-center">
        <div class="text-2xl font-bold">${v}</div>
        <div class="text-xs text-slate-400">${k}</div>
      </div>`).join("");

    monitoringCards.innerHTML = [
      ["Grafana", s.monitoring.grafana],
      ["Prometheus", s.monitoring.prometheus],
      ["Alertmanager", s.monitoring.alertmanager]
    ].map(([name, ok]) => `<div class="p-4 rounded border ${ok?'border-green-700 bg-green-950/30':'border-slate-700 bg-slate-800/50'}">
      <div class="font-semibold">${name}</div>
      <div class="text-sm mt-1">${ok? 'Detected in cluster' : 'Not detected'}</div>
    </div>`).join("");
  }

  async function loadNamespaces() {
    const list = await jget(`${API}/namespaces`);
    nsSelect.innerHTML = `<option value="">All</option>` + list.map(ns => `<option>${ns}</option>`).join("");
  }

  function podRow(ns, pod) {
    const name = pod.metadata?.name || "";
    const phase = pod.status?.phase || "";
    const containers = pod.spec?.containers?.map(c => c.name) || [];
    const node = pod.spec?.nodeName || "";
    return `<div class="p-2 rounded bg-slate-900 border border-slate-700 flex items-center justify-between">
      <div>
        <div class="font-mono text-sm">${name}</div>
        <div class="text-xs text-slate-400">${pill(phase)} ${pill('node: ' + node)} ${pill('ns: ' + ns)}</div>
      </div>
      <div class="flex gap-2">
        ${containers.map(cn => `<button class="px-2 py-1 text-xs rounded bg-blue-600" data-log="${ns}|${name}|${cn}">Logs: ${cn}</button>`).join("")}
      </div>
    </div>`;
  }

  async function loadResources() {
    const ns = nsSelect.value;
    const data = await jget(`${API}/resources${ns?`?ns=${encodeURIComponent(ns)}`:""}`);

    // Deployments
    deployments.innerHTML = (data.deployments || []).map(d => {
      const name = d.metadata?.name || "";
      const replicas = d.status?.readyReplicas || 0;
      const desired = d.spec?.replicas || 0;
      const ns = d.metadata?.namespace || "";
      return itemCard(name, `${pill(ns)} ${pill(`ready ${replicas}/${desired}`)}`);
    }).join("") || `<div class="text-sm text-slate-400">No deployments</div>`;

    // Services
    services.innerHTML = (data.services || []).map(s => {
      const name = s.metadata?.name;
      const ns = s.metadata?.namespace;
      const type = s.spec?.type;
      const ports = (s.spec?.ports||[]).map(p => p.port).join(",");
      return itemCard(name, `${pill(ns)} ${pill(type)} ${pill('ports: ' + ports)}`);
    }).join("") || `<div class="text-sm text-slate-400">No services</div>`;

    // Pods
    pods.innerHTML = (data.pods || []).map(p => podRow(p.metadata?.namespace, p)).join("") || `<div class="text-sm text-slate-400">No pods</div>`;

    // Ingresses
    ingresses.innerHTML = (data.ingresses || []).map(i => {
      const name = i.metadata?.name;
      const ns = i.metadata?.namespace;
      const rules = (i.spec?.rules||[]).map(r => r.host || "").filter(Boolean).join(", ") ||
                    (i.spec?.ingressClassName ? `class: ${i.spec.ingressClassName}` : "path-based");
      return itemCard(name, `${pill(ns)} ${pill(rules)}`);
    }).join("") || `<div class="text-sm text-slate-400">No ingresses</div>`;

    // Argo CD
    argocd.innerHTML = (data.argocdApplications || []).map(a => {
      const name = a.metadata?.name;
      const ns = a.metadata?.namespace;
      const sync = a.status?.sync?.status || "unknown";
      const health = a.status?.health?.status || "unknown";
      return itemCard(name, `${pill(ns)} ${pill('sync: ' + sync)} ${pill('health: ' + health)}`);
    }).join("") || `<div class="text-sm text-slate-400">No Argo CD Applications detected</div>`;

    // wire log buttons
    document.querySelectorAll("[data-log]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const [ns, pod, container] = btn.dataset.log.split("|");
        const dlg = document.getElementById("logDlg");
        document.getElementById("logTitle").textContent = `${pod} (${container})`;
        const res = await fetch(`${API}/logs?ns=${encodeURIComponent(ns)}&pod=${encodeURIComponent(pod)}&container=${encodeURIComponent(container)}&tail=500`);
        document.getElementById("logContent").textContent = await res.text();
        dlg.showModal();
      });
    });
  }

  document.getElementById("refreshBtn").addEventListener("click", loadResources);
  nsSelect.addEventListener("change", loadResources);

  // initial
  loadSummary().catch(console.error);
  loadNamespaces().then(loadResources).catch(console.error);

  // poll summary every 30s
  setInterval(loadSummary, 30000);
})();
