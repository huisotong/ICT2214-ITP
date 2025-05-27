import { useEffect, useState } from "react";
import styles from "../styles/global.module.css";
 

function HomePage() {
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
      const userObj = JSON.parse(storedUser);
      setUserEmail(userObj.email || "Unknown");
    }
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Welcome, {userEmail}!</h1>
    </div>
  );
}

export default HomePage;
