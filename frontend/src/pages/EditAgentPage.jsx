import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaRobot, FaArrowLeft } from "react-icons/fa";

export default function EditAgentPage({ setModal }) {
  const navigate = useNavigate();
  const { agentId } = useParams();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    system_prompt: "",
    model: "gpt-3.5-turbo",
    temperature: 0.7,
    max_tokens: 1000,
    is_public: true,
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    fetchAgent();
  }, [agentId]);

  const fetchAgent = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/marketplace/agents/${agentId}`,
        {
          credentials: "include",
        }
      );
      const data = await response.json();

      if (data.success) {
        const agent = data.agent;
        setFormData({
          name: agent.name,
          description: agent.description || "",
          system_prompt: agent.system_prompt,
          model: agent.model,
          temperature: agent.temperature,
          max_tokens: agent.max_tokens,
          is_public: agent.is_public,
        });
      } else {
        setModal({
          active: true,
          type: "fail",
          message: data.message,
        });
        navigate("/marketplace");
      }
    } catch (error) {
      console.error("Error fetching agent:", error);
      setModal({
        active: true,
        type: "fail",
        message: "Failed to load agent",
      });
      navigate("/marketplace");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? parseFloat(value)
          : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        `http://localhost:5000/api/marketplace/agents/${agentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (data.success) {
        setModal({
          active: true,
          type: "success",
          message: "Agent updated successfully!",
        });
        navigate("/marketplace");
      } else {
        setModal({
          active: true,
          type: "fail",
          message: data.message,
        });
      }
    } catch (error) {
      console.error("Error updating agent:", error);
      setModal({
        active: true,
        type: "fail",
        message: "Failed to update agent",
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading agent...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate("/marketplace")}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <FaArrowLeft className="text-xl" />
        </button>
        <div className="flex items-center gap-3">
          <FaRobot className="text-3xl text-orange-500" />
          <h1 className="text-3xl font-bold text-gray-800">Edit Agent</h1>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-md p-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="md:col-span-2">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Basic Information
            </h2>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agent Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter agent name"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Describe what your agent does"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              System Prompt *
            </label>
            <textarea
              name="system_prompt"
              value={formData.system_prompt}
              onChange={handleChange}
              required
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter the system prompt that defines your agent's behavior and personality"
            />
            <p className="text-sm text-gray-500 mt-1">
              This prompt will define how your agent behaves and responds to
              users.
            </p>
          </div>

          {/* Model Configuration */}
          <div className="md:col-span-2">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Model Configuration
            </h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model
            </label>
            <select
              name="model"
              value={formData.model}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Temperature: {formData.temperature}
            </label>
            <input
              type="range"
              name="temperature"
              min="0"
              max="2"
              step="0.1"
              value={formData.temperature}
              onChange={handleChange}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>More Focused</span>
              <span>More Creative</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Tokens
            </label>
            <input
              type="number"
              name="max_tokens"
              value={formData.max_tokens}
              onChange={handleChange}
              min="100"
              max="4000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visibility
            </label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_public"
                checked={formData.is_public}
                onChange={handleChange}
                className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700">
                Make this agent public in the marketplace
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate("/marketplace")}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Updating..." : "Update Agent"}
          </button>
        </div>
      </form>
    </div>
  );
}
