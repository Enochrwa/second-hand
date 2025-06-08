import React from "react";
import { useAuth } from "../../hooks/useAuth";
import { Link } from "react-router-dom";
import LoadingSpinner from "../common/LoadingSpinner";
import { DEFAULT_PROFILE_IMAGE } from "../../utils/constants";

const ProfileView = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">
          Please login to view your profile.
        </p>
        <Link to="/login" className="btn btn-primary mt-4">
          Login
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="w-32 h-32 rounded-full overflow-hidden">
          <img
            src={
              currentUser.profilePhoto
                ? `/uploads/profiles/${currentUser.profilePhoto}`
                : DEFAULT_PROFILE_IMAGE
            }
            alt={`${currentUser.firstName} ${currentUser.lastName}`}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_PROFILE_IMAGE; }} // Added onError
          />
        </div>

        <div className="flex-grow">
          <h2 className="text-2xl font-bold mb-2">
            {currentUser.firstName} {currentUser.lastName}
          </h2>

          <div className="space-y-2 text-gray-700">
            <p>
              <span className="font-semibold">Email:</span> {currentUser.email}
            </p>
            {currentUser.phoneNumber && (
              <p>
                <span className="font-semibold">Phone:</span>{" "}
                {currentUser.phoneNumber}
              </p>
            )}
            <p>
              <span className="font-semibold">Role:</span> {currentUser.role}
            </p>
            <p>
              <span className="font-semibold">Member since:</span>{" "}
              {new Date(currentUser.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="mt-4 md:mt-0">
          <Link to="/profile/edit" className="btn btn-primary">
            Edit Profile
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
