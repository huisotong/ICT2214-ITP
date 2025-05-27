import React, { useState, useEffect } from "react";
import "../styles/ManageCreditRequests.css";

export default function ManageCreditRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const handleAccept = (requestID) => {
    // TODO: Implement accept logic (API call)
    setRequests(
      requests.map((req) =>
        req.requestID === requestID ? { ...req, status: "Accepted" } : req
      )
    );
  };

  const handleReject = (requestID) => {
    // TODO: Implement reject logic (API call)
    setRequests(
      requests.map((req) =>
        req.requestID === requestID ? { ...req, status: "Rejected" } : req
      )
    );
  };

  return (
    <div className="manage-requests-container">
      <h2>Manage Credit Requests</h2>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div style={{ color: "red" }}>{error}</div>
      ) : (
        <table className="requests-table">
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Assignment ID</th>
              <th>Credits Requested</th>
              <th>Status</th>
              <th>Request Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.requestID}>
                <td>{request.requestID}</td>
                <td>{request.assignmentID}</td>
                <td>{request.creditsRequested}</td>
                <td>{request.status}</td>
                <td>{request.requestDate?.split("T")[0]}</td>
                <td>
                  {request.status === "Pending" && (
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
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
