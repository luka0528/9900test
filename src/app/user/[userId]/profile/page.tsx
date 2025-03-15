"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import debounce from "lodash.debounce";
import ClipLoader from "react-spinners/ClipLoader";

export default function UserProfilePage() {

  // State variables for managing user profile and form states
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [passwordValid, setPasswordValid] = useState(true);
  const [emailValid, setEmailValid] = useState(true);
  const [emailExists, setEmailExists] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [debouncedEmail, setDebouncedEmail] = useState(newEmail);


  // Get session data and status from next-auth
  const { data: session, status } = useSession();
  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/login";
    }
  }, [status]);

  const { userId } = useParams();

  // Fetch user profile data
  const { data: userData, isLoading: isLoadingUserProfile } = api.user.getUserProfile.useQuery(
    { userId: userId as string },
    { enabled: !!userId },
  );

  // Debounce function to delay email validation
  const debouncedSetEmail = useCallback(
    debounce((email) => setDebouncedEmail(email), 300),
    [debounce],
  );

  // Toggle edit mode
  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    setIsChangingPassword(false);
    setUserInfo({
      name: userData?.name || "",
      email: userData?.email || "",
      bio: userData?.bio || "",
      image: userData?.image || "",
      password: "",
      confirmPassword: "",
    });
    setPasswordsMatch(true);
    setPasswordValid(true);
    setEmailValid(true);
    setEmailExists(false);
    setNewEmail(userData?.email || "");
    setCurrentPassword("");
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

  // Validate email format
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };


  // Update debounced email whenever newEmail changes
  useEffect(() => {
    debouncedSetEmail(newEmail);
  }, [newEmail, debouncedSetEmail]);

  // Query to check if the email exists in the database
  const { data: doesEmailExist, isFetching } =
    api.user.checkEmailExists.useQuery(
      { email: debouncedEmail },
      { enabled: !!debouncedEmail && debouncedEmail !== userData?.email }, // Runs query only if `debouncedEmail` is non-empty and not equal to the current email
    );

  // Update emailExists state based on query result
  useEffect(() => {
    setEmailExists(doesEmailExist?.exists || false);
  }, [doesEmailExist]);

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

  // Handle input changes for form fields
  /**
   * Handles input changes for user information form fields.
   *
   * @param e - The change event triggered by input elements (either HTMLInputElement or HTMLTextAreaElement).
   *
   * This function updates the user information state based on the input field's name and value.
   * It also performs validation for passwords and email fields:
   * - For password and confirmPassword fields, it checks if the passwords match and validates the password format.
   * - For the email field, it sets the new email and validates the email format.
   * Additionally, it updates the current password state if the currentPassword field is changed.
   */
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setUserInfo((prevUserInfo) => {
      const updatedUserInfo = {
        ...prevUserInfo,
        [name]: value,
      };

      // Validate passwords and email
      if (name === "password" || name === "confirmPassword") {
        setPasswordsMatch(
          updatedUserInfo.password === updatedUserInfo.confirmPassword,
        );
        setPasswordValid(validatePassword(updatedUserInfo.password || ""));
      }

      if (name === "email") {
        setNewEmail(value);
        setEmailValid(validateEmail(value));
      }

      return updatedUserInfo;
    });

    if (name === "currentPassword") {
      setCurrentPassword(value);
    }
  };

  // Handle save action for updating user profile
  /**
   * Handles the save action for updating the user profile.
   *
   * This function performs several checks before proceeding with the update:
   * - Ensures passwords match and are valid.
   * - Ensures user information fields (name and email) are filled.
   * - Ensures the email is valid and does not already exist.
   *
   * If all checks pass, it proceeds to update the user profile.
   *
   * If the user is changing their password, it first validates the current password.
   * If the current password is valid, it then updates the profile.
   *
   * The profile update is performed using the `api.user.updateUserProfile.useMutation` mutation.
   * On successful update, it resets the user information state and exits editing mode.
   * On error, it alerts the user with the error message.
   *
   * @returns {void}
   */

  const updateUserProfileMutation = api.user.updateUserProfile.useMutation({
    onSuccess: () => {
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
    },
    onError: (error) => {
      alert(`Failed to update profile: ${error.message}`);
    },
  });

  const validatePasswordMutation = api.user.validateCurrentPassword.useMutation(
    {
      onSuccess: (isValid) => {
        if (!isValid) {
          alert("Current password is incorrect");
          return;
        }
        updateProfile();
      },
    },
  );

  const updateProfile = () => {
    const { confirmPassword, ...updatedUserInfo } = userInfo;
    if (!updatedUserInfo.password) {
      delete updatedUserInfo.password;
    }

    // Use the mutation function
    updateUserProfileMutation.mutate(updatedUserInfo);
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

    if (isChangingPassword) {
      // Validate current password before updating
      validatePasswordMutation.mutate({ currentPassword });
    } else {
      updateProfile();
    }
  };

  // Determine if the save button should be disabled
  const isSaveDisabled =
    !passwordsMatch ||
    !passwordValid ||
    !userInfo.name ||
    !userInfo.email ||
    emailExists ||
    !emailValid;

  // Show loading spinner while session is loading
  if (status == "loading" || isLoadingUserProfile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <ClipLoader size={50} color={"#123abc"} loading={true} />
        <span className="ml-4 text-xl">Loading user profile...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h1 className="mb-4 text-2xl font-bold">Profile</h1>
        <div className="mb-4">
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
          {!emailValid && (
            <p className="mt-1 text-red-500">Invalid email format</p>
          )}
          {isFetching && (
            <p className="mt-1 text-blue-500">Checking email...</p>
          )}
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Bio</label>
          {isEditing ? (
            <input
              type="text"
              name="bio"
              value={userInfo.bio}
              onChange={handleInputChange}
              className="mt-1 w-full rounded border p-2"
            />
          ) : (
            <p className="mt-1 w-full rounded border p-2">{userInfo.bio}</p>
          )}
        </div>
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
                  <label className="block text-gray-700">
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded border p-2"
                  />
                </div>
                <div className="mb-4"></div>
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
