import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import reportService from '../../services/reportService';
import { toast } from 'react-toastify';
import DOMPurify from 'dompurify'; // For sanitizing HTML if displaying user-generated content like reason

const ViewReport = () => {
  const { id: reportId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await reportService.getReport(reportId);
      setReport(response.data.data);
      setSelectedStatus(response.data.data.status);
    } catch (err) {
      setError('Failed to fetch report details. ' + (err.response?.data?.error || err.message));
      toast.error('Failed to fetch report details: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const response = await reportService.updateReportStatus(reportId, selectedStatus);
      setReport(response.data.data); // Update report data with new status
      toast.success('Report status updated successfully!');
    } catch (err) {
      toast.error('Failed to update report status: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return <div className="container mt-5"><p>Loading report details...</p></div>;
  }

  if (error) {
    return <div className="container mt-5"><p className="text-danger">{error}</p><Link to="/admin/reports" className="btn btn-secondary">Back to Reports</Link></div>;
  }

  if (!report) {
    return <div className="container mt-5"><p>No report data found.</p><Link to="/admin/reports" className="btn btn-secondary">Back to Reports</Link></div>;
  }

  // Sanitize reason if it can contain HTML
  const sanitizedReason = DOMPurify.sanitize(report.reason);

  return (
    <div className="container mt-4">
      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Report Details - ID: {report._id}</h4>
          <Link to="/admin/reports" className="btn btn-light btn-sm">
            &larr; Back to Reports List
          </Link>
        </div>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-6">
              <h5>Report Information</h5>
              <p><strong>Reason:</strong> <span dangerouslySetInnerHTML={{ __html: sanitizedReason }}></span></p>
              <p><strong>Status:</strong> <span className={`badge bg-${report.status === 'resolved' ? 'success' : report.status === 'dismissed' ? 'secondary' : 'warning'}`}>{report.status}</span></p>
              <p><strong>Reported At:</strong> {new Date(report.createdAt).toLocaleString()}</p>
              <p><strong>Last Updated:</strong> {new Date(report.updatedAt).toLocaleString()}</p>
            </div>
            <div className="col-md-6">
              <h5>Reporter Details</h5>
              {report.reporterId ? (
                <>
                  <p><strong>Name:</strong> {report.reporterId.firstName} {report.reporterId.lastName}</p>
                  <p><strong>Email:</strong> {report.reporterId.email || 'N/A'}</p>
                </>
              ) : (
                <p>Reporter details not available (account may have been deleted).</p>
              )}
            </div>
          </div>

          <hr />

          <h5>Reported Entity</h5>
          {report.itemId && (
            <div className="card mt-3">
              <div className="card-header">
                Reported Item: {report.itemId.title || 'N/A'}
              </div>
              <div className="card-body">
                <p><strong>Item Title:</strong> {report.itemId.title || 'N/A'}</p>
                <p><strong>Category:</strong> {report.itemId.category || 'N/A'}</p>
                {/* Add a link to the item page if available, e.g., /items/${report.itemId._id} */}
                {/* <Link to={`/items/${report.itemId._id}`} className="btn btn-sm btn-outline-info">View Item</Link> */}
              </div>
            </div>
          )}

          {report.userId && (
             <div className="card mt-3">
             <div className="card-header">
               Reported User: {report.userId.firstName} {report.userId.lastName}
             </div>
             <div className="card-body">
               <p><strong>User Name:</strong> {report.userId.firstName} {report.userId.lastName}</p>
               <p><strong>Email:</strong> {report.userId.email || 'N/A'}</p>
               {/* Add a link to the user profile page if available, e.g., /admin/users/${report.userId._id} */}
             </div>
           </div>
          )}

          {!report.itemId && !report.userId && (
            <p>No specific item or user was reported, or the entity has been removed.</p>
          )}
          
          <hr />

          <div className="mt-4">
            <h5>Update Status</h5>
            <form onSubmit={handleUpdateStatus}>
              <div className="row">
                <div className="col-md-4">
                  <select 
                    className="form-select" 
                    value={selectedStatus} 
                    onChange={handleStatusChange}
                    disabled={isUpdating}
                  >
                    <option value="pending">Pending</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <button type="submit" className="btn btn-success" disabled={isUpdating}>
                    {isUpdating ? 'Updating...' : 'Update Status'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewReport;
