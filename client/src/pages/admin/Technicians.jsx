import React, { useEffect, useState, useContext } from "react";
import API from "../../api/axios";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { AuthContext } from "../../context/AuthContext";

export default function Technicians(){
  const { user } = useContext(AuthContext);
  const [techs, setTechs] = useState([]);

  useEffect(()=>{ load(); }, []);
  const load = async () => {
    try {
      // if you have an endpoint for users (e.g. /users?role=technician) use it
      const { data } = await API.get("/auth/technicians"); // implement on server or adjust
      setTechs(data);
    } catch(err){ console.error(err); }
  };

  return (
    <>
      <div className="flex">
        <Sidebar role={user?.role} />
        <main className="flex-1 p-6">
          <h1 className="text-2xl font-bold mb-4">Technicians</h1>
          <div className="space-y-2">
            {techs.map(t=>(
              <div key={t._id} className="p-3 bg-white rounded shadow flex justify-between">
                <div>
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-sm text-gray-600">{t.email}</div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </>
  );
}
