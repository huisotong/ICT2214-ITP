import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { fetchAssignedModules } from "../../utils/fetchAssignedModules";

export default function RequestCreditsPage({ setModal }) {
  const { auth } = useAuth();
  const { checkForNewNotifications } = useNotifications();
  const user = auth.user;

  const [modules, setModules] = useState([]);
  const [selectedModuleAssignment, setSelectedModuleAssignment] = useState("");
  const [creditsRequested, setCreditsRequested] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingModules, setFetchingModules] = useState(true);
  const [userRequests, setUserRequests] = useState([]);
  const [fetchingRequests, setFetchingRequests] = useState(true);

  // Fetch user's module assignments
  useEffect(() => {
    async function fetchUserModules() {
      setFetchingModules(true);
      try {
        const data = await fetchAssignedModules(user.userID);
        setModules(data || []);
      } catch (error) {
        console.error("Error fetching user modules:", error);
        setModal?.({ 
          active: true, 
          type: "fail", 
          message: "Failed to load your modules. Please try again." 
        });
      } finally {
        setFetchingModules(false);
      }
    }

    if (user?.userID) {
      fetchUserModules();
    }
  }, [user?.userID, setModal]);

  // Fetch user's existing credit requests
  useEffect(() => {
    async function fetchUserRequests() {
      setFetchingRequests(true);
      try {
        const response = await fetch("http://localhost:5000/api/credit-requests");
        if (response.ok) {
          const allRequests = await response.json();
          // Filter requests for current user by matching userID through assignmentID
          const userModuleAssignments = modules.map(m => m.assignmentID);
          const filteredRequests = allRequests.filter(req => 
            userModuleAssignments.includes(req.assignmentID)
          );
          setUserRequests(filteredRequests);
        }
      } catch (error) {
        console.error("Error fetching user requests:", error);
      } finally {
        setFetchingRequests(false);
      }
    }

    if (modules.length > 0) {
      fetchUserRequests();
    }
  }, [modules]);

  // Check for new notifications when page loads
  useEffect(() => {
    if (user?.userID) {
      checkForNewNotifications();
    }
  }, [user?.userID, checkForNewNotifications]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedModuleAssignment || !creditsRequested) {
      setModal?.({ 
        active: true, 
        type: "fail", 
        message: "Please select a module and enter the number of credits requested." 
      });
      return;
    }

    const credits = parseInt(creditsRequested);
    if (credits <= 0) {
      setModal?.({ 
        active: true, 
        type: "fail", 
        message: "Credits requested must be a positive number." 
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/credit-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          assignmentID: selectedModuleAssignment,
          creditsRequested: credits,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit credit request");
      }

      setModal?.({ 
        active: true, 
        type: "success", 
        message: "Credit request submitted successfully!" 
      });
      
      // Reset form
      setSelectedModuleAssignment("");
      setCreditsRequested("");
      
      // Refresh user requests
      const userModuleAssignments = modules.map(m => m.assignmentID);
      try {
        const response = await fetch("http://localhost:5000/api/credit-requests");
        if (response.ok) {
          const allRequests = await response.json();
          const filteredRequests = allRequests.filter(req => 
            userModuleAssignments.includes(req.assignmentID)
          );
          setUserRequests(filteredRequests);
        }
      } catch (error) {
        console.error("Error refreshing requests:", error);
      }
      
    } catch (error) {
      setModal?.({ 
        active: true, 
        type: "fail", 
        message: error.message 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequest = async (requestID) => {
    if (!window.confirm("Are you sure you want to delete this credit request? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/credit-requests/${requestID}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete credit request");
      }

      setModal?.({ 
        active: true, 
        type: "success", 
        message: "Credit request deleted successfully!" 
      });
      
      // Refresh user requests
      const userModuleAssignments = modules.map(m => m.assignmentID);
      try {
        const refreshResponse = await fetch("http://localhost:5000/api/credit-requests");
        if (refreshResponse.ok) {
          const allRequests = await refreshResponse.json();
          const filteredRequests = allRequests.filter(req => 
            userModuleAssignments.includes(req.assignmentID)
          );
          setUserRequests(filteredRequests);
        }
      } catch (error) {
        console.error("Error refreshing requests:", error);
      }
      
    } catch (error) {
      setModal?.({ 
        active: true, 
        type: "fail", 
        message: error.message 
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Existing Requests Section */}
      {userRequests.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Your Credit Requests</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Request ID</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Module</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Credits Requested</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Request Date</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {userRequests.map((request) => {
                  const module = modules.find(m => m.assignmentID === request.assignmentID);
                  return (
                    <tr key={request.requestID} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">{request.requestID}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        {module ? `${module.moduleID} - ${module.moduleName}` : 'Unknown Module'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">{request.creditsRequested}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'Approved' ? 'bg-green-100 text-green-800' :
                          request.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {request.requestDate ? new Date(request.requestDate).toLocaleDateString() : 'N/A'}
                      </td>                      <td className="border border-gray-300 px-4 py-2">
                        {request.status === 'Pending' ? (
                          <button
                            onClick={() => handleDeleteRequest(request.requestID)}
                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm font-semibold transition-colors"
                            title="Delete this pending request"
                          >
                            Delete
                          </button>
                        ) : (
                          <span className="text-gray-500 text-sm">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submit New Request Section */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Request Credits</h1>
          <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
          <p className="text-blue-800">
            <strong>Note:</strong> Credit requests are reviewed by administrators. 
            You can only have one pending request per module at a time. You can delete pending requests if you change your mind.
          </p>
        </div>

        {fetchingModules ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading your modules...</p>
          </div>
        ) : modules.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">You are not enrolled in any modules yet.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="module" className="block text-sm font-semibold text-gray-700 mb-2">
                Select Module *
              </label>
              <select
                id="module"
                value={selectedModuleAssignment}
                onChange={(e) => setSelectedModuleAssignment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">-- Select a module --</option>
                {modules.map((module) => (
                  <option key={module.assignmentID} value={module.assignmentID}>
                    {`${module.moduleID} - ${module.moduleName}`}
                    {module.studentCredits !== undefined && ` (Current Credits: ${module.studentCredits} USD) `}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="credits" className="block text-sm font-semibold text-gray-700 mb-2">
                Credits Requested (In USD) *
              </label>
              <input
                type="number"
                id="credits"
                min="1"
                step="1"
                value={creditsRequested}
                onChange={(e) => setCreditsRequested(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter number of credits"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter the number of additional credits you would like to request.
              </p>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || fetchingModules}
                className={`w-full py-3 px-4 rounded-md font-semibold text-white transition-colors ${
                  loading || fetchingModules
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Submitting Request...
                  </div>
                ) : (
                  "Submit Credit Request"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
