import React from 'react';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export const metadata = {
  title: 'Administrative Operations Console | WK Travel & Tours',
  description:
    'Secure inline content management console for packages, custom banners, review moderation, and booking requests.',
};

export default function AdminPage() {
  return <AdminDashboard />;
}

