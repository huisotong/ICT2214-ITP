import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({ isAuthenticated: false, user: null });
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("http://localhost:5000/api/me", {
          method: "GET",
          credentials: "include", // VERY IMPORTANT to include the JWT cookie
        });

        if (!res.ok) throw new Error("Not authenticated");

        const data = await res.json();

        setAuth({
          isAuthenticated: true,
          user: data,
        });
      } catch (err) {
        // Ensure user is marked as unauthenticated
        setAuth({
          isAuthenticated: false,
          user: null,
        });
      } finally {
        setIsAuthChecked(true);
      }
    }

    fetchUser();
  }, []);

  if (!isAuthChecked) return <div>Loading...</div>;

  return (
    <AuthContext.Provider value={{ auth, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export { AuthContext };
