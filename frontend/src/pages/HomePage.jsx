import { useEffect, useState } from "react";
import Modules from "../components/home/Modules";
import AddModuleOverlay from "../components/home/AddModuleOverlay";

function HomePage({ user, setModal }) {
  const [modules, setModules] = useState([]);
  const [toggleAddModule, setToggleAddModule] = useState(false);

  // fetch modules for a user
  async function fetchModules() {
    try {
      const response = await fetch(
        `http://localhost:5000/api/get-assigned-modules?userId=${user.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch modules");
      }

      const data = await response.json();
      setModules(data);
    } catch (error) {
      console.error("Error fetching modules:", error);
    }
  }

  useEffect(() => {
    fetchModules();
  }, []);

  return (
    <>
      {toggleAddModule && (
        <AddModuleOverlay
          user={user}
          onClose={() => setToggleAddModule(false)}
          setModal={setModal}
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
            {user.role === "admin" && (
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
