import React from 'react';
import { useAuth } from '../hooks/useAuth';
import AdminDashboard from '../components/admin/AdminDashboard';
import PendingItems from '../components/admin/PendingItems';
import ReportsList from '../components/admin/ReportsList';
import ViewReport from '../components/admin/ViewReport'; // Import ViewReport
import ReportDownloads from '../components/admin/ReportDownloads';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

const AdminPage = () => {
  const { currentUser, isAdmin, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <LoadingSpinner size="large" />
      </div>
    );
  }
  
  if (!currentUser || !isAdmin) {
    return (
      <div className="text-center py-12">
        <ErrorMessage message="You do not have permission to access this page." />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Panel</h1>
      
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/items/pending" element={<PendingItems />} />
        <Route path="/reports" element={<ReportsList />} />
        <Route path="/reports/:id" element={<ViewReport />} /> {/* Added route for ViewReport */}
        <Route path="/reports/downloads" element={<ReportDownloads />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </div>
  );
};

export default AdminPage;
