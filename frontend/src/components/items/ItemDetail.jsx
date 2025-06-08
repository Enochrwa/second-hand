// ItemDetaimport { DEFAULT_PROFILE_IMAGE, DEFAULT_ITEM_IMAGE } from "../../utils/constants"; // Default imagesl.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useNotification } from "../../hooks/useNotification";
import itemService from "../../services/itemService";
import { formatPrice, formatDate } from "../../utils/formatters";
import { ITEM_STATUS } from "../../utils/constants";
import LoadingSpinner from "../common/LoadingSpinner";
import ErrorMessage from "../common/ErrorMessage";
import ContactSellerModal from "../modals/ContactSellerModal";
import ConfirmationModal from "../common/ConfirmationModal"; // Import ConfirmationModal
import {
  DEFAULT_PROFILE_IMAGE,
  DEFAULT_ITEM_IMAGE,
} from "../../utils/constants"; // Default image for items

const ItemDetail = () => {
  const { id } = useParams();
  const { currentUser, isAuthenticated } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showContactModal, setShowContactModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // State for delete modal

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await itemService.getItem(id);
        setItem(response.data.data);
      } catch (err) {
        // console.error("Error fetching item:", err); // Removed
        setError("Failed to load item details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      await itemService.updateItemStatus(id, newStatus);
      setItem({ ...item, status: newStatus });
      addNotification(`Item marked as ${newStatus}`, "success");
    } catch (err) {
      // console.error("Error updating item status:", err); // Removed
      addNotification("Failed to update item status: " + (err.response?.data?.error || err.message), "error");
    }
  };

  const openDeleteModal = () => {
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  const confirmDeleteItem = async () => {
    closeDeleteModal(); // Close modal first
    try {
      await itemService.deleteItem(id);
      addNotification("Item deleted successfully", "success");
      navigate("/profile"); // Navigate after successful deletion
    } catch (err) {
      // console.error("Error deleting item:", err); // Removed
      addNotification("Failed to delete item: " + (err.response?.data?.error || err.message), "error");
    }
  };

  const handleImageChange = (index) => {
    setCurrentImageIndex(index);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!item) {
    return <ErrorMessage message="Item not found" />;
  }

  const isOwner =
    currentUser && item.userId && currentUser._id === item.userId._id;
  const isAvailable = item.status === ITEM_STATUS.AVAILABLE;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="h-80 overflow-hidden rounded-lg">
            <img
              src={
                item.photos && item.photos.length > 0
                  ? `/uploads/items/${item.photos[currentImageIndex]}`
                  : DEFAULT_ITEM_IMAGE
              }
              alt={item.title}
              className="w-full h-full object-contain"
              onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_ITEM_IMAGE; }} // Added onError
            />
          </div>

          {item.photos && item.photos.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto">
              {item.photos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => handleImageChange(index)}
                  className={`w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border-2 ${
                    currentImageIndex === index
                      ? "border-primary"
                      : "border-transparent"
                  }`}
                >
                  <img
                    src={`/uploads/items/${photo}`}
                    alt={`${item.title} - Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_ITEM_IMAGE; }} // Added onError
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Item Details */}
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-start">
              <h1 className="text-3xl font-bold">{item.title}</h1>
              <span
                className={`badge ${
                  isAvailable ? "badge-success" : "badge-danger"
                }`}
              >
                {isAvailable ? "Available" : "Sold"}
              </span>
            </div>
            <p className="text-2xl font-bold text-primary mt-2">
              {formatPrice(item.price)}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-gray-700">
              <span className="font-semibold">Category:</span> {item.category}
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">Condition:</span> {item.condition}
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">Posted:</span>{" "}
              {formatDate(item.createdAt)}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-line">
              {item.description}
            </p>
          </div>

          {item.userId && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-2">Seller Information</h3>
              <div className="flex items-center space-x-4">
                <img
                  src={
                    item.userId.profilePhoto
                      ? `/uploads/profiles/${item.userId.profilePhoto}`
                      : DEFAULT_PROFILE_IMAGE
                  }
                  alt={`${item.userId.firstName} ${item.userId.lastName}`}
                  className="w-12 h-12 rounded-full object-cover"
                  onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_PROFILE_IMAGE; }} // Added onError
                />
                <div>
                  <p className="font-medium">
                    {item.userId.firstName} {item.userId.lastName}
                  </p>
                  {isOwner ? (
                    <p className="text-sm text-gray-500">
                      This is your listing
                    </p>
                  ) : (
                    <button
                      onClick={() => setShowContactModal(true)}
                      className="text-primary text-sm hover:underline"
                    >
                      Contact Seller
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 pt-4 border-t">
            {isOwner ? (
              <>
                <button
                  onClick={() => navigate(`/items/edit/${item._id}`)}
                  className="btn btn-primary"
                >
                  Edit Item
                </button>

                {isAvailable ? (
                  <button
                    onClick={() => handleStatusChange(ITEM_STATUS.SOLD)}
                    className="btn btn-secondary"
                  >
                    Mark as Sold
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusChange(ITEM_STATUS.AVAILABLE)}
                    className="btn btn-secondary"
                  >
                    Mark as Available
                  </button>
                )}

                <button onClick={openDeleteModal} className="btn btn-danger">
                  Delete Item
                </button>
              </>
            ) : (
              isAuthenticated &&
              isAvailable && (
                <button
                  onClick={() => setShowContactModal(true)}
                  className="btn btn-primary"
                >
                  Contact Seller
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <ContactSellerModal
          item={item}
          onClose={() => setShowContactModal(false)}
        />
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteItem}
        title="Confirm Deletion"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white"
      />
    </div>
  );
};

export default ItemDetail;
