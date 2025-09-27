import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaRobot, FaArrowLeft, FaCheck } from "react-icons/fa";

export default function SharedAgentPage({ setModal }) {
  const navigate = useNavigate();
  const { shareToken } = useParams();
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchAgent();
  }, [shareToken]);

  const fetchAgent = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/marketplace/agents/share/${shareToken}`,
        {
          credentials: "include",
        }
      );
      const data = await response.json();

      if (data.success) {
        setAgent(data.agent);
      } else {
        setModal({
          active: true,
          type: "fail",
          message: data.message,
        });
        navigate("/marketplace");
      }
    } catch (error) {
      console.error("Error fetching shared agent:", error);
      setModal({
        active: true,
        type: "fail",
        message: "Failed to load shared agent",
      });
      navigate("/marketplace");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToMyAgents = async () => {
    setAdding(true);
    try {
      // The agent is automatically added to user's collection when accessed via share link
      setModal({
        active: true,
        type: "success",
        message: "Agent added to your collection!",
      });
      navigate("/marketplace");
    } catch (error) {
      console.error("Error adding agent:", error);
      setModal({
        active: true,
        type: "fail",
        message: "Failed to add agent",
      });
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading agent...</div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Agent Not Found
        </h1>
        <p className="text-gray-600 mb-6">
          The shared agent link is invalid or the agent has been removed.
        </p>
        <button
          onClick={() => navigate("/marketplace")}
          className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition"
        >
          Go to Marketplace
        </button>
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
          <h1 className="text-3xl font-bold text-gray-800">Shared Agent</h1>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center gap-4 mb-6">
          <FaRobot className="text-4xl text-orange-500" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{agent.name}</h2>
            <p className="text-gray-600">by {agent.creator_name}</p>
          </div>
        </div>

        {agent.description && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Description
            </h3>
            <p className="text-gray-600">{agent.description}</p>
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            System Prompt
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700 whitespace-pre-wrap">
              {agent.system_prompt}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-1">Model</h4>
            <p className="text-gray-600">{agent.model}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-1">Temperature</h4>
            <p className="text-gray-600">{agent.temperature}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-1">Max Tokens</h4>
            <p className="text-gray-600">{agent.max_tokens}</p>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleAddToMyAgents}
            disabled={adding}
            className="flex-1 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {adding ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Adding...
              </>
            ) : (
              <>
                <FaCheck />
                Add to My Agents
              </>
            )}
          </button>
          <button
            onClick={() => navigate(`/chat/agent/${agent.agentID}`)}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Start Chatting
          </button>
        </div>
      </div>
    </div>
  );
}
