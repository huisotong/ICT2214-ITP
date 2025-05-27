// Fetch assigned modules for a user
export async function fetchAssignedModules(userID) {
  try {
    const response = await fetch(
      `http://localhost:5000/api/get-assigned-modules?userId=${userID}`,
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
    return data;
  } catch (error) {
    console.error("Error fetching modules:", error);
  }
}
