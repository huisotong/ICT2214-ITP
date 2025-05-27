import { useEffect, useState } from "react";
import Modules from "../components/home/Modules";
import AddModuleOverlay from "../components/home/AddModuleOverlay";

function HomePage({ user, setModal }) {
  const [modules, setModules] = useState([]);
  const [toggleAddModule, setToggleAddModule] = useState(false);

  // fetch modules for a user
  async function fetchModules() {
    // for now
    setModules([
      { id: 1, moduleName: "ICT1001", moduleDesc: "Description for Module 1" },
      { id: 2, moduleName: "ICT1002", moduleDesc: "Description for Module 2" },
      { id: 3, moduleName: "ICT1003", moduleDesc: "Description for Module 3" },
      { id: 4, moduleName: "ICT1004", moduleDesc: "Description for Module 4" },
      { id: 5, moduleName: "ICT1005", moduleDesc: "Description for Module 5" },
      { id: 6, moduleName: "ICT1006", moduleDesc: "Description for Module 6" },
      { id: 7, moduleName: "ICT1007", moduleDesc: "Description for Module 7" },
      { id: 8, moduleName: "ICT1008", moduleDesc: "Description for Module 8" },
    ]);
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
      <div className={`${toggleAddModule ? "blur-xs" : ""} transition-all`}>
        <div className="flex justify-center items-center h-12">
          <h1>Welcome, {user.name}!</h1>
        </div>
        <div className="flex flex-col justify-center items-center">
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
