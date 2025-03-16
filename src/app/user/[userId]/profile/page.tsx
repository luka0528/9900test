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
    debounce((email: string) => setDebouncedEmail(email), 300),
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
    <div className="flex flex-1 flex-col min-h-screen h-full space-y-8 p-0 bg-gray-100">
      <div className="w-full bg-white shadow-lg rounded-lg p-6 flex flex-col h-full">
        {/* Profile Header */}
        <h1 className="text-2xl font-semibold mb-2">Profile</h1>
        <p className="text-gray-500">This is how others will see you on the site.</p>
        
        <div className="border-b my-4"></div>
  
        {/* Profile Image */}
        <div className="flex items-center gap-6">
          {userInfo.image ? (
            <img
              src={userInfo.image}
              alt="Profile"
              className="h-20 w-20 rounded-full border"
            />
          ) : (
            <div className="h-20 w-20 rounded-full border flex items-center justify-center bg-gray-200 text-gray-500">
              No Image
            </div>
          )}
          {isEditing && (
            <input
              type="file"
              accept="image/*"
              onChange={() => null}
              className="text-sm"
            />
          )}
        </div>
  
        {/* Profile Form */}
        <div className="space-y-6 mt-4 flex-1">
          {/* Name */}
          <div>
            <label className="text-sm font-medium text-gray-700">Name</label>
            {isEditing ? (
              <input
                type="text"
                name="name"
                value={userInfo.name}
                onChange={handleInputChange}
                className="block w-full max-w-2xl rounded-lg border border-gray-400 p-2"
              />
            ) : (
              <p className="block w-full max-w-2xl rounded border p-2 bg-gray-50">{userInfo.name}</p>
            )}
          </div>
  
          {/* Email */}
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            {isEditing ? (
              <input
                type="email"
                name="email"
                value={userInfo.email}
                onChange={handleInputChange}
                className="block w-full max-w-2xl rounded-lg border border-gray-400 p-2"
              />
            ) : (
              <p className="block w-full max-w-2xl rounded border p-2 bg-gray-50">{userInfo.email}</p>
            )}
            {emailExists && <p className="text-red-500 text-sm">Email already exists</p>}
            {!emailValid && <p className="text-red-500 text-sm">Invalid email format</p>}
          </div>
  
          {/* Bio */}
          <div>
            <label className="text-sm font-medium text-gray-700">Bio</label>
            {isEditing ? (
              <textarea
                name="bio"
                value={userInfo.bio}
                onChange={handleInputChange}
                className="block w-full max-w-2xl rounded-lg border border-gray-400 p-2 min-h-[8rem]"
              />
            ) : (
              <p className="block w-full max-w-2xl rounded border p-2 bg-gray-50 min-h-[8rem]">{userInfo.bio}</p>
            )}
          </div>
  
          {isEditing && (
            <>
                <div className="border-b my-4 w-1/2"></div>
                {/* Change Password */}
                <button
                onClick={handleChangePasswordToggle}
                className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 transition-all"
                >
                Change Password
                </button>
  
              {isChangingPassword && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Current Password</label>
                    <input
                      type="password"
                      name="currentPassword"
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={handleInputChange}
                      className="block w-full max-w-2xl rounded-lg border border-gray-400 p-2"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">New Password</label>
                    <input
                      type="password"
                      name="password"
                      placeholder="Enter new password"
                      value={userInfo.password}
                      onChange={handleInputChange}
                      className="block w-full max-w-2xl rounded-lg border border-gray-400 p-2"
                    />
                    {!passwordValid && (
                      <p className="text-red-500 text-sm">
                        Password must be at least 8 characters and contain a special character.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="Confirm new password"
                      value={userInfo.confirmPassword}
                      onChange={handleInputChange}
                      className="block w-full max-w-2xl rounded-lg border border-gray-400 p-2"
                    />
                    {!passwordsMatch && <p className="text-red-500 text-sm">Passwords don’t match</p>}
                  </div>
                </>
              )}
            </>
          )}
  
          {/* Buttons */}
          <div className="border-t pt-4 flex gap-4 w-1/2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className={`rounded-md px-4 py-2 text-sm w-32 transition-all ${
                    isSaveDisabled
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-black text-white hover:bg-gray-900"
                  }`}
                  disabled={isSaveDisabled}
                >
                  Update Profile
                </button>

                <button
                  onClick={handleEditToggle}
                  className="rounded-md bg-gray-100 px-4 py-2 text-sm w-32 text-gray-700 hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={handleEditToggle}
                className="rounded-md bg-gray-900 px-4 py-2 text-white text-sm w-32 transition-all hover:bg-black"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}