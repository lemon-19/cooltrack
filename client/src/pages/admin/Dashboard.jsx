import React, { useEffect, useState, useContext } from "react";
import API from "../../api/axios";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { AuthContext } from "../../context/AuthContext";
import {
  Briefcase,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { Commet } from "react-loading-indicators";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [jobsByMonth, setJobsByMonth] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const [overviewRes, jobsRes, lowStockRes, logsRes] = await Promise.all([
          API.get("/dashboard/overview", { headers }),
          API.get("/dashboard/jobs-by-month", { headers }),
          API.get("/dashboard/low-stock", { headers }),
          API.get("/dashboard/logs", { headers }),
        ]);

        setOverview(overviewRes.data);
        setJobsByMonth(jobsRes.data);
        setLowStock(lowStockRes.data);
        setLogs(logsRes.data);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);


  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar (fixed height) */}
      <Sidebar
        role={user?.role}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Navbar (fixed) */}
        <div className="sticky top-0 z-30">
          <Navbar title="Admin Dashboard" onMenuClick={() => setSidebarOpen(true)} />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Commet color="#3B82F6" size="medium" text="" textColor="" />
            </div>
          ) : overview ? (
            <div className="p-6 space-y-6">
              {/* Top Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    icon: <Briefcase className="w-6 h-6 text-cyan-600" />,
                    label: "Total Jobs",
                    value: overview.totalJobs,
                    bg: "bg-cyan-100",
                  },
                  {
                    icon: <Clock className="w-6 h-6 text-yellow-600" />,
                    label: "Pending Jobs",
                    value: overview.pendingJobs,
                    bg: "bg-yellow-100",
                  },
                  {
                    icon: <CheckCircle className="w-6 h-6 text-green-600" />,
                    label: "Completed Jobs",
                    value: overview.completedJobs,
                    bg: "bg-green-100",
                  },
                  {
                    icon: <AlertTriangle className="w-6 h-6 text-red-600" />,
                    label: "Low Stocks",
                    value: overview.lowStock,
                    bg: "bg-red-100",
                  },
                ].map((card, i) => (
                  <div
                    key={i}
                    className="p-4 bg-white rounded-xl shadow flex items-center gap-3"
                  >
                    <div className={`p-3 rounded-lg ${card.bg}`}>{card.icon}</div>
                    <div>
                      <p className="text-sm text-gray-500">{card.label}</p>
                      <b className="text-xl">{card.value}</b>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dashboard Main Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Section */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                  <h2 className="text-lg font-semibold mb-4 text-gray-700">
                    Jobs by Month
                  </h2>
                  {jobsByMonth.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={jobsByMonth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="total"
                          stroke="#3B82F6"
                          strokeWidth={3}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-gray-500 text-center py-10">
                      No job data available.
                    </p>
                  )}
                </div>

                {/* Low Stock Section */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h2 className="text-lg font-semibold mb-4 text-gray-700">
                    Low Stock Items
                  </h2>
                  {lowStock.length > 0 ? (
                    <ul className="divide-y divide-gray-200 max-h-[280px] overflow-y-auto">
                      {lowStock.map((item, i) => (
                        <li key={i} className="py-2 flex justify-between text-sm">
                          <span>{item.itemName}</span>
                          <span className="text-red-600 font-semibold">
                            {item.totalQuantity}/{item.minThreshold} {item.unit}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-center">
                      All items in safe levels.
                    </p>
                  )}
                </div>
              </div>

              {/* Logs Section */}
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-lg font-semibold mb-4 text-gray-700">
                  Recent Activity
                </h2>
                {logs.length > 0 ? (
                  <ul className="divide-y divide-gray-200 max-h-[300px] overflow-y-auto">
                    {logs.map((log, i) => (
                      <li key={i} className="py-2 text-sm text-gray-600">
                        <span className="font-medium">{log.userId?.name}</span>{" "}
                        ({log.userId?.role}) — {log.action || log.description}{" "}
                        <span className="text-gray-400">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-center">No recent logs found.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-center py-10">No data found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
