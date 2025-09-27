import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaPlus,
  FaRobot,
  FaEye,
  FaShare,
  FaEdit,
  FaTrash,
  FaCopy,
} from "react-icons/fa";

export default function MarketplacePage({ setModal }) {
  const [agents, setAgents] = useState([]);
  const [myAgents, setMyAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("marketplace");

  useEffect(() => {
    fetchAgents();
    fetchMyAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/marketplace/agents",
        {
          credentials: "include",
        }
      );
      const data = await response.json();
      if (data.success) {
        setAgents(data.agents);
      }
    } catch (error) {
      console.error("Error fetching agents:", error);
      setModal({
        active: true,
        type: "fail",
        message: "Failed to load marketplace agents",
      });
    }
  };

  const fetchMyAgents = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/marketplace/my-agents",
        {
          credentials: "include",
        }
      );
      const data = await response.json();
      if (data.success) {
        setMyAgents(data.agents);
      }
    } catch (error) {
      console.error("Error fetching my agents:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyShareLink = (shareToken) => {
    const shareUrl = `${window.location.origin}/marketplace/share/${shareToken}`;
    navigator.clipboard.writeText(shareUrl);
    setModal({
      active: true,
      type: "success",
      message: "Share link copied to clipboard!",
    });
  };

  const deleteAgent = async (agentId) => {
    if (!window.confirm("Are you sure you want to delete this agent?")) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/marketplace/agents/${agentId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      const data = await response.json();

      if (data.success) {
        setModal({
          active: true,
          type: "success",
          message: "Agent deleted successfully",
        });
        fetchMyAgents();
      } else {
        setModal({
          active: true,
          type: "fail",
          message: data.message,
        });
      }
    } catch (error) {
      console.error("Error deleting agent:", error);
      setModal({
        active: true,
        type: "fail",
        message: "Failed to delete agent",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Agent Marketplace</h1>
        <Link
          to="/marketplace/create"
          className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition flex items-center gap-2"
        >
          <FaPlus />
          Create Agent
        </Link>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("marketplace")}
          className={`px-6 py-3 font-medium ${
            activeTab === "marketplace"
              ? "border-b-2 border-orange-500 text-orange-500"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Browse Marketplace
        </button>
        <button
          onClick={() => setActiveTab("my-agents")}
          className={`px-6 py-3 font-medium ${
            activeTab === "my-agents"
              ? "border-b-2 border-orange-500 text-orange-500"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          My Agents
        </button>
      </div>

      {/* Marketplace Tab */}
      {activeTab === "marketplace" && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Available Agents</h2>
          {agents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FaRobot className="mx-auto text-4xl mb-4" />
              <p>No agents available in the marketplace yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent) => (
                <div
                  key={agent.agentID}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <FaRobot className="text-2xl text-sit-orange" />
                    <div>
                      <h3 className="font-semibold text-lg">{agent.name}</h3>
                      <p className="text-sm text-gray-500">
                        by {agent.creator_name}
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {agent.description || "No description provided"}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <FaEye />
                      {agent.view_count} views
                    </span>
                    <span>{agent.model}</span>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      to={`/marketplace/share/${agent.share_token}`}
                      className="flex-1 bg-orange-500 text-white px-4 py-2 rounded text-center hover:bg-orange-600 transition"
                    >
                      Use Agent
                    </Link>
                    <button
                      onClick={() => copyShareLink(agent.share_token)}
                      className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition"
                      title="Copy share link"
                    >
                      <FaShare />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* My Agents Tab */}
      {activeTab === "my-agents" && (
        <div>
          <h2 className="text-xl font-semibold mb-4">My Agents</h2>
          {myAgents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FaRobot className="mx-auto text-4xl mb-4" />
              <p>You haven't created or added any agents yet.</p>
              <Link
                to="/marketplace/create"
                className="inline-block mt-4 bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition"
              >
                Create Your First Agent
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myAgents.map((userAgent) => {
                const agent = userAgent.agent;
                return (
                  <div
                    key={agent.agentID}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <FaRobot className="text-2xl text-orange-500" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{agent.name}</h3>
                        <p className="text-sm text-gray-500">
                          {userAgent.is_owner
                            ? "Created by you"
                            : `by ${agent.creator_name}`}
                        </p>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {agent.description || "No description provided"}
                    </p>

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <FaEye />
                        {agent.view_count} views
                      </span>
                      <span>{agent.model}</span>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        to={`/chat/agent/${agent.agentID}`}
                        className="flex-1 bg-orange-500 text-white px-4 py-2 rounded text-center hover:bg-orange-600 transition"
                      >
                        Chat with Agent
                      </Link>
                      {userAgent.is_owner && (
                        <>
                          <Link
                            to={`/marketplace/edit/${agent.agentID}`}
                            className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition"
                            title="Edit agent"
                          >
                            <FaEdit />
                          </Link>
                          <button
                            onClick={() => deleteAgent(agent.agentID)}
                            className="px-3 py-2 border border-red-300 text-red-600 rounded hover:bg-red-50 transition"
                            title="Delete agent"
                          >
                            <FaTrash />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => copyShareLink(agent.share_token)}
                        className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition"
                        title="Copy share link"
                      >
                        <FaShare />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
