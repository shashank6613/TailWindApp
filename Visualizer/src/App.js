import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- FIXED: Import AWS SDK client from installed package ---
// Note: This assumes you have run "npm install @aws-sdk/client-eks"
import { EKSClient, ListClustersCommand } from "@aws-sdk/client-eks";

// --- AWS SDK Client Initialization ---
// The client will automatically use the IAM role from the EC2 instance metadata.
// Make sure the Jenkins EC2 instance has an IAM role with EKS read permissions (e.g., AmazonEKSClusterReadOnly).
// You might want to configure the region dynamically or based on your needs.
const eksClient = new EKSClient({ region: "us-east-1" });

// --- Mock Data for Kubernetes Objects (to be replaced with K8s client calls) ---
// These are kept as placeholders until a Kubernetes client is integrated.
const mockNamespaces = ['default', 'kube-system', 'monitoring', 'ingress-nginx'];
const mockPods = [
  { name: 'my-app-pod-1', namespace: 'default', status: 'Running', restarts: 0, age: '2d' },
  { name: 'prometheus-pod-1', namespace: 'monitoring', status: 'Running', restarts: 1, age: '10d' },
];
const mockDeployments = [ { name: 'my-app', namespace: 'default', ready: '2/2', uptodate: 2, available: 2, age: '2d' }];
const mockServices = [ { name: 'my-app-service', namespace: 'default', type: 'LoadBalancer', clusterIP: '10.100.200.1', externalIP: 'abc.us-east-1.elb.amazonaws.com', ports: '80:30080/TCP', age: '2d' }];
const mockIngresses = [ { name: 'my-app-ingress', namespace: 'default', class: 'nginx', hosts: 'myapp.example.com', address: 'localhost', ports: '80', age: '2d' }];
const mockLogs = `[INFO] Logs would be fetched from the selected pod...`;
const mockStats = [ { name: 'Running', value: 4 }, { name: 'Pending', value: 1 }];


// Main App Component
export default function App() {
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const handleClusterSelect = (cluster) => {
    // We pass the cluster name. In a real app, you might pass more details.
    setSelectedCluster({ name: cluster });
    setActiveTab('overview');
  };

  const handleBackToLanding = () => {
    setSelectedCluster(null);
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans">
      <div className="p-4 md:p-8">
        {selectedCluster ? (
          <>
            <NavBar activeTab={activeTab} setActiveTab={setActiveTab} onBack={handleBackToLanding} clusterName={selectedCluster.name} />
            <main className="mt-4">
              <ContentArea activeTab={activeTab} cluster={selectedCluster} />
            </main>
          </>
        ) : (
          <LandingPage onClusterSelect={handleClusterSelect} />
        )}
      </div>
    </div>
  );
}

