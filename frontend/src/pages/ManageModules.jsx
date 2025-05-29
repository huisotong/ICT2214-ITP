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

  const { auth } = useAuth();
  const user = auth.user;

  const [showPanel, setShowPanel] = useState(false);
  const [activeTab, setActiveTab] = useState("single");
  const [studentForm, setStudentForm] = useState({ name: "", studentID: "" });
  const [csvFile, setCsvFile] = useState(null);

  // This state is used to trigger ManageStudents to refresh its student list
  const [refreshStudents, setRefreshStudents] = useState(0);
  const [refreshLLM, setRefreshLLM] = useState(0);

  async function fetchUserAssignedModules() {
    try {
      const data = await fetchAssignedModules(user.userID);
      setModules(data);
      return data; // return fresh data for chaining
    } catch (error) {
      console.error("Error fetching assigned modules:", error);
      return [];
    }
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
      // refreshStudents is changed below to cause ManageStudents to fetch students for this module
      setRefreshStudents((prev) => prev + 1);
      setRefreshLLM((prev) => prev + 1); // refresh LLM settings
    }
  }

  async function deleteModule(moduleId) {
    if (
      !window.confirm(
        `Are you sure you want to delete module ${moduleId}? This action cannot be undone.`
      )
    )
      return;

    try {
      const response = await fetch(`http://localhost:5000/api/delete-module`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ moduleID: moduleId }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to delete module");

      setModal({
        active: true,
        type: "success",
        message: `Module ${moduleId} deleted successfully!`,
      });
      setSelectedModule(null);
      setModuleSettings({ moduleID: "", moduleName: "", moduleDesc: "" });
      setRefreshStudents((prev) => prev + 1); // Refresh student list as module is deleted
      await fetchUserAssignedModules();
    } catch (error) {
      console.error("Error deleting module:", error);
      setModal({
        active: true,
        type: "fail",
        message: error.message || "Failed to delete module.",
      });
    }
  }

  async function handleDeleteAssignment(assignmentID) {
    if (
      !window.confirm(
        "Are you sure you want to remove this student from the module?"
      )
    )
      return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/delete-assignment/${assignmentID}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Failed to delete student assignment");

      setModal({
        active: true,
        type: "success",
        message: "Student removed from module!",
      });

      // Trigger ManageStudents to refresh the student list immediately
      setRefreshStudents((prev) => prev + 1);
    } catch (error) {
      setModal({ active: true, type: "fail", message: error.message });
    }
  }

  async function handleSingleEnroll() {
    try {
      const response = await fetch("http://localhost:5000/api/enroll-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleID: selectedModule.moduleID,
          name: studentForm.name,
          studentID: studentForm.studentID,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to enroll student");
      }

      setModal({ active: true, type: "success", message: "Student enrolled!" });
      setStudentForm({ name: "", studentID: "" });
      setShowPanel(false);

      // Refresh students after enrolling one
      setRefreshStudents((prev) => prev + 1);
    } catch (err) {
      setModal({ active: true, type: "fail", message: err.message });
    }
  }

  async function handleCsvUpload() {
    if (!csvFile) return;

    const formData = new FormData();
    formData.append("file", csvFile);
    formData.append("moduleID", selectedModule.moduleID);

    try {
      const response = await fetch(
        "http://localhost:5000/api/enroll-students-csv",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Failed to upload CSV");
      setModal({
        active: true,
        type: "success",
        message: "Students uploaded via CSV!",
      });
      setCsvFile(null);
      setShowPanel(false);

      // Refresh students after CSV upload
      setRefreshStudents((prev) => prev + 1);
    } catch (err) {
      setModal({ active: true, type: "fail", message: err.message });
    }
  }

  // Refresh modules list after a module edit
  async function onModuleUpdated() {
    const updatedModules = await fetchUserAssignedModules();
    const updatedModule = updatedModules.find(
      (m) => m.moduleID === moduleSettings.moduleID
    );
    setSelectedModule(updatedModule || null);
    setRefreshStudents((prev) => prev + 1); // Refresh students for the updated module
  }

  useEffect(() => {
    fetchUserAssignedModules();
  }, []);

  return (
    <div className="p-4 w-full h-full">
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
          <div className="flex gap-2">
            <button
              className="bg-red-500 h-10 text-white px-4 py-2 rounded cursor-pointer hover:bg-red-600 transition"
              onClick={() => deleteModule(selectedModule.moduleID)}
            >
              Delete Module
            </button>
          </div>
        )}
      </div>

      {selectedModule && (
        <div className="flex flex-row justify-between items-start w-full h-screen gap-4">
          {/* LEFT: Students list handled by ManageStudents */}
          <div className="w-1/2">
            <ManageStudents
              module={selectedModule}
              setModal={setModal}
              onDeleteAssignment={handleDeleteAssignment}
              refreshTrigger={refreshStudents} // trigger to refetch students
            />
            {/* Add Student button */}
            <div className="flex justify-end mt-2">
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                onClick={() => setShowPanel(true)}
              >
                + Add Student
              </button>
            </div>
          </div>

          {/* ModuleSettings and LLMSettings */}
          <div className="w-1/2 flex flex-col justify-between items-center h-full overflow-auto space-y-6">
            <ModuleSettings
              module={selectedModule}
              setModal={setModal}
              moduleSettings={moduleSettings}
              setModuleSettings={setModuleSettings}
              onModuleUpdated={onModuleUpdated}
            />
            <LLMSettings
              module={selectedModule}
              setModal={setModal}
              refreshTrigger={refreshLLM}
            />
          </div>
        </div>
      )}

      {showPanel && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white w-1/2 p-6 rounded shadow-lg">
            <div className="flex border-b mb-4">
              <button
                className={`flex-1 p-2 font-semibold ${
                  activeTab === "single" ? "border-b-2 border-blue-500" : ""
                }`}
                onClick={() => setActiveTab("single")}
              >
                Enroll Single Student
              </button>
              <button
                className={`flex-1 p-2 font-semibold ${
                  activeTab === "csv" ? "border-b-2 border-blue-500" : ""
                }`}
                onClick={() => setActiveTab("csv")}
              >
                Mass Enroll via CSV
              </button>
            </div>

            {activeTab === "single" && (
              <div className="space-y-4">
                <input
                  className="w-full border px-3 py-2"
                  placeholder="Student Name"
                  value={studentForm.name}
                  onChange={(e) =>
                    setStudentForm({ ...studentForm, name: e.target.value })
                  }
                />
                <input
                  className="w-full border px-3 py-2"
                  placeholder="Student ID"
                  value={studentForm.studentID}
                  onChange={(e) =>
                    setStudentForm({
                      ...studentForm,
                      studentID: e.target.value,
                    })
                  }
                />
                <div className="flex justify-between">
                  <button
                    className="bg-red-500 text-white px-4 py-2 rounded"
                    onClick={() => setShowPanel(false)}
                  >
                    Go back
                  </button>
                  <button
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                    onClick={handleSingleEnroll}
                  >
                    Enroll student
                  </button>
                </div>
              </div>
            )}

            {activeTab === "csv" && (
              <div className="space-y-4">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files[0])}
                />
                <div className="flex justify-between">
                  <button
                    className="bg-red-500 text-white px-4 py-2 rounded"
                    onClick={() => setShowPanel(false)}
                  >
                    Go back
                  </button>
                  <button
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                    onClick={handleCsvUpload}
                  >
                    Upload CSV
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
