import { Outlet } from "react-router-dom";
import NavBar from "./NavBar";

export default function ProtectedLayout({ user }) {
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
