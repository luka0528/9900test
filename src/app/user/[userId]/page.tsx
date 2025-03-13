"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import debounce from "lodash.debounce";

export default function UserProfilePage() {
  const { data: session, status } = useSession();
  const { userId } = useParams();

  // State variables for managing user profile and form states
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [passwordValid, setPasswordValid] = useState(true);
  
  
  const [emailExists, setEmailExists] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const { data: doesEmailExist, isFetching } = api.user.checkEmailExists.useQuery(
    { email: newEmail },
    { enabled: !!newEmail } // Runs query only if `newEmail` is non-empty
  );

  useEffect(() => {
    setEmailExists(doesEmailExist?.exists || false);
  }, [doesEmailExist]);

  // Fetch user profile data
  const { data: userData } = api.user.getUserProfile.useQuery({
    userId: userId as string,
  });

  // State for user information
  const [userInfo, setUserInfo] = useState<{
    name: string;
    email: string;
    bio: string;
    image: string;
    password?: string;
    confirmPassword?: string;
  }>({
    name: "",
    email: "",
    bio: "",
    image: "",
    password: "",
    confirmPassword: "",
  });

  // Update userInfo state when userData changes
  useEffect(() => {
    if (userData) {
      setUserInfo({
        name: userData.name || "",
        email: userData.email || "",
        bio: userData.bio || "",
        image: userData.image || "",
        password: "",
        confirmPassword: "",
      });
    }
  }, [userData]);

  // Toggle edit mode
  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    setIsChangingPassword(false);
  };

  // Toggle change password mode
  const handleChangePasswordToggle = () => {
    setIsChangingPassword(!isChangingPassword);
  };

  // Validate password strength
  const validatePassword = (password: string) => {
    const minLength = 8;
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    return password.length >= minLength && specialCharRegex.test(password);
  };


  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setUserInfo((prevUserInfo) => {
      const updatedUserInfo = {
        ...prevUserInfo,
        [name]: value,
      };

      if (name === "password" || name === "confirmPassword") {
        setPasswordsMatch(
          updatedUserInfo.password === updatedUserInfo.confirmPassword,
        );
        setPasswordValid(validatePassword(updatedUserInfo.password || ""));
      }

      if (name === "email") {
        setNewEmail(value);
      }

      return updatedUserInfo;
    });
  };

  const handleSave = () => {
    if (
      !passwordsMatch ||
      !passwordValid ||
      !userInfo.name ||
      !userInfo.email ||
      emailExists
    ) {
      return;
    }

    const updatedUserInfo = { ...userInfo };
    if (!updatedUserInfo.password) {
      delete updatedUserInfo.password;
      delete updatedUserInfo.confirmPassword;
    }

    api.user.updateUserProfile.useMutation().mutate({ ...updatedUserInfo });

    setUserInfo({
      name: userInfo.name,
      email: userInfo.email,
      bio: userInfo.bio,
      image: userInfo.image,
      password: "",
      confirmPassword: "",
    });
    setIsEditing(false);
    setIsChangingPassword(false);
  };

  const isSaveDisabled =
    !passwordsMatch ||
    !passwordValid ||
    !userInfo.name ||
    !userInfo.email ||
    emailExists;

  if (status == "loading") {
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
              onChange={() => {
                return null;
              }}
              className="mt-1 w-full rounded border p-2"
            />
          ) : userInfo.image ? (
            <img
              src={userInfo.image}
              alt="Err: Picture Not Found"
              className="mt-1 h-32 w-32 rounded-full border"
            />
          ) : (
            <p className="mt-1 h-32 w-32 rounded-full border">No Image</p>
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
          {emailExists && (
            <p className="mt-1 text-red-500">Email already exists</p>
          )}
        </div>
        <div className="mb-4"></div>
        {isEditing && (
          <>
            <button
              onClick={handleChangePasswordToggle}
              className="mb-4 rounded bg-blue-500 px-4 py-2 text-white"
            >
              Change Password
            </button>
            {isChangingPassword && (
              <>
                <div className="mb-4">
                  <label className="block text-gray-700">New Password</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="Enter new password"
                    value={userInfo.password}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded border p-2"
                  />
                  {!passwordValid && (
                    <p className="mt-1 text-red-500">
                      Password must be at least 8 characters long and contain at
                      least one special character.
                    </p>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm new password"
                    value={userInfo.confirmPassword}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded border p-2"
                  />
                  {!passwordsMatch && (
                    <p className="mt-1 text-red-500">Passwords don't match</p>
                  )}
                </div>
              </>
            )}
          </>
        )}
        <div className="flex justify-end">
          {userId === session?.user.id && (
            <>
              {isEditing ? (
                <button
                  onClick={handleSave}
                  className={`mr-2 rounded px-4 py-2 text-white ${isSaveDisabled ? "bg-gray-400" : "bg-blue-500"}`}
                  disabled={isSaveDisabled}
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
