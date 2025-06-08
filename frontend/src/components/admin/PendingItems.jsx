import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../hooks/useNotification';
import adminService from '../../services/adminService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import ConfirmationModal from '../common/ConfirmationModal'; // Import ConfirmationModal

const PendingItems = () => {
  const { isAdmin } = useAuth();
  const { addNotification } = useNotification();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [modalActionType, setModalActionType] = useState(''); // 'approve' or 'reject'
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalConfirmText, setModalConfirmText] = useState('Confirm');
  const [modalConfirmButtonClass, setModalConfirmButtonClass] = useState('bg-red-600 hover:bg-red-700 focus:ring-red-500'); // Default to danger

  useEffect(() => {
    const fetchPendingItems = async () => {
      try {
        const response = await adminService.getPendingItems();
        setItems(response.data.data);
      } catch (err) {
        console.error('Error fetching pending items:', err);
        setError('Failed to load pending items. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPendingItems();
  }, []);

  const openConfirmationModal = (itemId, actionType) => {
    setSelectedItemId(itemId);
    setModalActionType(actionType);
    if (actionType === 'approve') {
      setModalTitle('Confirm Approval');
      setModalMessage('Are you sure you want to approve this item?');
      setModalConfirmText('Approve');
      setModalConfirmButtonClass('bg-green-600 hover:bg-green-700 focus:ring-green-500');
    } else if (actionType === 'reject') {
      setModalTitle('Confirm Rejection');
      setModalMessage('Are you sure you want to reject this item? This action cannot be undone.');
      setModalConfirmText('Reject');
      setModalConfirmButtonClass('bg-red-600 hover:bg-red-700 focus:ring-red-500');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItemId(null);
    setModalActionType('');
    setModalTitle('');
    setModalMessage('');
    setModalConfirmText('Confirm');
    setModalConfirmButtonClass('bg-red-600 hover:bg-red-700 focus:ring-red-500');
  };

  const handleConfirmAction = async () => {
    if (!selectedItemId || !modalActionType) return;

    if (modalActionType === 'approve') {
      try {
        await adminService.approveItem(selectedItemId);
        setItems(items.filter(item => item._id !== selectedItemId));
        addNotification('Item approved successfully', 'success');
      } catch (err) {
        console.error('Error approving item:', err);
        addNotification('Failed to approve item: ' + (err.response?.data?.error || err.message), 'error');
      }
    } else if (modalActionType === 'reject') {
      try {
        await adminService.rejectItem(selectedItemId);
        setItems(items.filter(item => item._id !== selectedItemId));
        addNotification('Item rejected successfully', 'success');
      } catch (err) {
        console.error('Error rejecting item:', err);
        addNotification('Failed to reject item: ' + (err.response?.data?.error || err.message), 'error');
      }
    }
    closeModal();
  };
  
  // Original handleApprove and handleReject are effectively replaced by handleConfirmAction
  // for the direct action, but the core logic is now within handleConfirmAction.

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <ErrorMessage message="You do not have permission to access this page." />
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="large" />
      </div>
    );
  }
  
  if (error) {
    return <ErrorMessage message={error} />;
  }
  
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No pending items to review.</p>
        <a href="/admin" className="btn btn-primary mt-4">
          Back to Dashboard
        </a>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Pending Items</h2>
        <a href="/admin" className="btn btn-outline">
          Back to Dashboard
        </a>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Seller
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item._id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 mr-3">
                        <img 
                          src={item.photos && item.photos.length > 0 ? `/uploads/items/${item.photos[0]}` : '/assets/default-item.png'} 
                          alt={item.title}
                          className="h-10 w-10 rounded object-cover"
                        />
                      </div>
                      <div className="truncate max-w-xs">
                        <a 
                          href={`/items/${item._id}`}
                          className="text-primary hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {item.title}
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    ${item.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.userId ? `${item.userId.firstName} ${item.userId.lastName}` : 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openConfirmationModal(item._id, 'approve')}
                        className="text-green-600 hover:text-green-900"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => openConfirmationModal(item._id, 'reject')}
                        className="text-red-600 hover:text-red-900"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onConfirm={handleConfirmAction}
        title={modalTitle}
        message={modalMessage}
        confirmText={modalConfirmText}
        // For custom button colors, the ConfirmationModal would need to support a confirmButtonClass prop
        confirmButtonClass={modalConfirmButtonClass} // Pass the dynamic class
      />
    </div>
  );
};

export default PendingItems;
