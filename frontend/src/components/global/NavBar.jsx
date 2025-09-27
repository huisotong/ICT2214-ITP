import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  FaChevronDown,
  FaUserCircle,
  FaSignOutAlt,
  FaRegCreditCard,
} from "react-icons/fa";

export default function NavBar() {
  // Get User through Auth Context
  const { auth, setAuth } = useAuth();
  const user = auth.user;
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Secure logout handler
  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5000/api/logout", {
        method: "POST",
        credentials: "include", // 🔐 clear JWT cookie
      });

      setAuth({ isAuthenticated: false, user: null }); // clear frontend state
      navigate("/"); // redirect to login
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav className="flex items-center justify-between bg-gray-200 px-6 py-2 shadow">
      {/* Left: Logo and Links */}
      <div className="flex items-center gap-4">
        <img src="/sit_logo.png" alt="SIT Logo" className="h-12 w-auto" />
        <Link
          to="/home"
          className="flex items-center gap-1 font-semibold text-lg text-black hover:text-sit-orange"
        >
          Home
        </Link>
        <Link
          to="/marketplace"
          className="flex items-center gap-1 font-semibold text-lg text-black hover:text-sit-orange ml-4"
        >
          Marketplace
        </Link>
        {user?.role === "Admin" && (
          <>
            <Link
              to="/manage-modules"
              className="flex items-center gap-1 font-semibold text-lg text-black hover:text-sit-orange ml-4"
            >
              Manage Modules
            </Link>
            <Link
              to="/manage-credit-requests"
              className="flex items-center gap-1 font-semibold text-lg text-black hover:text-sit-orange ml-4"
            >
              Manage Credit Requests
            </Link>
          </>
        )}
      </div>
      {/* Right: User Info + Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <div
          className="flex items-center gap-3 cursor-pointer px-3 py-1 rounded hover:bg-gray-300 transition"
          onClick={() => setOpen((v) => !v)}
        >
          <img
            src={user?.profilePicture || "/profilepic.png"}
            alt="Profile"
            className="h-10 w-10 rounded-full object-cover border-2 border-gray-400"
          />
          <div className="flex flex-col items-end">
            <span className="font-semibold text-black">
              {user?.name || "NAME XX XXX XXX"}
            </span>
          </div>
          <span
            className="ml-1 text-xl transition-transform duration-200"
            style={{
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <FaChevronDown />
          </span>
        </div>
        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-300 rounded shadow-lg z-50 animate-fade-in">
            <Link
              to="/profile"
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
              onClick={() => setOpen(false)}
            >
              <FaUserCircle className="text-lg" />
              Profile
            </Link>
            <Link
              to="/request-credits"
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
              onClick={() => setOpen(false)}
            >
              <FaRegCreditCard className="text-lg" />
              Request for Credits
            </Link>
            <div className="border-t my-1" />
            <button
              className="flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-gray-100 cursor-pointer"
              onClick={handleLogout}
            >
              <FaSignOutAlt className="text-lg" />
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
