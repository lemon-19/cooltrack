import React, { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";

export default function Jobs() {
  const { user } = useContext(AuthContext);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await axios.get(`/api/technicians/${user._id}/jobs`);
        setJobs(res.data);
      } catch (err) {
        console.error("Error fetching jobs:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user?._id) fetchJobs();
  }, [user]);

  if (loading) return <div className="p-6 text-gray-600">Loading jobs...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">My Jobs</h1>

      {jobs.length === 0 ? (
        <p className="text-gray-500">No jobs assigned yet.</p>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <div
              key={job._id}
              className="bg-white shadow-md rounded-xl p-4 border hover:shadow-lg transition"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800">{job.clientName}</h2>
                <span
                  className={`text-sm px-3 py-1 rounded-full ${
                    job.status === "Completed"
                      ? "bg-green-100 text-green-700"
                      : job.status === "Ongoing"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {job.status}
                </span>
              </div>

              <p className="text-gray-600 mt-1">
                <strong>Type:</strong> {job.type}
              </p>
              <p className="text-gray-600">
                <strong>Address:</strong> {job.clientAddress}
              </p>

              <div className="mt-3 flex justify-end">
                <Link
                  to={`/technician/jobs/${job._id}`}
                  className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
