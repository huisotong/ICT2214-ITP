import { useState, useEffect } from "react";
import ModuleSettings from "../components/manage-modules/ModuleSettings";
import LLMSettings from "../components/manage-modules/LLMSettings";
import ManageStudents from "../components/manage-modules/ManageStudents";
import { fetchAssignedModules } from "../../utils/fetchAssignedModules";
import { useAuth } from "../context/AuthContext";

export default function ManageModules({ setModal }) {
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [moduleSettings, setModuleSettings] = useState({
    moduleID: "",
    moduleName: "",
    moduleDesc: "",
  });

  // Get User through Auth Context
  const { auth } = useAuth();
  const user = auth.user;

  async function fetchUserAssignedModules() {
    await fetchAssignedModules(user.userID)
      .then((data) => {
        setModules(data);
      })
      .catch((error) => {
        console.error("Error fetching assigned modules:", error);
      });
  }

  async function handleModuleSelect(moduleId) {
    const selected = modules.find((m) => m.moduleID === moduleId);
    setSelectedModule(selected);
    if (selected) {
      setModuleSettings({
        moduleID: selected.moduleID,
        moduleName: selected.moduleName,
        moduleDesc: selected.moduleDesc,
      });
    }
  }

  async function deleteModule(moduleId) {
    if (
      !window.confirm(
        `Are you sure you want to delete module ${moduleId}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/delete-module`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ moduleID: moduleId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete module");
      }

      // Show success message
      setModal({
        active: true,
        type: "success",
        message: `Module ${moduleId} deleted successfully!`,
      });

      // Reset selected module and refresh module list
      setSelectedModule(null);
      setModuleSettings({
        moduleID: "",
        moduleName: "",
        moduleDesc: "",
      });
      await fetchUserAssignedModules();
    } catch (error) {
      console.error("Error deleting module:", error);
      setModal({
        active: true,
        type: "fail",
        message: error.message || "Failed to delete module. Please try again.",
      });
    }
  }

  useEffect(() => {
    fetchUserAssignedModules();
  }, []);

  return (
    <div className="p-4 w-full h-full">
      {/* Module Selection Dropdown and delete*/}
      <div className="flex flex-row justify-between items-center w-full mb-4">
        <select
          className="p-2 border rounded cursor-pointer h-10"
          onChange={(e) => handleModuleSelect(e.target.value)}
          value={selectedModule?.moduleID || ""}
        >
          <option value="">Select a module</option>
          {modules.map((module) => (
            <option key={module.moduleID} value={module.moduleID}>
              {`${module.moduleID} - ${module.moduleName}`}
            </option>
          ))}
        </select>
        {selectedModule && (
          <button
            className="bg-red-500 h-10 text-white px-4 py-2 rounded cursor-pointer hover:bg-red-600 transition"
            onClick={() => {
              deleteModule(selectedModule.moduleID);
            }}
          >
            Delete Module
          </button>
        )}
      </div>

      {/* Module Settings Panel */}
      {selectedModule && (
        <div className="flex flex-row justify-between items-center w-full h-screen">
          {/* Leon user management here */}
          <div className="w-1/2 h-full">
            <ManageStudents module={selectedModule} setModal={setModal} />
          </div>

          <div className="w-1/2 flex flex-col justify-between items-center h-full">
            <ModuleSettings
              module={selectedModule}
              setModal={setModal}
              moduleSettings={moduleSettings}
              setModuleSettings={setModuleSettings}
            />
            <LLMSettings module={selectedModule} setModal={setModal} />
          </div>
        </div>
      )}
    </div>
  );
}
