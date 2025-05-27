import { useState } from "react";

export default function ModuleSettings({
  module,
  setModal,
  moduleSettings,
  setModuleSettings,
}) {
  async function handleSaveChanges() {
    // TODO: Implement API call to update module settings
    console.log("Saving settings:", moduleSettings);
  }

  return (
    <div className="bg-gray-100 p-4 rounded w-full h-1/2 flex flex-col justify-evenly">
      <h2 className="text-xl mb-4">Module settings</h2>
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
