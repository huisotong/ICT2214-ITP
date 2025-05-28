import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Import styles and components
import styles from "./styles/global.module.css";
import "./styles/App.css";
import Modal from "./components/global/Modal";
import PrivateRoute from "./components/global/PrivateRoute";

// Import pages
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import ManageModules from "./pages/ManageModules";
import ManageCreditRequests from "./pages/ManageCreditRequests"; // Import the new page
import ChatPage from "./pages/ChatPage";
import ProtectedLayout from "./components/global/ProtectedLayout";

function App() {
  // Modal state for global feedback
  const [modal, setModal] = useState({
    active: false,
    type: "fail",
    message: "",
  });

  // Authentication state from context
  const { auth } = useAuth();

  // Auto-close modal after 3 seconds
  useEffect(() => {
    if (modal.active) {
      const timeout = setTimeout(() => {
        setModal({ active: false, type: "fail", message: "" });
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [modal]);

  return (
    <>
      {/* Show global modal if active */}
      {modal.active && <Modal modal={modal} />}

      {/* Main App Content */}
      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route
            element={
              <PrivateRoute isAuthenticated={auth.isAuthenticated}>
                <ProtectedLayout />
              </PrivateRoute>
            }
          >
            {/* Add more routes that req auth here */}
            <Route
              path="/home"
              element={<HomePage setModal={setModal} />}
            />
            <Route path="/chat/:id" element={<ChatPage />} />
            <Route
              path="/manage-modules"
              element={<ManageModules setModal={setModal} />}
            />
            {/* Add the new route below */}
            <Route
              path="/manage-credit-requests"
              element={<ManageCreditRequests setModal={setModal} />}
            />
          </Route>
        </Routes>
      </main>
    </>
  );
}

export default App;
