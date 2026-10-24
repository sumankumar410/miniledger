import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { AddLoanModal } from '../forms/AddLoanModal';
import { RecordPaymentModal } from '../forms/RecordPaymentModal';
import { AddFriendModal } from '../forms/AddFriendModal';

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addLoanOpen, setAddLoanOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [preSelectedLoanForPayment, setPreSelectedLoanForPayment] = useState(null);

  const openPaymentModal = (loan = null) => {
    setPreSelectedLoanForPayment(loan);
    setPaymentModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Navbar
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenAddLoan={() => setAddLoanOpen(true)}
          onOpenRecordPayment={() => openPaymentModal(null)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet
            context={{
              openAddLoanModal: () => setAddLoanOpen(true),
              openPaymentModal,
              openAddFriendModal: () => setAddFriendOpen(true),
            }}
          />
        </main>
      </div>

      {/* Global Add Loan Modal */}
      <AddLoanModal
        isOpen={addLoanOpen}
        onClose={() => setAddLoanOpen(false)}
        onSuccess={() => setAddLoanOpen(false)}
      />

      {/* Global Record Payment Modal */}
      <RecordPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setPreSelectedLoanForPayment(null);
        }}
        preSelectedLoan={preSelectedLoanForPayment}
        onSuccess={() => {
          setPaymentModalOpen(false);
          setPreSelectedLoanForPayment(null);
        }}
      />

      {/* Global Add Friend Modal */}
      <AddFriendModal
        isOpen={addFriendOpen}
        onClose={() => setAddFriendOpen(false)}
        onSuccess={() => setAddFriendOpen(false)}
      />
    </div>
  );
};
