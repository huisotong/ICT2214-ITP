import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  FaChevronDown,
  FaUserCircle,
  FaSignOutAlt,
  FaRegCreditCard,
  FaAws,
} from "react-icons/fa";

export default function NavBar() {
  // Get User through Auth Context
  const { auth, setAuth } = useAuth();
  const user = auth.user;
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [provisioningLoading, setProvisioningLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [sagemakerLoading, setSagemakerLoading] = useState(false);
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

  // Provision AWS Sandbox handler
  const handleProvisionSandbox = async () => {
    if (provisioningLoading) return; // Prevent double-clicks

    setProvisioningLoading(true);
    setOpen(false); // Close dropdown

    try {
      const response = await fetch("http://localhost:5000/api/provision-sandbox", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        if (data.status === "existing") {
          // Account already exists
          alert(`✅ AWS Sandbox Account Already Exists\n\nAccount ID: ${data.awsAccountId}\n\nYou can use this account for your sandbox activities.`);
          window.location.reload(); // Refresh to update button state
        } else if (data.status === "success") {
          // New account created
          alert(`🎉 AWS Sandbox Account Created Successfully!\n\nAccount ID: ${data.awsAccountId}\nAccount Name: ${data.accountName}\nEmail: ${data.email}\n\nYour sandbox environment is ready to use.`);
          window.location.reload(); // Refresh to update button state
        }
      } else {
        // Error from backend
        alert(`❌ Account Creation Failed\n\n${data.message || "An error occurred while creating your AWS sandbox account."}\n\nPlease contact support if this issue persists.`);
      }
    } catch (error) {
      console.error("Sandbox provisioning error:", error);
      alert("❌ Network Error\n\nFailed to connect to the server. Please check your connection and try again.");
    } finally {
      setProvisioningLoading(false);
    }
  };

  // Setup SageMaker Sandbox handler (triggers Lambda)
  const handleSetupSageMaker = async () => {
    if (setupLoading) return; // Prevent double-clicks

    setSetupLoading(true);
    setOpen(false); // Close dropdown

    try {
      const response = await fetch("http://localhost:5000/api/setup-sandbox", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        // Setup started successfully
        alert(`🚀 SageMaker Setup Started!\n\n${data.message}\n\nYou'll be able to access your SageMaker environment once setup completes.`);
      } else {
        // Error from backend
        alert(`❌ Setup Failed\n\n${data.error || "An error occurred while setting up your SageMaker environment."}\n\nPlease contact support if this issue persists.`);
      }
    } catch (error) {
      console.error("SageMaker setup error:", error);
      alert("❌ Network Error\n\nFailed to connect to the server. Please check your connection and try again.");
    } finally {
      setSetupLoading(false);
    }
  };

  // Access SageMaker Sandbox handler
  const handleAccessSageMaker = async () => {
    if (sagemakerLoading) return; // Prevent double-clicks

    setSagemakerLoading(true);
    setOpen(false); // Close dropdown

    try {
      const response = await fetch("http://localhost:5000/api/sagemaker-login-url", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        // DEBUG: Show debug info before redirecting
        if (data.debug) {
          const debugInfo = `🐛 DEBUG INFO:\n\n` +
            `AWS Account ID: ${data.debug.awsAccountId}\n` +
            `Student ID: ${data.debug.studentID}\n` +
            `User Profile Name: ${data.debug.userProfileName}\n` +
            `Region: ${data.debug.region}\n` +
            `Role ARN: ${data.debug.roleArn}\n` +
            `Domains Found: ${data.debug.domainsFound}\n` +
            `Domains: ${JSON.stringify(data.debug.domainsList, null, 2)}\n` +
            `Selected Domain ID: ${data.debug.selectedDomainId}\n` +
            `User Profiles Found: ${data.debug.userProfilesFound || 'N/A'}\n` +
            `User Profiles: ${JSON.stringify(data.debug.userProfilesList || [], null, 2)}\n\n` +
            `Click OK to redirect to SageMaker Studio...`;
          
          alert(debugInfo);
        }
        
        // Redirect to SageMaker Studio
        window.location.href = data.loginUrl;
      } else if (response.status === 404) {
        // SageMaker environment still being provisioned
        let errorMsg = `⏳ Sandbox Still Provisioning\n\n${data.error}\n\nYour SageMaker environment is being set up. This usually takes a few minutes after account creation.`;
        
        // Add debug info if available
        if (data.debug) {
          errorMsg += `\n\n🐛 DEBUG INFO:\n` +
            `AWS Account ID: ${data.debug.awsAccountId}\n` +
            `Student ID: ${data.debug.studentID}\n` +
            `User Profile Name: ${data.debug.userProfileName}\n` +
            `Region: ${data.debug.region}\n` +
            `Domains Found: ${data.debug.domainsFound}\n` +
            `Domains: ${JSON.stringify(data.debug.domainsList, null, 2)}`;
        }
        
        alert(errorMsg);
      } else {
        // Other errors
        let errorMsg = `❌ Access Failed\n\n${data.error || "Unable to access SageMaker Studio."}\n\nPlease contact support if this issue persists.`;
        
        // Add debug info if available
        if (data.debug) {
          errorMsg += `\n\n🐛 DEBUG INFO:\n` +
            `AWS Account ID: ${data.debug.awsAccountId}\n` +
            `Student ID: ${data.debug.studentID}\n` +
            `User Profile Name: ${data.debug.userProfileName}\n` +
            `Region: ${data.debug.region}\n` +
            `Domains Found: ${data.debug.domainsFound}\n` +
            `User Profiles Found: ${data.debug.userProfilesFound || 'N/A'}\n` +
            `User Profiles: ${JSON.stringify(data.debug.userProfilesList || [], null, 2)}`;
        }
        
        alert(errorMsg);
      }
    } catch (error) {
      console.error("SageMaker access error:", error);
      alert("❌ Network Error\n\nFailed to connect to the server. Please check your connection and try again.");
    } finally {
      setSagemakerLoading(false);
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
            {/* Show Provision Sandbox button only for students without AWS accounts */}
            {user?.role !== "Admin" && !user?.awsAccountId && (
              <button
                className={`flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-gray-100 cursor-pointer ${
                  provisioningLoading ? "opacity-50 cursor-wait" : ""
                }`}
                onClick={handleProvisionSandbox}
                disabled={provisioningLoading}
              >
                <FaAws className="text-lg" />
                {provisioningLoading ? "Provisioning..." : "Provision AWS Sandbox"}
              </button>
            )}
            {/* Show Setup SageMaker button only for students with AWS accounts but no SageMaker domain */}
            {user?.role !== "Admin" && user?.awsAccountId && !user?.sagemakerDomainId && (
              <button
                className={`flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-gray-100 cursor-pointer ${
                  setupLoading ? "opacity-50 cursor-wait" : ""
                }`}
                onClick={handleSetupSageMaker}
                disabled={setupLoading}
              >
                <FaAws className="text-lg" />
                {setupLoading ? "Setting up..." : "Setup SageMaker Sandbox"}
              </button>
            )}
            {/* Show Access SageMaker button only for students with SageMaker domain set up */}
            {user?.role !== "Admin" && user?.sagemakerDomainId && (
              <button
                className={`flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-gray-100 cursor-pointer ${
                  sagemakerLoading ? "opacity-50 cursor-wait" : ""
                }`}
                onClick={handleAccessSageMaker}
                disabled={sagemakerLoading}
              >
                <FaAws className="text-lg" />
                {sagemakerLoading ? "Loading..." : "Access SageMaker Sandbox"}
              </button>
            )}
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
