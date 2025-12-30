// components/AddMaterialsModal.jsx
import { useState, useEffect } from "react";
import { X, Plus, Trash2, Package } from "lucide-react";
import { addJobMaterials } from "../api/jobs";
import { formatCurrency } from "../utils/format";
import Skeleton from "./Skeleton";
import { getSerializedInventory, getGroupedInventory } from "../api/inventory";

export default function AddMaterialsModal({ open, job, onClose, refreshJobs }) {
  const [materials, setMaterials] = useState([
    {
      inventoryType: "serialized",
      serialNumber: "",
      itemName: "",
      valueUsed: 1,
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [serializedItems, setSerializedItems] = useState([]);
  const [groupedItems, setGroupedItems] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(true);

  useEffect(() => {
    if (open) loadInventory();
  }, [open]);

  const loadInventory = async () => {
    try {
      setLoadingInventory(true);

      // Serialized
      const serializedData = await getSerializedInventory();
      const available =
        serializedData.items?.filter((i) => i.status === "available") || [];
      setSerializedItems(available);

      // Grouped
      const groupedData = await getGroupedInventory();
      setGroupedItems(groupedData.items || []);
    } catch (err) {
      console.error("Failed to load inventory:", err);
      alert("Failed to load inventory items");
    } finally {
      setLoadingInventory(false);
    }
  };

  const handleAddMaterial = () => {
    setMaterials([
      ...materials,
      {
        inventoryType: "serialized",
        serialNumber: "",
        itemName: "",
        valueUsed: 1,
      },
    ]);
  };

  const handleRemoveMaterial = (index) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  const handleMaterialChange = (index, field, value) => {
    const updated = [...materials];
    updated[index][field] = value;

    // Reset fields when switching type
    if (field === "inventoryType") {
      updated[index] = {
        inventoryType: value,
        serialNumber: "",
        itemName: "",
        valueUsed: 1,
      };
    }

    // Autofill serialized item name
    if (
      field === "serialNumber" &&
      updated[index].inventoryType === "serialized"
    ) {
      const item = serializedItems.find((i) => i.serialNumber === value);
      if (item) updated[index].itemName = item.itemName;
    }

    setMaterials(updated);
  };

  // Submit ---------------------------------------------------------
  const handleSubmit = async () => {
    // VALIDATION
    for (let i = 0; i < materials.length; i++) {
      const m = materials[i];

      if (m.inventoryType === "serialized") {
        if (!m.serialNumber) {
          alert(`Material ${i + 1}: Please select a serialized item`);
          return;
        }
      } else {
        if (!m.itemName) {
          alert(`Material ${i + 1}: Please select a grouped item`);
          return;
        }
        if (!m.valueUsed || m.valueUsed <= 0) {
          alert(`Material ${i + 1}: Please enter a valid amount used`);
          return;
        }
      }
    }

    // CLEAN PAYLOAD
    const cleanMaterials = materials.map((m) => {
      if (m.inventoryType === "serialized") {
        return {
          inventoryType: "serialized",
          serialNumber: m.serialNumber,
          itemName: m.itemName,
        };
      }
      return {
        inventoryType: "grouped",
        itemName: m.itemName,
        valueUsed: parseFloat(m.valueUsed) || 0,
      };
    });

    try {
      setLoading(true);

      const payload = { materials: cleanMaterials };
      const response = await addJobMaterials(job._id, payload);

      alert("Materials added successfully!");

      refreshJobs();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add materials");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl relative max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6" />
            Add Materials – {job.jobNumber}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Add materials used for this job
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loadingInventory ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full mx-auto" />
              <p className="text-gray-500 mt-2">Loading inventory...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {materials.map((m, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 relative">
                  {/* Remove */}
                  {materials.length > 1 && (
                    <button
                      onClick={() => handleRemoveMaterial(index)}
                      className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <div className="space-y-3">
                    {/* Type */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Inventory Type
                      </label>
                      <select
                        value={m.inventoryType}
                        onChange={(e) =>
                          handleMaterialChange(
                            index,
                            "inventoryType",
                            e.target.value
                          )
                        }
                        className="w-full border rounded-lg p-2.5 text-sm"
                      >
                        <option value="serialized">Serialized</option>
                        <option value="grouped">Grouped</option>
                      </select>
                    </div>

                    {/* Serialized */}
                    {m.inventoryType === "serialized" ? (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Select Item <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={m.serialNumber}
                          onChange={(e) =>
                            handleMaterialChange(
                              index,
                              "serialNumber",
                              e.target.value
                            )
                          }
                          className="w-full border rounded-lg p-2.5 text-sm"
                        >
                          <option value="">Select an item...</option>
                          {serializedItems.map((item) => (
                            <option key={item._id} value={item.serialNumber}>
                              {item.itemName} – SN: {item.serialNumber}
                              ({formatCurrency(item.salePrice)})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      /* Grouped */
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Select Item <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={m.itemName}
                            onChange={(e) =>
                              handleMaterialChange(
                                index,
                                "itemName",
                                e.target.value
                              )
                            }
                            className="w-full border rounded-lg p-2.5 text-sm"
                          >
                            <option value="">Select an item...</option>
                            {groupedItems.map((item) => (
                              <option key={item._id} value={item.itemName}>
                                {item.itemName} – {item.currentValue}{" "}
                                {item.unit} available
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Value Used (
                            {groupedItems.find((i) => i.itemName === m.itemName)
                              ?.unit || ""}
                            )<span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            value={m.valueUsed}
                            onChange={(e) =>
                              handleMaterialChange(
                                index,
                                "valueUsed",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            min="0"
                            step="0.10"
                            className="w-full border rounded-lg p-2.5 text-sm"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}

              {/* Add Another */}
              <button
                onClick={handleAddMaterial}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Another Material
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t gap-3 bg-gray-50">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 rounded-lg"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg disabled:opacity-50"
            disabled={loading || loadingInventory}
          >
            {loading ? "Adding..." : "Add Materials"}
          </button>
        </div>
      </div>
    </div>
  );
}
