import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";

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

  // Authentication state
  const [auth, setAuth] = useState({
    isAuthenticated: true,
    token: "dfsdfsdf",
    user: {
      role: "admin",
      name: "testadmin",
      profilePicture: "/profilepic.png",
      credits: 1000,
    },
  });

  // Prevent rendering until authentication check completes
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  // Simulated fetch to get user profile using token
  async function fetchUser(token) {
    console.log("Fetching user profile...");
    // TODO: Replace with real API request
    setIsAuthChecked(true);
  }

  // Auto-close modal after 3 seconds
  useEffect(() => {
    if (modal.active) {
      const timeout = setTimeout(() => {
        setModal({ active: false, type: "fail", message: "" });
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [modal]);

  // Perform authentication check once when app loads
  useEffect(() => {
    const token = "fsdf";

    if (token) {
      fetchUser(token);
    } else {
      setIsAuthChecked(true);
    }
  }, [isAuthChecked]);

  // Show loading screen while checking authentication
  if (!isAuthChecked) {
    return <div className={styles.main}>Loading...</div>;
  }

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
                <ProtectedLayout user={auth.user} />
              </PrivateRoute>
            }
          >
            {/* Add more routes that req auth here */}
            <Route
              path="/home"
              element={<HomePage user={auth.user} setModal={setModal} />}
            />
            <Route path="/chat/:id" element={<ChatPage />} />
            <Route
              path="/manage-modules"
              element={<ManageModules user={auth.user} setModal={setModal} />}
            />
            {/* Add the new route below */}
            <Route
              path="/manage-credit-requests"
              element={<ManageCreditRequests user={auth.user} setModal={setModal} />}
            />
          </Route>
        </Routes>
      </main>
    </>
  );
}

export default App;
