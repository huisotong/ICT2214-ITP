import { useState } from "react";

export default function ModuleSettings({
  module,
  setModal,
  moduleSettings,
  setModuleSettings,
  onModuleUpdated, // added prop
}) {
  const [isSaving, setIsSaving] = useState(false); // Add loading state

  async function handleSaveChanges() {
    if (isSaving) return; // Prevent multiple submissions

    setIsSaving(true); // Start loading

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
    } finally {
      setIsSaving(false); // Stop loading
    }
  }

  return (
    <div className="bg-gray-100 p-6 rounded w-full h-full flex flex-col justify-between">
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
        className={`text-white px-4 py-2 rounded transition flex items-center justify-center ${
          isSaving
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-500 cursor-pointer hover:bg-green-600"
        }`}
        onClick={handleSaveChanges}
        disabled={isSaving}
      >
        {isSaving ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Saving...
          </>
        ) : (
          "Save changes"
        )}
      </button>
    </div>
  );
}
