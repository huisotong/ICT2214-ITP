import { useState, useEffect } from "react";

export default function ManageStudents({ module, setModal }) {
  const [students, setStudents] = useState([]);

  // fetch students here based off the module
  useEffect(() => {}, []);

  return <div>Leon part</div>;
}
