import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Modules from "../components/home/Modules";
import AddModuleOverlay from "../components/home/AddModuleOverlay";
import { fetchAssignedModules } from "../../utils/fetchAssignedModules";

function HomePage({ setModal }) {
  // Get User through Auth Context
  const { auth } = useAuth();
  const user = auth.user;

  const [modules, setModules] = useState([]);
  const [toggleAddModule, setToggleAddModule] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  async function fetchUserAssignedModules() {
    await fetchAssignedModules(user.userID)
      .then((data) => {
        setModules(data);
      })
      .catch((error) => {
        console.error("Error fetching assigned modules:", error);
      });
  }

  useEffect(() => {
    fetchUserAssignedModules();
    setRefreshTrigger(0);
  }, [refreshTrigger]);

  return (
    <>
      {toggleAddModule && (
        <AddModuleOverlay
          user={user}
          onClose={() => setToggleAddModule(false)}
          setModal={setModal}
          setRefreshTrigger={setRefreshTrigger}
        />
      )}
      <div
        className={`${toggleAddModule ? "blur-xs" : ""} transition-all w-full`}
      >
        <div className="flex justify-center items-center h-12">
          <h1>Welcome, {user.name}!</h1>
        </div>
        <div className="flex flex-col justify-center items-center w-full">
          <div className="flex justify-between items-center w-11/12 h-14">
            <p className="font-bold">My Modules</p>
            {user.role === "Admin" && (
              <button
                onClick={() => setToggleAddModule(true)}
                className="font-bold cursor-pointer border-2 p-2 rounded-lg bg-blue-300 hover:bg-blue-400 transition"
              >
                Add Module
              </button>
            )}
          </div>
          <Modules modules={modules} />
        </div>
      </div>
    </>
  );
}

export default HomePage;
