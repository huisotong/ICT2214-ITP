import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { validateEmail } from "../../utils/helper";
import Input from "../components/global/Input";
import styles from "../styles/global.module.css";

function LoginPage() {
  const navigate = useNavigate();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Error handling state
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    // Input validation
    if (!email || !password) {
      setError("Email and password cannot be empty");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    // Hardcoded credentials
    const validEmail = "student@sit.singaporetech.edu.sg";
    const validPassword = "123456";

    if (email === validEmail && password === validPassword) {
      const fakeToken = "abc123";
      const fakeUser = { email };

      // Store user info in sessionStorage
      sessionStorage.setItem("token", fakeToken);
      sessionStorage.setItem("user", JSON.stringify(fakeUser));

      setError("");
      navigate("/home");
    } else {
      setError("Invalid email or password");
    }
  };

  return (
    <div className={styles.loginContainer}>
      <h1 className={styles.loginTitle}>Login Page</h1>
      <form onSubmit={handleLogin}>
        <Input
          label="Email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className={styles.loginButton}>
          Log In
        </button>
      </form>

      {error && <div className={styles.loginError}>{error}</div>}
    </div>
  );
}

export default LoginPage;
