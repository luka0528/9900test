"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function UserProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: "Nothing Recieved",
    email: "nothing@received.com",
    bio: "Maneeee i aint receive shit",
    profilePicture: "",
  });

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = window.location.pathname.split("/").pop() || null;
    setUserId(id);
  }, []);

  // Check if the session belongs to the user
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  const { data: session } = useSession();

  useEffect(() => {
    if (session) {
      setSessionUserId(session.user.id);
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    // Fetch user info logic here
    const fetchUserInfo = async () => {
      try {
        console.log("Fetching user info...");
        const response = await fetch(); // TODO: Where do we get data for user and how is it stored?
        const data = await response.json();
        console.log("Fetched user info:", data);
        setUserInfo(data);
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };

    fetchUserInfo();
  }, [userId]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e: { target: { name: any; value: any } }) => {
    const { name, value } = e.target;
    setUserInfo({
      ...userInfo,
      [name]: value,
    });
  };

  const handleProfilePictureChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserInfo({
          ...userInfo,
          profilePicture: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(``, {
        // TODO: Where do we send the data to?
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userInfo),
      });

      if (!response.ok) {
        throw new Error("Failed to save user info");
      }

      const data = await response.json();
      setUserInfo(data);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving user info:", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h1 className="mb-4 text-2xl font-bold">User Profile Page</h1>
        <div className="mb-4">
          <label className="block text-gray-700">Profile Picture</label>
          {isEditing ? (
            <input
              type="file"
              accept="image/*"
              onChange={handleProfilePictureChange}
              className="mt-1 w-full rounded border p-2"
            />
          ) : (
            <img
              src={userInfo.profilePicture}
              alt="Err: Picture Not Found"
              className="mt-1 h-32 w-32 rounded-full border"
            />
          )}
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Name</label>
          {isEditing ? (
            <input
              type="text"
              name="name"
              value={userInfo.name}
              onChange={handleInputChange}
              className="mt-1 w-full rounded border p-2"
            />
          ) : (
            <p className="mt-1 w-full rounded border p-2">{userInfo.name}</p>
          )}
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Email</label>
          {isEditing ? (
            <input
              type="email"
              name="email"
              value={userInfo.email}
              onChange={handleInputChange}
              className="mt-1 w-full rounded border p-2"
            />
          ) : (
            <p className="mt-1 w-full rounded border p-2">{userInfo.email}</p>
          )}
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Bio</label>
          {isEditing ? (
            <textarea
              name="bio"
              value={userInfo.bio}
              onChange={handleInputChange}
              className="mt-1 w-full rounded border p-2"
            />
          ) : (
            <p className="mt-1 w-full rounded border p-2">{userInfo.bio}</p>
          )}
        </div>
        <div className="flex justify-end">
          {sessionUserId === userId && (
            <>
              {isEditing ? (
                <button
                  onClick={handleSave}
                  className="mr-2 rounded bg-blue-500 px-4 py-2 text-white"
                >
                  Save
                </button>
              ) : (
                <button
                  onClick={handleEditToggle}
                  className="mr-2 rounded bg-gray-500 px-4 py-2 text-white"
                >
                  Edit
                </button>
              )}
              {isEditing && (
                <button
                  onClick={handleEditToggle}
                  className="rounded bg-red-500 px-4 py-2 text-white"
                >
                  Cancel
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
