import React, { useState, useEffect } from "react";

export default function ManageCreditRequests({ setModal }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("Outstanding"); // New state for active tab

  useEffect(() => {
    async function fetchRequests() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("http://localhost:5000/api/credit-requests");
        if (!res.ok) throw new Error("Failed to fetch credit requests");
        const data = await res.json();
        setRequests(data);
      } catch (err) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, []);

  const handleAccept = async (requestID) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/credit-requests/${requestID}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Approved" }),
        }
      );      if (!res.ok) throw new Error("Failed to update status");
      const updated = await res.json();
      setRequests((prev) =>
        prev.map((req) =>
          req.requestID === requestID ? { ...req, status: updated.status } : req
        )
      );
      setModal?.({
        active: true,
        type: "success",
        message: "Credit request approved successfully!"
      });
    } catch (err) {
      setModal?.({
        active: true,
        type: "fail",
        message: err.message || "Error accepting request"
      });
    }
  };

  const handleReject = async (requestID) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/credit-requests/${requestID}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Rejected" }),
        }
      );      if (!res.ok) throw new Error("Failed to update status");
      const updated = await res.json();
      setRequests((prev) =>
        prev.map((req) =>
          req.requestID === requestID ? { ...req, status: updated.status } : req
        )
      );
      setModal?.({
        active: true,
        type: "success",
        message: "Credit request rejected successfully!"
      });
    } catch (err) {
      setModal?.({
        active: true,
        type: "fail",
        message: err.message || "Error rejecting request"
      });
    }
  };

  // New function to filter requests based on active tab
  const getFilteredRequests = () => {
    if (activeTab === "Outstanding") {
      return requests.filter((request) => request.status === "Pending");
    } else if (activeTab === "Past Requests") {
      return requests.filter(
        (request) => request.status === "Approved" || request.status === "Rejected"
      );
    }
    return requests; // Should not happen
  };  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header - Always at top with fixed height */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold text-gray-800 h-8">Manage Credit Requests</h1>
        </div>
      </div>
        {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg border border-gray-200">
        {/* Tabs */}
        <div className="px-6 pt-4">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex justify-start space-x-8">
              <button
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === "Outstanding"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab("Outstanding")}
              >
                <div className="flex items-center">
                  <span>Outstanding Requests</span>                  {requests.filter(req => req.status === "Pending").length > 0 && (
                    <span className="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs flex-shrink-0 min-w-[20px] text-center">
                      {requests.filter(req => req.status === "Pending").length}
                    </span>
                  )}
                </div>
              </button>
              <button
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === "Past Requests"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab("Past Requests")}
              >
                Past Requests
              </button>
            </nav>
          </div>
        </div>

        <div className="p-6">          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading requests...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
            </div>
          ) : getFilteredRequests().length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {activeTab === "Outstanding" 
                  ? "No outstanding requests found." 
                  : "No past requests found."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Module
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credits Requested
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Request Date
                    </th>
                    {activeTab === "Outstanding" && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">                  {getFilteredRequests().map((request) => (
                    <tr key={request.requestID} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {request.studentID || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.studentName || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.moduleID && request.moduleName 
                          ? `${request.moduleID} - ${request.moduleName}` 
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.creditsRequested} USD
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'Approved' ? 'bg-green-100 text-green-800' :
                          request.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.requestDate ? new Date(request.requestDate).toLocaleDateString() : "N/A"}
                      </td>
                      {activeTab === "Outstanding" && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {request.status === "Pending" && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleAccept(request.requestID)}
                                className="bg-green-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-green-700 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(request.requestID)}
                                className="bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-red-700 transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>          )}
        </div>
        </div>
      </div>
    </div>
  );
}
