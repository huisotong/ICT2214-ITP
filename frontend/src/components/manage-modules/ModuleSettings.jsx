import { useState } from "react";

export default function ModuleSettings({
  module,
  setModal,
  moduleSettings,
  setModuleSettings,
  onModuleUpdated,  // added prop
}) {
  async function handleSaveChanges() {
    try {
      const response = await fetch("http://localhost:5000/api/edit-module", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          oldModuleID: module.moduleID,
          moduleID: moduleSettings.moduleID,
          moduleName: moduleSettings.moduleName,
          moduleDesc: moduleSettings.moduleDesc,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update module settings");
      }

      setModal({
        active: true,
        type: "success",
        message: "Module settings updated successfully!",
      });

      if (onModuleUpdated) {
        await onModuleUpdated();
      }
    } catch (error) {
      console.error("Error updating module settings:", error);
      setModal({
        active: true,
        type: "fail",
        message:
          error.message ||
          "Failed to update module settings. Please try again.",
      });
    }
  }

  return (
    <div className="bg-gray-100 p-4 rounded w-full h-1/2 flex flex-col justify-evenly">
      <h2 className="text-xl mb-4">Module settings</h2>
      <div className="mb-4">
        <label className="block mb-2">Module ID:</label>
        <input
          type="text"
          className="w-full p-2 border rounded"
          value={moduleSettings.moduleID}
          onChange={(e) =>
            setModuleSettings({
              ...moduleSettings,
              moduleID: e.target.value,
            })
          }
        />
      </div>
      <div className="mb-4">
        <label className="block mb-2">Module Name:</label>
        <input
          type="text"
          className="w-full p-2 border rounded"
          value={moduleSettings.moduleName}
          onChange={(e) =>
            setModuleSettings({
              ...moduleSettings,
              moduleName: e.target.value,
            })
          }
        />
      </div>
      <div className="mb-4">
        <label className="block mb-2">Module Description:</label>
        <input
          type="text"
          className="w-full p-2 border rounded"
          value={moduleSettings.moduleDesc}
          onChange={(e) =>
            setModuleSettings({
              ...moduleSettings,
              moduleDesc: e.target.value,
            })
          }
        />
      </div>
      <button
        className="bg-green-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-green-600 transition"
        onClick={handleSaveChanges}
      >
        Save changes
      </button>
    </div>
  );
}
