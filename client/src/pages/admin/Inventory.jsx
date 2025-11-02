import React, { useEffect, useState, useContext } from "react";
import API from "../../api/axios";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { AuthContext } from "../../context/AuthContext";

export default function AdminInventory(){
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const { data } = await API.get("/inventory");
      setItems(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        role={user?.role}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1">
        {/* Navbar */}
        <Navbar
          title="Inventory Management"
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* Page Content */}
        <div className="p-6">
          {items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((i) => (
                <div
                  key={i._id}
                  className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition"
                >
                  <div className="font-semibold text-gray-800">{i.itemName}</div>
                  <div className="text-sm text-gray-600">{i.category}</div>
                  <div className="mt-2 text-lg font-medium text-gray-700">
                    {i.totalQuantity} {i.unit}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Last updated:{" "}
                    {i.lastUpdated
                      ? new Date(i.lastUpdated).toLocaleDateString()
                      : "N/A"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-10">
              No inventory items found.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}