// Landing Page Component
const LandingPage = ({ onClusterSelect }) => {
    const [clusters, setClusters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchClusters = async () => {
            try {
                setLoading(true);
                const command = new ListClustersCommand({});
                const response = await eksClient.send(command);
                setClusters(response.clusters || []);
                setError(null);
            } catch (err) {
                console.error("Error fetching EKS clusters:", err);
                setError("Failed to fetch clusters. Check IAM permissions and AWS connectivity.");
            } finally {
                setLoading(false);
            }
        };

        fetchClusters();
    }, []);


    return (
        <div className="animate-fade-in">
             <header className="text-center mb-12">
                <h1 className="text-5xl font-bold tracking-wider text-white">K8-Viewer</h1>
                <p className="text-indigo-400 mt-2">A modern dashboard for your Amazon EKS Clusters</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-lg">
                         <h2 className="text-2xl font-bold mb-4 border-b border-gray-600 pb-2">About</h2>
                         <p className="text-gray-300 text-sm">
                            K8-Viewer provides a clean, modern, and responsive interface to visualize and manage your Amazon EKS resources.
                            This tool helps you get a quick overview of your cluster's health, deployments, pods, and services without needing to juggle multiple `kubectl` commands.
                            It's designed to run securely within your AWS environment, leveraging IAM roles for access.
                         </p>
                    </div>
                </div>

                <div className="md:col-span-2">
                     <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-lg">
                        <h2 className="text-2xl font-bold mb-4 border-b border-gray-600 pb-2">Available Clusters</h2>
                        {loading && <p className="text-center text-gray-400">Loading clusters...</p>}
                        {error && <p className="text-center text-red-400">{error}</p>}
                        {!loading && !error && (
                            <div className="space-y-4">
                                {clusters.length > 0 ? clusters.map((clusterName) => (
                                    <div
                                      key={clusterName}
                                      className="bg-gray-700 rounded-lg p-4 shadow-md hover:shadow-indigo-500/50 transform hover:-translate-y-1 transition-all duration-300 cursor-pointer flex justify-between items-center"
                                      onClick={() => onClusterSelect(clusterName)}
                                    >
                                      <h3 className="text-lg font-semibold">{clusterName}</h3>
                                      <span className="text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded-full">Ready</span>
                                    </div>
                                )) : <p className="text-center text-gray-500">No EKS clusters found in this region.</p>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}


// Content Area for selected cluster
const ContentArea = ({ activeTab, cluster }) => {
    switch (activeTab) {
        case 'overview':
          return <OverviewTab cluster={cluster} />;
        case 'pods':
          return <PodsTab />;
        case 'deployments':
          return <DeploymentsTab />;
        case 'services':
          return <ServicesTab />;
        case 'ingresses':
            return <IngressesTab />;
        case 'logs':
          return <LogsTab />;
        case 'stats':
          return <StatsTab />;
        default:
          return <OverviewTab cluster={cluster} />;
      }
}


// Navigation Bar Component
const NavBar = ({ activeTab, setActiveTab, onBack, clusterName }) => {
  const tabs = ['overview', 'pods', 'deployments', 'services', 'ingresses', 'logs', 'stats'];
  return (
    <nav className="bg-gray-800 rounded-lg p-2 flex items-center justify-between shadow-lg border border-gray-700">
        <div>
            <button onClick={onBack} className="text-gray-300 hover:text-white mr-4 transition-colors duration-200 text-sm">
                &larr; Back to Clusters
            </button>
            {tabs.map((tab) => (
                <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-300 ${
                    activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-700'
                }`}
                >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
            ))}
        </div>
        <div className="text-sm text-gray-400">
            Viewing: <span className="font-bold text-indigo-400">{clusterName}</span>
        </div>
    </nav>
  );
};


// Overview Tab
const OverviewTab = ({ cluster }) => (
    <div className="animate-fade-in">
        <h2 className="text-3xl font-bold mb-6">Cluster Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* In a real app, you would fetch this data using DescribeClusterCommand */}
            <InfoCard title="Status" value="ACTIVE" />
            <InfoCard title="Region" value="us-east-1" />
            <InfoCard title="Version" value="1.28" />
            <InfoCard title="Namespaces" value={mockNamespaces.length} />
        </div>
        <div className="mt-8 bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
            <h3 className="text-xl font-semibold mb-4">Namespaces</h3>
            <div className="flex flex-wrap gap-2">
                {mockNamespaces.map(ns => (
                    <span key={ns} className="bg-gray-700 px-3 py-1 text-sm rounded-full">{ns}</span>
                ))}
            </div>
        </div>
    </div>
);

const InfoCard = ({ title, value }) => (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
        <h4 className="text-gray-400 text-sm font-medium">{title}</h4>
        <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
);


// Pods Tab
const PodsTab = () => (
    <div className="animate-fade-in">
        <h2 className="text-3xl font-bold mb-6">Pods</h2>
        <Table headers={['Name', 'Namespace', 'Status', 'Restarts', 'Age']}>
            {mockPods.map(pod => (
                <tr key={pod.name} className="hover:bg-gray-700 transition-colors duration-200">
                    <td className="p-4">{pod.name}</td>
                    <td className="p-4">{pod.namespace}</td>
                    <td className="p-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${pod.status === 'Running' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                            {pod.status}
                        </span>
                    </td>
                    <td className="p-4">{pod.restarts}</td>
                    <td className="p-4">{pod.age}</td>
                </tr>
            ))}
        </Table>
    </div>
);

// Deployments Tab
const DeploymentsTab = () => (
    <div className="animate-fade-in">
        <h2 className="text-3xl font-bold mb-6">Deployments</h2>
        <Table headers={['Name', 'Namespace', 'Ready', 'Up-to-date', 'Available', 'Age']}>
            {mockDeployments.map(dep => (
                <tr key={dep.name} className="hover:bg-gray-700 transition-colors duration-200">
                    <td className="p-4">{dep.name}</td>
                    <td className="p-4">{dep.namespace}</td>
                    <td className="p-4">{dep.ready}</td>
                    <td className="p-4">{dep.uptodate}</td>
                    <td className="p-4">{dep.available}</td>
                    <td className="p-4">{dep.age}</td>
                </tr>
            ))}
        </Table>
    </div>
);

// Services Tab
const ServicesTab = () => (
    <div className="animate-fade-in">
        <h2 className="text-3xl font-bold mb-6">Services</h2>
        <Table headers={['Name', 'Namespace', 'Type', 'Cluster IP', 'External IP', 'Ports', 'Age']}>
            {mockServices.map(svc => (
                <tr key={svc.name} className="hover:bg-gray-700 transition-colors duration-200">
                    <td className="p-4">{svc.name}</td>
                    <td className="p-4">{svc.namespace}</td>
                    <td className="p-4">{svc.type}</td>
                    <td className="p-4">{svc.clusterIP}</td>
                    <td className="p-4">{svc.externalIP}</td>
                    <td className="p-4">{svc.ports}</td>
                    <td className="p-4">{svc.age}</td>
                </tr>
            ))}
        </Table>
    </div>
);

// Ingresses Tab
const IngressesTab = () => (
    <div className="animate-fade-in">
        <h2 className="text-3xl font-bold mb-6">Ingresses</h2>
        <Table headers={['Name', 'Namespace', 'Class', 'Hosts', 'Address', 'Ports', 'Age']}>
            {mockIngresses.map(ing => (
                <tr key={ing.name} className="hover:bg-gray-700 transition-colors duration-200">
                    <td className="p-4">{ing.name}</td>
                    <td className="p-4">{ing.namespace}</td>
                    <td className="p-4">{ing.class}</td>
                    <td className="p-4">{ing.hosts}</td>
                    <td className="p-4">{ing.address}</td>
                    <td className="p-4">{ing.ports}</td>
                    <td className="p-4">{ing.age}</td>
                </tr>
            ))}
        </Table>
    </div>
);


// Logs Tab
const LogsTab = () => (
  <div className="animate-fade-in">
    <h2 className="text-3xl font-bold mb-6">Logs</h2>
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <select className="bg-gray-700 p-2 rounded-md border border-gray-600">
          {mockPods.map(pod => <option key={pod.name}>{pod.name}</option>)}
        </select>
        <button className="bg-indigo-600 px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors duration-200">Fetch Logs</button>
      </div>
      <pre className="bg-black text-sm text-green-400 p-4 rounded-md h-96 overflow-auto font-mono">{mockLogs}</pre>
    </div>
  </div>
);

// Stats Tab
const StatsTab = () => (
  <div className="animate-fade-in">
    <h2 className="text-3xl font-bold mb-6">Cluster Statistics</h2>
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg h-96 border border-gray-700">
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                <XAxis dataKey="name" stroke="#a0aec0" />
                <YAxis stroke="#a0aec0" />
                <Tooltip contentStyle={{ backgroundColor: '#2d3748', border: 'none' }} />
                <Legend />
                <Bar dataKey="value" fill="#667eea" />
            </BarChart>
        </ResponsiveContainer>
    </div>
  </div>
);


// Generic Table Component
const Table = ({ headers, children }) => (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
        <table className="w-full text-left">
            <thead className="bg-gray-700/50">
                <tr>
                    {headers.map(header => (
                        <th key={header} className="p-4 font-semibold tracking-wider">{header}</th>
                    ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
                {children}
            </tbody>
        </table>
    </div>
);

// Add this to your index.css or a style tag for the fade-in animation
const style = document.createElement('style');
style.innerHTML = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fadeIn 0.5s ease-out forwards;
  }
`;
document.head.appendChild(style);
