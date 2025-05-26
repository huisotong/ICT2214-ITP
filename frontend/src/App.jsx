import { useState, useEffect } from "react";
import styles from "./styles/global.module.css";
import Modal from "./components/global/Modal";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import PrivateRoute from "./components/global/PrivateRoute";
import { Routes, Route } from "react-router-dom";

function App() {
  // Set up global modal
  const [modal, setModal] = useState({
    active: false,
    type: "fail",
    message: "",
  });

  // Authenticate user based off token (all set to true for now since login is hard coded)
  const [auth, setAuth] = useState({
    isAuthenticated: true,
    token: "dfsdfsdf",
    user: null,
  });
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  // Fetch user profile with token
  async function fetchUser(token) {
    console.log("fetching user");
    setIsAuthChecked(true);

    // fetch request to get user data
  }

  // Turn off modal if it activates after 3 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      setModal({ active: false, type: "fail", message: "" });
    }, 3000);
    return () => clearTimeout(timeout);
  }, [modal]);

  // Fetch user on every new page rendered to see if authenticated (use in future if we wan do)
  useEffect(() => {
    const token = "fsdf";

    if (token) {
      fetchUser(token);
    } else {
      setIsAuthChecked(true);
    }
  }, [isAuthChecked]);

  if (!isAuthChecked) {
    // Prevent any route rendering until auth is checked
    return <div className={styles.main}>Loading...</div>;
  }

  return (
    <>
      {modal.active && <Modal modal={modal} />}
      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route
            path="/home"
            element={
              <PrivateRoute isAuthenticated={auth.isAuthenticated}>
                {/* <NavBar />    for if got navbar in future */}
                <HomePage />
              </PrivateRoute>
            }
          />
        </Routes>
      </main>
    </>
  );
}

export default App;
