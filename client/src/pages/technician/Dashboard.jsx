import React, { useEffect, useState, useContext } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { AuthContext } from "../../context/AuthContext";
import API from "../../api/axios";

export default function Dashboard(){
  const { user } = useContext(AuthContext);
  const [jobs, setJobs] = useState([]);

  useEffect(()=>{ load(); }, []);
  const load = async () => {
    try {
      const { data } = await API.get("/technician/jobs");
      setJobs(data);
    } catch(err){ console.error(err); }
  };

  const total = jobs.length;
  const pending = jobs.filter(j=>j.status==="Pending").length;
  const completed = jobs.filter(j=>j.status==="Completed").length;

  return (
    <>
      <Navbar />
      <div className="flex">
        <Sidebar role={user?.role} />
        <main className="flex-1 p-6">
          <h1 className="text-2xl font-bold mb-4">Technician Dashboard</h1>
          <div className="flex gap-4 mb-6">
            <div className="p-4 bg-white rounded shadow">Total: {total}</div>
            <div className="p-4 bg-white rounded shadow">Pending: {pending}</div>
            <div className="p-4 bg-white rounded shadow">Completed: {completed}</div>
          </div>

          <div className="space-y-3">
            {jobs.map(j=>(
              <div key={j._id} className="p-4 bg-white rounded shadow flex justify-between">
                <div>
                  <div className="font-semibold">{j.clientName}</div>
                  <div className="text-sm text-gray-600">{j.type} • {j.clientAddress}</div>
                </div>
                <div className="text-right">
                  <div>{j.status}</div>
                  <a href={`/technician/jobs/${j._id}`} className="text-sm text-blue-600">View</a>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </>
  );
}
