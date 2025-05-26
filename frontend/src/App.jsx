import { useState } from "react";
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
