import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import API from "../../api/axios";
import Navbar from "../../components/Navbar";

export default function JobDetail(){
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [status, setStatus] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(()=>{ load(); }, []);
  const load = async ()=>{
    try {
      const { data } = await API.get(`/technician/jobs/${id}`);
      setJob(data);
      setStatus(data.status);
    } catch(err){ console.error(err); }
  };

  const save = async ()=>{
    try {
      const { data } = await API.patch(`/technician/jobs/${id}/status`, { status, remarks });
      setJob(data.job || data);
      alert("Updated");
    } catch(err){ alert("Error updating"); }
  };

  if(!job) return <div><Navbar /><div className="p-6">Loading...</div></div>;

  return (
    <>
      <Navbar />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Job Detail</h1>
        <div className="bg-white p-4 rounded shadow max-w-2xl">
          <div><b>Client:</b> {job.clientName}</div>
          <div><b>Address:</b> {job.clientAddress}</div>
          <div><b>Type:</b> {job.type}</div>
          <div className="mt-4"><b>Materials:</b>
            <ul className="list-disc pl-6">
              {job.materialsUsed?.map(m=>(
                <li key={m._id || m.itemId}>{m.itemName} — {m.quantity} {m.unit}</li>
              ))}
            </ul>
          </div>

          <div className="mt-4">
            <label className="block text-sm">Status</label>
            <select value={status} onChange={e=>setStatus(e.target.value)} className="border p-2 rounded w-full max-w-xs">
              <option>Pending</option>
              <option>Ongoing</option>
              <option>Completed</option>
            </select>
          </div>

          <div className="mt-3">
            <label className="block text-sm">Remarks</label>
            <textarea value={remarks} onChange={e=>setRemarks(e.target.value)} className="w-full border p-2 rounded" />
          </div>

          <div className="mt-4">
            <button onClick={save} className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
          </div>
        </div>
      </div>
    </>
  );
}
