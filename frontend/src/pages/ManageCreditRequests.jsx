import React, { useState, useEffect } from "react";
import "../styles/ManageCreditRequests.css";

export default function ManageCreditRequests() {
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
      );
      if (!res.ok) throw new Error("Failed to update status");
      const updated = await res.json();
      setRequests((prev) =>
        prev.map((req) =>
          req.requestID === requestID ? { ...req, status: updated.status } : req
        )
      );
    } catch (err) {
      alert(err.message || "Error accepting request");
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
      );
      if (!res.ok) throw new Error("Failed to update status");
      const updated = await res.json();
      setRequests((prev) =>
        prev.map((req) =>
          req.requestID === requestID ? { ...req, status: updated.status } : req
        )
      );
    } catch (err) {
      alert(err.message || "Error rejecting request");
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
  };

  return (
    <div className="manage-requests-container">
      <h2>Manage Credit Requests</h2>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === "Outstanding" ? "active" : ""}`}
          onClick={() => setActiveTab("Outstanding")}
        >
          Outstanding Requests
        </button>
        <button
          className={`tab-button ${activeTab === "Past Requests" ? "active" : ""}`}
          onClick={() => setActiveTab("Past Requests")}
        >
          Past Requests
        </button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div style={{ color: "red" }}>{error}</div>
      ) : (
        <table className="requests-table">
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Student ID</th>
              <th>Student Name</th>
              <th>Assignment ID</th>
              <th>Credits Requested</th>
              <th>Status</th>
              <th>Request Date</th>
              {activeTab === "Outstanding" && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {getFilteredRequests().map((request) => (
              <tr key={request.requestID}>
                <td>{request.requestID}</td>
                <td>{request.studentID || "N/A"}</td>
                <td>{request.studentName || "N/A"}</td>
                <td>{request.assignmentID}</td>
                <td>{request.creditsRequested}</td>
                <td>{request.status}</td>
                <td>{request.requestDate?.split("T")[0]}</td>
                {activeTab === "Outstanding" && (
                  <td>
                    {request.status === "Pending" && ( // Ensure buttons only for pending within outstanding
                      <>
                        <button
                          className="action-button accept"
                          onClick={() => handleAccept(request.requestID)}
                        >
                          Accept
                        </button>
                        <button
                          className="action-button reject"
                          onClick={() => handleReject(request.requestID)}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
