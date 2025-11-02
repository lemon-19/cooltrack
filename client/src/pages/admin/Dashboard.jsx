import React, { useEffect, useState, useContext } from "react";
import API from "../../api/axios";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { AuthContext } from "../../context/AuthContext";
import { Briefcase, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { Commet } from "react-loading-indicators";

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    lowStock: 0,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const { data: jobData } = await API.get("/jobs");
        const { data: items } = await API.get("/inventory");

        const jobs = jobData.results || [];

        setStats({
          total: jobs.length,
          pending: jobs.filter((j) => j.status === "Pending").length,
          completed: jobs.filter((j) => j.status === "Completed").length,
          lowStock: items.filter((i) => i.totalQuantity <= i.minThreshold)
            .length,
        });
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar
        role={user?.role}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <main className="flex-1 min-h-screen bg-gray-50">
        <Navbar
          title="Admin Dashboard"
          onMenuClick={() => setSidebarOpen(true)}
        />

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Commet color="#3B82F6" size="medium" text="" textColor="" />
          </div>
        ) : stats.total > 0 ? (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: <Briefcase className="w-6 h-6 text-cyan-600" />,
                label: "Total Jobs",
                value: stats.total,
                bg: "bg-cyan-100",
              },
              {
                icon: <Clock className="w-6 h-6 text-yellow-600" />,
                label: "Pending Jobs",
                value: stats.pending,
                bg: "bg-yellow-100",
              },
              {
                icon: <CheckCircle className="w-6 h-6 text-green-600" />,
                label: "Completed",
                value: stats.completed,
                bg: "bg-green-100",
              },
              {
                icon: <AlertTriangle className="w-6 h-6 text-red-600" />,
                label: "Low Stocks",
                value: stats.lowStock,
                bg: "bg-red-100",
              },
            ].map((card, i) => (
              <div
                key={i}
                className="p-4 bg-white rounded-xl shadow-md flex items-center gap-3"
              >
                <div className={`p-3 rounded-lg ${card.bg}`}>{card.icon}</div>
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <b className="text-xl">{card.value}</b>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-10">No data found.</div>
        )}
      </main>
    </div>
  );
}
