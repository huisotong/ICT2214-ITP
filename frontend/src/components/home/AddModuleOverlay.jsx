import { useState } from "react";

export default function AddModuleOverlay({
  user,
  onClose,
  setModal,
  setRefreshTrigger,
}) {
  const [moduleParams, setModuleParams] = useState({
    id: "",
    name: "",
    description: "",
  });
  const [credit, setCredit] = useState("");
  const [csvFile, setCsvFile] = useState(null);

  // Enable button only if required fields are filled
  const isDisabled =
    !moduleParams.id.trim() || !moduleParams.name.trim() || !credit.trim();

  const handleModuleParamChange = (e) => {
    const { name, value } = e.target;
    setModuleParams((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (isDisabled) return;

    const formData = new FormData();
    formData.append("userID", user.userID);
    formData.append("moduleID", moduleParams.id);
    formData.append("moduleName", moduleParams.name);
    formData.append("moduleDescription", moduleParams.description);
    formData.append("initialCredit", credit);
    if (csvFile) {
      formData.append("csvFile", csvFile);
    }

    try {
      const response = await fetch("http://localhost:5000/api/add-module", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setModal({
          active: true,
          type: "fail",
          message: data.error || "Failed to create module",
        });
        onClose();
        return;
      }

      // Construct success message including warnings if any
      let successMessage = `Module ${moduleParams.name} created successfully!`;
      if (data.warnings) {
        successMessage += `\n\n${data.warnings}`;
      }

      setModal({
        active: true,
        type: "success",
        message: successMessage,
      });
      setRefreshTrigger(1);
      onClose();
    } catch (error) {
      console.error("Error creating module:", error);
      setModal({
        active: true,
        type: "fail",
        message: "Failed to create module. Please try again.",
      });
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-gray-100 border border-black rounded-lg p-8 w-[500px] relative h-[600px] overflow-auto">
        <button
          type="button"
          className="absolute cursor-pointer top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-4 border-b pb-2">Add Module</h2>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="block font-semibold mb-1">Module Code</label>
            <input
              className="w-full border-2 rounded px-2 py-1"
              name="id"
              value={moduleParams.id}
              onChange={handleModuleParamChange}
              required
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Module Name</label>
            <textarea
              className="w-full border-2 rounded px-2 py-1 resize-none overflow-y-auto"
              name="name"
              value={moduleParams.name}
              onChange={handleModuleParamChange}
              required
              rows={2}
              maxLength={100}
              placeholder="Enter module name (max 100 characters)"
            />
            <div className="text-xs text-gray-500 mt-1">
              {moduleParams.name.length}/100 characters
            </div>
          </div>
          <div>
            <label className="block font-semibold mb-1">
              Module Description
            </label>
            <textarea
              className="w-full border-2 rounded px-2 py-1 resize-none overflow-y-auto"
              name="description"
              value={moduleParams.description}
              onChange={handleModuleParamChange}
              required
              rows={4}
              maxLength={500}
              placeholder="Enter module description (max 500 characters)"
            />
            <div className="text-xs text-gray-500 mt-1">
              {moduleParams.description.length}/500 characters
            </div>
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
              placeholder="e.g. 100"
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
            <div className="text-sm text-gray-600">
              Format of csv file should follow this
              <a
                href="/template.csv"
                download
                className="text-blue-600 hover:text-blue-800 underline mx-1"
              >
                template
              </a>
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
