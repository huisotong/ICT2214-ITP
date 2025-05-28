import { Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import NavBar from "./NavBar";

export default function ProtectedLayout() {
  const { auth } = useAuth();
  const user = auth.user;

  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <NavBar user={user} />
      <div style={{ flex: 1, display: "flex" }}>
        <Outlet />
      </div>
    </div>
  );
}
