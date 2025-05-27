import { useState, useEffect } from "react";

export default function ManageModules({ user, setModal }) {
  const [modules, setModules] = useState([]);

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

  // fetch modules for a user
  useEffect(() => {
    fetchModules();
  }, []);

  return <div>f</div>;
}
