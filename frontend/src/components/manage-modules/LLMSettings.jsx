import { useState, useEffect } from "react";

export default function LLMSettings({ module, setModal }) {
  const [llmSettings, setLlmSettings] = useState({
    model: "Llama 3.3 70B Instruct",
    temperature: 0,
    topP: 1,
    presencePenalty: 0,
    frequencyPenalty: 0,
  });

  const availableModels = [
    "Llama 3.3 70B Instruct",
    "GPT-4",
    "Claude 2.1",
    // Add more models as needed
  ];

  const handleSaveChanges = () => {
    // TODO: Implement API call to save LLM settings
    console.log("Saving LLM settings:", llmSettings);
  };

  async function fetchLLMSettings() {
    setLlmSettings({
      model: "Llama 3.3 70B Instruct",
      temperature: 0,
      topP: 1,
      presencePenalty: 0,
      frequencyPenalty: 0,
    });
    return;
  }

  // Fetch chatbot settings when the component mounts
  useEffect(() => {}, []);

  return (
    <div className="bg-gray-100 p-4 rounded mt-4 w-full h-1/2 overflow-auto flex flex-col justify-evenly">
      <h2 className="text-xl mb-4">LLM Model settings</h2>

      <div className="mb-4">
        <label className="block mb-2">Current Model:</label>
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

      <div className="space-y-4">
        <div>
          <label className="flex items-center space-x-2">
            <span>Temperature</span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={llmSettings.temperature}
            onChange={(e) =>
              setLlmSettings({ ...llmSettings, temperature: e.target.value })
            }
            className="w-3/4"
          />
          <span className="text-sm">{llmSettings.temperature}</span>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <span>Top P</span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={llmSettings.topP}
            onChange={(e) =>
              setLlmSettings({ ...llmSettings, topP: e.target.value })
            }
            className="w-3/4"
          />
          <span className="text-sm">{llmSettings.topP}</span>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <span>Presence Penalty</span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={llmSettings.presencePenalty}
            onChange={(e) =>
              setLlmSettings({
                ...llmSettings,
                presencePenalty: e.target.value,
              })
            }
            className="w-3/4"
          />
          <span className="text-sm">{llmSettings.presencePenalty}</span>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <span>Frequency Penalty</span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={llmSettings.frequencyPenalty}
            onChange={(e) =>
              setLlmSettings({
                ...llmSettings,
                frequencyPenalty: e.target.value,
              })
            }
            className="w-3/4"
          />
          <span className="text-sm">{llmSettings.frequencyPenalty}</span>
        </div>
      </div>

      <button
        className="bg-green-500 mt-4 text-white px-4 py-2 rounded cursor-pointer hover:bg-green-600 transition"
        onClick={handleSaveChanges}
      >
        Save changes
      </button>
    </div>
  );
}
