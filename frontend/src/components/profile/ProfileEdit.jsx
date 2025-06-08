import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useForm } from "../../hooks/useForm";
import { useNotification } from "../../hooks/useNotification";
import { validateForm } from "../../utils/validators";
import ErrorMessage from "../common/ErrorMessage";
import LoadingSpinner from "../common/LoadingSpinner";
import { DEFAULT_PROFILE_IMAGE } from "../../utils/constants";
import authService from "../../services/authService";

const ProfileEdit = () => {
  const { currentUser, updateProfile, loading } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(null);

  const {
    values,
    errors,
    isSubmitting,
    setErrors,
    setIsSubmitting,
    handleChange,
    setValues,
  } = useForm({
    firstName: "",
    lastName: "",
    phoneNumber: "",
  });

  // Update form values when currentUser is available
  useEffect(() => {
    if (loading) {
      return; // Wait until loading is complete
    }

    if (!currentUser) {
      // console.log("No current user, redirecting to login"); // Removed
      addNotification("Please log in to edit your profile", "info");
      navigate("/login");
      return;
    }

    if (!currentUser._id) {
      // console.error("Current user has no ID:", currentUser); // Removed
      setError("Invalid user data. Please try logging in again.");
      return;
    }

    // console.log("Setting form values from user:", currentUser); // Removed
    setValues({
      firstName: currentUser.firstName || "",
      lastName: currentUser.lastName || "",
      phoneNumber: currentUser.phoneNumber || "",
    });
  }, [currentUser, loading, navigate, setValues, addNotification]);

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePhoto(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const formErrors = validateForm(values, [
      { name: "firstName", required: true, label: "First Name" },
      { name: "lastName", required: true, label: "Last Name" },
      { name: "phoneNumber", required: false, label: "Phone Number" },
    ]);

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      if (!currentUser || !currentUser._id) {
        // console.error("Submit - No current user:", currentUser); // Removed
        setError("User information not available. Please log in again.");
        setIsSubmitting(false);
        return;
      }

      // console.log("Submitting update for user:", currentUser._id); // Removed

      // Update profile
      const result = await updateProfile(currentUser._id, values);

      if (result.success) {
        // Upload profile photo if selected
        if (profilePhoto) {
          try {
            await authService.uploadProfilePhoto(currentUser._id, profilePhoto);
          } catch (photoErr) {
            // console.error("Error uploading profile photo:", photoErr); // Removed
            addNotification(
              "Profile updated but failed to upload photo: " + (photoErr.response?.data?.error || photoErr.message),
              "warning"
            );
            navigate("/profile");
            return;
          }
        }

        addNotification("Profile updated successfully!", "success");
        navigate("/profile");
      } else {
        setError(result.message);
      }
    } catch (err) {
      // console.error("Error updating profile:", err); // Removed
      setError(
        "An error occurred while updating your profile. Please try again: " + (err.response?.data?.error || err.message)
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // console.log("Render state:", { loading, currentUser }); // Removed

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!currentUser || !currentUser._id) {
    return (
      <ErrorMessage message="User information not available. Please log in again." />
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Edit Profile</h2>

      {error && <ErrorMessage message={error} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="w-32">
            <div className="w-32 h-32 rounded-full overflow-hidden mb-4">
              <img
                src={
                  profilePhoto
                    ? URL.createObjectURL(profilePhoto)
                    : currentUser.profilePhoto
                    ? `/uploads/profiles/${currentUser.profilePhoto}`
                    : DEFAULT_PROFILE_IMAGE
                }
                alt={`${currentUser.firstName} ${currentUser.lastName}`}
                className="w-full h-full object-cover"
              />
            </div>

            <label className="cursor-pointer px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 focus-within:ring-offset-white dark:focus-within:ring-offset-slate-800">
              Change Photo
              <input
                type="file"
                onChange={handlePhotoChange}
                accept="image/*"
                className="hidden"
              />
            </label>
          </div>

          <div className="flex-grow space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="form-label">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={values.firstName}
                  onChange={handleChange}
                  className={`form-input ${
                    errors.firstName ? "border-red-500" : ""
                  }`}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="form-label">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={values.lastName}
                  onChange={handleChange}
                  className={`form-input ${
                    errors.lastName ? "border-red-500" : ""
                  }`}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={currentUser.email}
                className="form-input bg-gray-100"
                disabled
              />
              <p className="text-gray-500 text-xs mt-1">
                Email cannot be changed
              </p>
            </div>

            <div>
              <label htmlFor="phoneNumber" className="form-label">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={values.phoneNumber}
                onChange={handleChange}
                className={`form-input ${
                  errors.phoneNumber ? "border-red-500" : ""
                }`}
              />
              {errors.phoneNumber && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.phoneNumber}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="btn btn-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <LoadingSpinner size="small" text="" />
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileEdit;
