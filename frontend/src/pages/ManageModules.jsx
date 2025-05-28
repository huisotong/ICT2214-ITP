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

  // State to store students in selected module
  const [studentsInModule, setStudentsInModule] = useState([]);

  async function fetchUserAssignedModules() {
    try {
      const data = await fetchAssignedModules(user.userID);
      setModules(data);
    } catch (error) {
      console.error("Error fetching assigned modules:", error);
    }
  }

  async function fetchStudentsInModule(moduleId) {
    if (!moduleId) {
      setStudentsInModule([]);
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/students-in-module/${moduleId}`);
      if (!response.ok) throw new Error("Failed to fetch students");
      const data = await response.json();
      setStudentsInModule(data);
    } catch (error) {
      console.error("Error fetching students in module:", error);
      setStudentsInModule([]);
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
      await fetchStudentsInModule(selected.moduleID);
    } else {
      setStudentsInModule([]);
    }
  }

  async function deleteModule(moduleId) {
    if (!window.confirm(`Are you sure you want to delete module ${moduleId}? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`http://localhost:5000/api/delete-module`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ moduleID: moduleId }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to delete module");

      setModal({ active: true, type: "success", message: `Module ${moduleId} deleted successfully!` });
      setSelectedModule(null);
      setModuleSettings({ moduleID: "", moduleName: "", moduleDesc: "" });
      setStudentsInModule([]);
      await fetchUserAssignedModules();
    } catch (error) {
      console.error("Error deleting module:", error);
      setModal({ active: true, type: "fail", message: error.message || "Failed to delete module." });
    }
  }
  async function handleDeleteAssignment(assignmentID) {
  if (!window.confirm('Are you sure you want to remove this student from the module?')) return;

  try {
    const response = await fetch(`http://localhost:5000/api/delete-assignment/${assignmentID}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to delete student assignment');

    setModal({ active: true, type: 'success', message: 'Student removed from module!' });
    // Refresh student list
    await fetchStudentsInModule(selectedModule.moduleID);
  } catch (error) {
    setModal({ active: true, type: 'fail', message: error.message });
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
        // Try to get detailed error message from backend
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to enroll student");
      }

      setModal({ active: true, type: "success", message: "Student enrolled!" });
      setStudentForm({ name: "", studentID: "" });
      setShowPanel(false);

      await fetchStudentsInModule(selectedModule.moduleID);
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
      const response = await fetch("http://localhost:5000/api/enroll-students-csv", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to upload CSV");
      setModal({ active: true, type: "success", message: "Students uploaded via CSV!" });
      setCsvFile(null);
      setShowPanel(false);

      await fetchStudentsInModule(selectedModule.moduleID);
    } catch (err) {
      setModal({ active: true, type: "fail", message: err.message });
    }
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
          {/* LEFT: Students list */}
          <div className="w-1/2 border p-4 rounded max-h-full overflow-auto bg-white shadow">
            <h3 className="font-semibold mb-2">Students in {selectedModule.moduleID}</h3>
            
            {/* Add Student button moved here */}
            <div className="flex justify-end mb-2">
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                onClick={() => setShowPanel(true)}
              >
                + Add Student
              </button>
            </div>
            
            {studentsInModule.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-1 px-2">Student ID</th>
                    <th className="py-1 px-2">Name</th>
                    <th className="py-1 px-2">Email</th>
                    <th className="py-1 px-2">Credits</th>
                    <th className="py-1 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {studentsInModule.map((student) => (
                    <tr key={student.assignmentID} className="border-b hover:bg-gray-100">
                      <td className="py-1 px-2">{student.studentID}</td>
                      <td className="py-1 px-2">{student.name}</td>
                      <td className="py-1 px-2">{student.email}</td>
                      <td className="py-1 px-2">{student.studentCredits}</td>
                      <td className="py-1 px-2 flex gap-2">
                        <button
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit Student"
                          onClick={() => alert(`Edit student: ${student.name}`)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5h6m-6 4h6m-6 4h6m-6 4h6" />
                          </svg>
                        </button>
                        <button
                          className="text-red-600 hover:text-red-800"
                          title="Delete Student"
                          onClick={() => handleDeleteAssignment(student.assignmentID)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-4 text-gray-500">No students enrolled.</div>
            )}
          </div>

          {/*ModuleSettings and LLMSettings*/}
          <div className="w-1/2 flex flex-col justify-between items-center h-full overflow-auto space-y-6">
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

      {showPanel && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white w-1/2 p-6 rounded shadow-lg">
            <div className="flex border-b mb-4">
              <button
                className={`flex-1 p-2 font-semibold ${activeTab === "single" ? "border-b-2 border-blue-500" : ""}`}
                onClick={() => setActiveTab("single")}
              >
                Enroll Single Student
              </button>
              <button
                className={`flex-1 p-2 font-semibold ${activeTab === "csv" ? "border-b-2 border-blue-500" : ""}`}
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
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                />
                <input
                  className="w-full border px-3 py-2"
                  placeholder="Student ID"
                  value={studentForm.studentID}
                  onChange={(e) => setStudentForm({ ...studentForm, studentID: e.target.value })}
                />
                <div className="flex justify-between">
                  <button className="bg-red-500 text-white px-4 py-2 rounded" onClick={() => setShowPanel(false)}>
                    Go back
                  </button>
                  <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handleSingleEnroll}>
                    Enroll student
                  </button>
                </div>
              </div>
            )}

            {activeTab === "csv" && (
              <div className="space-y-4">
                <input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files[0])} />
                <div className="flex justify-between">
                  <button className="bg-red-500 text-white px-4 py-2 rounded" onClick={() => setShowPanel(false)}>
                    Go back
                  </button>
                  <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handleCsvUpload}>
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
