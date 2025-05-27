import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { validateEmail } from "../../utils/helper";
import Input from "../components/global/Input"; // Reusable Input should also use Tailwind

function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Email and password cannot be empty");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    const validEmail = "student@sit.singaporetech.edu.sg";
    const validPassword = "123456";

    if (email === validEmail && password === validPassword) {
      const fakeToken = "abc123";
      const fakeUser = { email };

      sessionStorage.setItem("token", fakeToken);
      sessionStorage.setItem("user", JSON.stringify(fakeUser));

      setError("");
      navigate("/home");
    } else {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="w-full max-w-md p-6 bg-white rounded shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Login Page</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Email is student@sit.singaporetech.edu.sg"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Password is 123456"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Log In
          </button>
        </form>

        {error && (
          <div className="mt-4 text-red-600 text-sm text-center">{error}</div>
        )}
      </div>
    </div>
  );
}

export default LoginPage;
