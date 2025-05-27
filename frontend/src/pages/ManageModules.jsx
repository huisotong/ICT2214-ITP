import { useState, useEffect } from "react";
import ModuleSettings from "../components/manage-modules/ModuleSettings";
import LLMSettings from "../components/manage-modules/LLMSettings";
import ManageStudents from "../components/manage-modules/ManageStudents";

export default function ManageModules({ user, setModal }) {
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [moduleSettings, setModuleSettings] = useState({
    moduleName: "",
    moduleDesc: "",
  });

  async function fetchModules() {
    // TODO: Replace with actual API call
    setModules([
      {
        id: 1,
        moduleName: "ICT2116-Secure Software Development",
        moduleDesc: "Description for Module 1",
      },
      { id: 2, moduleName: "ICT1002", moduleDesc: "Description for Module 2" },
      { id: 3, moduleName: "ICT1003", moduleDesc: "Description for Module 3" },
    ]);
  }

  async function handleModuleSelect(moduleId) {
    const selected = modules.find((m) => m.id === parseInt(moduleId));
    setSelectedModule(selected);
    if (selected) {
      setModuleSettings({
        moduleName: selected.moduleName,
        moduleDesc: selected.moduleDesc,
      });
    }
  }

  function deleteModule(moduleId) {
    return;
  }

  useEffect(() => {
    fetchModules();
  }, []);

  return (
    <div className="p-4 w-full h-full">
      {/* Module Selection Dropdown and delete*/}
      <div className="flex flex-row justify-between items-center w-full mb-4">
        <select
          className="p-2 border rounded cursor-pointer h-10"
          onChange={(e) => handleModuleSelect(e.target.value)}
          value={selectedModule?.id || ""}
        >
          <option value="">Select a module</option>
          {modules.map((module) => (
            <option key={module.id} value={module.id}>
              {module.moduleName}
            </option>
          ))}
        </select>
        {selectedModule && (
          <button
            className="bg-red-500 h-10 text-white px-4 py-2 rounded cursor-pointer hover:bg-red-600 transition"
            onClick={() => {
              deleteModule(selectedModule.id);
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
