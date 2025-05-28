import { useEffect, useState } from "react";

function ProfilePage({ user, setModal }) {
  const [userDetails, setUserDetails] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  async function fetchUserDetails() {
    try {
      const response = await fetch(
        `http://localhost:5000/api/users/${user.userID}`
      );
      if (!response.ok) throw new Error("Failed to fetch user details");
      const data = await response.json();
      setUserDetails(data);
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  }

  async function saveUserDetails() {
    console.log("userDetails", userDetails);
    // setIsEditing(false);
    try {
      const response = await fetch(
        `http://localhost:5000/api/users/${user.userID}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userDetails),
        }
      );
      if (!response.ok) throw new Error("Failed to save user details");
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving user details:", error);
    }
  }

  useEffect(() => {
    fetchUserDetails();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserDetails((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6 p-6 w-4xl mx-auto">
      <div className="bg-white p-4 rounded-lg shadow flex justify-between items-start">
        <div className="text-left">
          <p className="font-semibold text-lg">{userDetails.name || "N/A"}</p>
          <p className="text-sm text-gray-600">{userDetails.email}</p>
        </div>

        <div className="flex gap-2">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={() => {
              if (isEditing) {
                saveUserDetails();
              } else {
                setIsEditing(true);
              }
            }}
          >
            {isEditing ? "Save Changes" : "Edit"}
          </button>
          <button className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
            Request credits
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block font-semibold mb-1">Full Name</label>
            <input
              name="name"
              disabled={!isEditing}
              className={`w-full border rounded p-2 ${
                !isEditing
                  ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                  : "bg-white text-black"
              }`}
              placeholder="John Doe"
              value={userDetails.name || ""}
              onChange={handleChange}
            />
          </div>
          <div className="flex-1">
            <label className="block font-semibold mb-1">Nickname</label>
            <input
              name="nickname"
              disabled={!isEditing}
              className={`w-full border rounded p-2 ${
                !isEditing
                  ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                  : "bg-white text-black"
              }`}
              placeholder="Johnny"
              value={userDetails.nickname || ""}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block font-semibold mb-1">Email</label>
            <input
              name="email"
              disabled={!isEditing}
              className={`w-full border rounded p-2 ${
                !isEditing
                  ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                  : "bg-white text-black"
              }`}
              placeholder="john@example.com"
              value={userDetails.email || ""}
              onChange={handleChange}
            />
          </div>
          <div className="flex-1">
            <label className="block font-semibold mb-1">Street Address</label>
            <input
              name="address"
              disabled={!isEditing}
              className={`w-full border rounded p-2 ${
                !isEditing
                  ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                  : "bg-white text-black"
              }`}
              placeholder="123 Main St"
              value={userDetails.address || ""}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-1">Phone Number</label>
          <input
            name="mobileNumber"
            disabled={!isEditing}
            className={`w-full border rounded p-2 ${
              !isEditing
                ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                : "bg-white text-black"
            }`}
            placeholder="+1 234 567 890"
            value={userDetails.mobileNumber || ""}
            onChange={handleChange}
          />
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
