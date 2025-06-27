import { useState, useEffect } from "react";

export default function LLMSettings({ module, setModal, refreshTrigger }) {
  const [llmSettings, setLlmSettings] = useState({});
  const [availableDocuments, setAvailableDocuments] = useState([]);
  const [isSaving, setIsSaving] = useState(false); // Add loading state
  const [isUploading, setIsUploading] = useState(false); // Add upload loading state
  const [untaggingDocs, setUntaggingDocs] = useState(new Set()); // Track which docs are being untagged

  const availableModels = [
    { label: "Gpt-4 (Paid)", value: "openai/gpt-4" },
    { label: "Deepseek-V3 (Paid)", value: "deepseek/deepseek-chat-v3-0324" },
    { label: "Gemini-2.0 (Paid)", value: "google/gemini-2.0-flash-001" },
    { label: "Claude-3 (Paid)", value: "anthropic/claude-3-sonnet" },
    { label: "Deepseek-R1 (Free)", value: "deepseek/deepseek-r1-0528:free" },
    { label: "Gemma-3n (Free)", value: "google/gemma-3n-e4b-it:free" },
    {
      label: "Deepseek-V3 (Free)",
      value: "deepseek/deepseek-chat-v3-0324:free",
    },
  ];

  // Save regular parameters
  const handleSaveChanges = async () => {
    if (isSaving) return; // Prevent multiple submissions

    setIsSaving(true); // Start loading

    try {
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
      // Note: You'll need to import toast or replace with your error handling
      // toast.error(error.response?.data?.message || "Failed to save settings");
    } finally {
      setIsSaving(false); // Stop loading
    }
  };

  // File Upload for Tagging
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (isUploading) return; // Prevent multiple uploads

    setIsUploading(true); // Start upload loading

    // Create FormData object to send file
    const formData = new FormData();
    formData.append("file", file);
    formData.append("moduleID", module.moduleID);

    try {
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

      // Show success message
      setModal({
        active: true,
        type: "success",
        message: `Document "${data.filename}" tagged successfully!`,
      });

      // Clear the file input
      e.target.value = "";
    } catch (error) {
      console.error("Error uploading file:", error);
      setModal({
        active: true,
        type: "fail",
        message:
          error.message ||
          "Failed to upload and tag document. Please try again.",
      });
    } finally {
      setIsUploading(false); // Stop upload loading
    }
  };

  // File Upload for Untagging
  const handleDocumentDelete = async (docId) => {
    if (untaggingDocs.has(docId)) return; // Prevent multiple untag requests for same doc

    // Add doc to untagging set
    setUntaggingDocs((prev) => new Set(prev).add(docId));

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

      // Show success message
      setModal({
        active: true,
        type: "success",
        message: "Document untagged successfully!",
      });
    } catch (error) {
      console.error("Error untagging document:", error);
      setModal({
        active: true,
        type: "fail",
        message: error.message || "Failed to untag document. Please try again.",
      });
    } finally {
      // Remove doc from untagging set
      setUntaggingDocs((prev) => {
        const newSet = new Set(prev);
        newSet.delete(docId);
        return newSet;
      });
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
      console.log("📄 Available documents:", data.documents);
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
            <option key={model.value} value={model.value}>
              {model.label}
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
        className={`w-full text-white px-3 py-1.5 rounded transition text-sm flex items-center justify-center ${
          isSaving
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-500 cursor-pointer hover:bg-green-600"
        }`}
        type="submit"
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

      {/* Tagged Documents */}
      <div className="overflow-auto">
        <h3 className="text-sm font-medium mb-1">Current Documents Tagged:</h3>
        <div className="border rounded p-2 space-y-1 text-sm max-h-40 overflow-y-auto bg-white">
          {availableDocuments.map((doc) => (
            <div key={doc.id} className="flex justify-between items-center">
              <span>{doc.name}</span>
              <button
                onClick={() => handleDocumentDelete(doc.id)}
                disabled={untaggingDocs.has(doc.id)}
                className={`text-xs flex items-center ${
                  untaggingDocs.has(doc.id)
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-red-500 hover:text-red-700 cursor-pointer"
                }`}
              >
                {untaggingDocs.has(doc.id) ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-1 h-3 w-3"
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
                    Untagging...
                  </>
                ) : (
                  "Untag"
                )}
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
            className={`block w-full text-sm text-slate-500
              file:mr-4 file:py-1.5 file:px-3
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-violet-50 file:text-violet-700
              hover:file:bg-violet-100
              ${
                isUploading ? "cursor-not-allowed opacity-50" : "cursor-pointer"
              }`}
            onChange={handleFileUpload}
            accept=".pdf,.doc,.docx,.txt"
            disabled={isUploading}
          />
        </label>

        {isUploading && (
          <div className="flex items-center text-blue-600 text-xs">
            <svg
              className="animate-spin -ml-1 mr-2 h-3 w-3"
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
            Uploading and tagging document...
          </div>
        )}

        <p className="text-gray-500">
          Supported formats: PDF, DOC, DOCX, TXT. Tagging is automatic.
        </p>
      </div>
    </div>
  );
}
