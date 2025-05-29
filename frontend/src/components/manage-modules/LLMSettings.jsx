import { useState, useEffect } from "react";

export default function LLMSettings({ module, setModal, refreshTrigger }) {
  const [llmSettings, setLlmSettings] = useState({});

  const [availableDocuments, setAvailableDocuments] = useState([]);

  const availableModels = ["gpt-4", "claude-3-sonnet"];

  // Save regular parameters
  const handleSaveChanges = async () => {
    try {
      // Show loading state
      const saveButton = document.querySelector('button[type="submit"]');
      if (saveButton) {
        saveButton.disabled = true;
        saveButton.innerHTML = "Saving...";
      }

      // Prepare the settings object
      const settingsToSave = {
        model: llmSettings.model,
        temperature: parseFloat(llmSettings.temperature),
        systemPrompt: llmSettings.systemPrompt,
        maxTokens: parseInt(llmSettings.maxTokens),
      };

      const response = await fetch(
        "http://localhost:5000/api/save-model-settings",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            moduleID: module.moduleID,
            ...settingsToSave,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update module LLM settings");
      }

      // Show success message
      setModal({
        active: true,
        type: "success",
        message: `LLM settings for module ${module.moduleID} updated successfully!`,
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error(error.response?.data?.message || "Failed to save settings");
    } finally {
      // Reset button state
      const saveButton = document.querySelector('button[type="submit"]');
      if (saveButton) {
        saveButton.disabled = false;
        saveButton.innerHTML = "Save changes";
      }
    }
  };

  // File Upload for Tagging
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Create FormData object to send file
    const formData = new FormData();
    formData.append("file", file);
    formData.append("moduleID", module.moduleID);

    try {
      // TODO: Implement actual file upload API call
      const response = await fetch("http://localhost:5000/api/tag-document", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Tagging failed");

      const newDoc = {
        id: data.point_id,
        name: data.filename,
      };

      setAvailableDocuments((prev) => [...prev, newDoc]);
    } catch (error) {
      console.error("Error uploading file:", error);
      // Add error handling as needed
    }
  };

  // File Upload for Untagging
  const handleDocumentDelete = async (docId) => {
    try {
      const response = await fetch("http://localhost:5000/api/untag-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          moduleID: module.moduleID,
          docID: docId,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Untagging failed");

      setAvailableDocuments((prev) => prev.filter((doc) => doc.id !== docId));
    } catch (error) {
      console.error("Error untagging document:", error);
    }
  };

  async function fetchLLMSettings() {
    try {
      const response = await fetch(
        `http://localhost:5000/api/get-model-settings/${module.moduleID}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch settings");
      }

      console.log(data.settings);

      // Update LLM settings
      setLlmSettings(data.settings);

      // Update available documents
      setAvailableDocuments(data.documents);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to fetch settings");
    }
  }

  // Fetch chatbot settings when the component mounts
  useEffect(() => {
    fetchLLMSettings();
  }, [module, refreshTrigger]);

  return (
    <div className="bg-gray-100 p-4 rounded w-full h-full flex flex-col space-y-3 text-sm">
      <h2 className="text-base font-semibold">LLM Model Settings</h2>

      {/* Model Selection */}
      <div>
        <label className="block mb-1">Current Model:</label>
        <select
          className="w-full p-2 border rounded"
          value={llmSettings.model}
          onChange={(e) =>
            setLlmSettings({ ...llmSettings, model: e.target.value })
          }
        >
          {availableModels.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </div>

      {/* Temperature */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Temperature</label>
        <div className="flex-1 ml-4 flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={llmSettings.temperature}
            onChange={(e) =>
              setLlmSettings({ ...llmSettings, temperature: e.target.value })
            }
            className="flex-1"
          />
          <span className="text-xs w-8 text-right">
            {llmSettings.temperature}
          </span>
        </div>
      </div>

      {/* System Prompt */}
      <div>
        <label className="block mb-1">System Prompt:</label>
        <textarea
          rows={2}
          className="w-full p-2 border rounded resize-none"
          value={llmSettings.systemPrompt}
          onChange={(e) =>
            setLlmSettings({ ...llmSettings, systemPrompt: e.target.value })
          }
        />
      </div>

      {/* Max Tokens */}
      <div>
        <label className="block mb-1">Maximum Tokens</label>
        <input
          type="number"
          min="1"
          max="8192"
          value={llmSettings.maxTokens}
          onChange={(e) =>
            setLlmSettings({
              ...llmSettings,
              maxTokens: parseInt(e.target.value),
            })
          }
          className="w-full max-w-[8rem] p-2 border rounded"
        />
      </div>

      {/* Save Button */}
      <button
        className="bg-green-500 w-full text-white px-3 py-1.5 rounded cursor-pointer hover:bg-green-600 transition text-sm"
        type="submit"
        onClick={handleSaveChanges}
      >
        Save changes
      </button>

      {/* Tagged Documents */}
      <div className="overflow-auto">
        <h3 className="text-sm font-medium mb-1">Current Documents Tagged:</h3>
        <div className="border rounded p-2 space-y-1 text-sm max-h-40 overflow-y-auto bg-white">
          {availableDocuments.map((doc) => (
            <div key={doc.id} className="flex justify-between items-center">
              <span>{doc.name}</span>
              <button
                onClick={() => handleDocumentDelete(doc.id)}
                className="text-red-500 hover:text-red-700 text-xs"
              >
                Untag
              </button>
            </div>
          ))}
          {availableDocuments.length === 0 && (
            <p className="text-gray-500 italic text-xs">
              No documents available
            </p>
          )}
        </div>
      </div>

      {/* File Upload */}
      <div className="text-xs space-y-1">
        <label className="block">
          <span className="cursor-pointer font-medium">Tag Documents</span>
          <input
            type="file"
            className="block w-full text-sm text-slate-500
              file:mr-4 file:py-1.5 file:px-3
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-violet-50 file:text-violet-700
              hover:file:bg-violet-100
              cursor-pointer"
            onChange={handleFileUpload}
            accept=".pdf,.doc,.docx,.txt"
          />
        </label>
        <p className="text-gray-500">
          Supported formats: PDF, DOC, DOCX, TXT. Tagging is automatic.
        </p>
      </div>
    </div>
  );
}
