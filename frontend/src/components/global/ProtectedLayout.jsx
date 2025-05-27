import { Outlet } from "react-router-dom";
import NavBar from "./NavBar";

export default function ProtectedLayout({ user }) {
  return (
    <>
      <NavBar user={user} />
      <Outlet />
    </>
  );
}