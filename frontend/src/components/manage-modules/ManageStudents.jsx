import { useState, useEffect } from "react";

export default function ManageStudents({
  module,
  setModal,
  onDeleteAssignment,
  refreshTrigger,
}) {
  const [students, setStudents] = useState([]);

  async function fetchStudents() {
    if (!module?.moduleID) {
      setStudents([]);
      return;
    }
    try {
      const response = await fetch(
        `http://localhost:5000/api/students-in-module/${module.moduleID}`
      );
      if (!response.ok) throw new Error("Failed to fetch students");
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error("Error fetching students in module:", error);
      setStudents([]);
      setModal?.({ active: true, type: "fail", message: error.message });
    }
  }

  useEffect(() => {
    fetchStudents();
  }, [module, refreshTrigger]); // watch refreshTrigger to refetch

  return (
    <div className="w-full border p-4 rounded max-h-full h-full overflow-auto bg-white shadow">
      <h3 className="font-semibold mb-2">
        Students in {module?.moduleID || ""}
      </h3>

      {students.length > 0 ? (
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
            {students.map((student) => (
              <tr
                key={student.assignmentID}
                className="border-b hover:bg-gray-100"
              >
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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11 5h6m-6 4h6m-6 4h6m-6 4h6"
                      />
                    </svg>
                  </button>
                  <button
                    className="text-red-600 hover:text-red-800"
                    title="Delete Student"
                    onClick={() =>
                      onDeleteAssignment &&
                      onDeleteAssignment(student.assignmentID)
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
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
  );
}
