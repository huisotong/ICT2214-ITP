import { useState } from "react";

export default function AddModuleOverlay({ user, onClose, setModal }) {
  const [moduleName, setModuleName] = useState("");
  const [credit, setCredit] = useState("");
  const [csvFile, setCsvFile] = useState(null);

  // Enable button only if moduleName and credit are filled
  const isDisabled = !moduleName.trim() || !credit.trim();

  async function handleSubmit(e) {
    e.preventDefault();
    if (isDisabled) return;

    const formData = new FormData();
    formData.append("moduleName", moduleName);
    formData.append("moduleOwner", user.name);
    formData.append("initialCredit", credit);
    if (csvFile) {
      formData.append("csvFile", csvFile);
    }

    try {
      const response = await fetch("http://localhost:5000/api/addModule", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        setModal({
          active: true,
          type: "fail",
          message: "Failed to add module. Please try again.",
        });
        onClose();
        return;
      }

      const data = await response.json();
      setModal({
        active: true,
        type: "success",
        message: `Module ${data.moduleName} added successfully!`,
      });
      // refresh page maybe
      onClose();
    } catch (error) {
      setModal({
        active: true,
        type: "fail",
        message: "Failed to add module. Please try again.",
      });
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-gray-100 border border-black rounded-lg p-8 w-[400px] relative">
        <h2 className="text-xl font-bold mb-4 border-b pb-2">Add Module</h2>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="block font-semibold mb-1">Module Name</label>
            <input
              className="w-full border-2 rounded px-2 py-1"
              value={moduleName}
              onChange={(e) => setModuleName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Module Owner</label>
            <input
              className="w-full border-2 rounded px-2 py-1 bg-gray-200"
              value={user.name}
              disabled
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">
              Initial credit amount for students
            </label>
            <input
              className="w-full border-2 rounded px-2 py-1"
              value={credit}
              onChange={(e) => setCredit(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">
              Mass enroll students (with .csv)
            </label>
            <input
              type="file"
              className="mb-2 border-2 rounded-md p-2 hover:bg-gray-200 cursor-pointer"
              accept=".csv"
              onChange={(e) => setCsvFile(e.target.files[0])}
            />
            <div className="text-xs text-gray-600">
              Format of csv file should follow lorum ipsum dolor amet
            </div>
          </div>
          <div className="flex justify-between mt-4">
            <button
              type="button"
              className="bg-red-500 text-white px-6 py-2 rounded font-bold cursor-pointer hover:bg-red-600 transition"
              onClick={onClose}
            >
              Go back
            </button>
            <button
              type="submit"
              disabled={isDisabled}
              className={`px-6 py-2 rounded font-bold transition ${
                isDisabled
                  ? "bg-blue-300 text-white cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
              }`}
            >
              Create Module
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
