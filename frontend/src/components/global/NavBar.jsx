import { useState, useRef, useEffect } from "react";
import {
  FaChevronDown,
  FaUserCircle,
  FaSignOutAlt,
  FaRegCreditCard,
} from "react-icons/fa";

export default function NavBar({ user }) {
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

  return (
    <nav className="flex items-center justify-between bg-gray-200 px-6 py-2 shadow">
      {/* Left: Logo and Links */}
      <div className="flex items-center gap-4">
        <img src="/sit_logo.png" alt="SIT Logo" className="h-12 w-auto" />
        <a
          href="/home"
          className="flex items-center gap-1 font-semibold text-lg text-black hover:text-sit-orange"
        >
          Home
        </a>
        {user?.role === "admin" && (
          <>
            <a
              href="/manage-modules"
              className="flex items-center gap-1 font-semibold text-lg text-black hover:text-sit-orange ml-4"
            >
              Manage Modules
            </a>
            <a
              href="/manage-credit-requests"
              className="flex items-center gap-1 font-semibold text-lg text-black hover:text-sit-orange ml-4"
            >
              Manage Credit Requests
            </a>
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
            <span className="text-xs text-gray-600">
              Credits: {user?.credits ?? "--"}
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
            <a
              href="/profile"
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
            >
              <FaUserCircle className="text-lg" />
              Profile
            </a>
            <a
              href="/request-credits"
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
            >
              <FaRegCreditCard className="text-lg" />
              Request for Credits
            </a>
            <div className="border-t my-1" />
            <button
              className="flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                // Add your logout logic here
              }}
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
