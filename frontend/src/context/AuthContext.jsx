import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({ isAuthenticated: false, user: null });
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/api/me", {
      method: "GET",
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setAuth({ isAuthenticated: true, user: data });
        }
        setIsAuthChecked(true);
      })
      .catch(() => setIsAuthChecked(true));
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
