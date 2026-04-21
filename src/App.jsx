import { useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { ConfirmDialog } from './components/ConfirmDialog';
import { InvoiceFormDrawer } from './components/InvoiceFormDrawer';
import { useInvoices } from './context/InvoiceContext';
import { InvoiceDetailPage } from './pages/InvoiceDetailPage';
import { InvoiceListPage } from './pages/InvoiceListPage';

export default function App() {
  const navigate = useNavigate();
  const { deleteInvoice, getInvoiceById } = useInvoices();
  const [formState, setFormState] = useState({
    isOpen: false,
    mode: 'create',
    invoiceId: '',
  });
  const [deleteState, setDeleteState] = useState({
    isOpen: false,
    invoiceId: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const selectedInvoice = getInvoiceById(deleteState.invoiceId);

  const closeForm = () => {
    setFormState({
      isOpen: false,
      mode: 'create',
      invoiceId: '',
    });
  };

  const openCreateForm = () => {
    setFormState({
      isOpen: true,
      mode: 'create',
      invoiceId: '',
    });
  };

  const openEditForm = (invoiceId) => {
    setFormState({
      isOpen: true,
      mode: 'edit',
      invoiceId,
    });
  };

  const closeDeleteDialog = () => {
    setDeleteState({
      isOpen: false,
      invoiceId: '',
    });
    setIsDeleting(false);
  };

  const openDeleteDialog = (invoiceId) => {
    setDeleteState({
      isOpen: true,
      invoiceId,
    });
  };

  const confirmDeleteInvoice = async () => {
    if (!deleteState.invoiceId) {
      closeDeleteDialog();
      return;
    }

    setIsDeleting(true);

    try {
      await deleteInvoice(deleteState.invoiceId);
      closeDeleteDialog();
      navigate('/');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AppShell>
      <Routes>
        <Route
          path="/"
          element={<InvoiceListPage onCreateInvoice={openCreateForm} />}
        />
        <Route
          path="/invoice/:invoiceId"
          element={
            <InvoiceDetailPage
              onDeleteInvoice={openDeleteDialog}
              onEditInvoice={openEditForm}
            />
          }
        />
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>

      <InvoiceFormDrawer formState={formState} onClose={closeForm} />

      <ConfirmDialog
        isOpen={deleteState.isOpen}
        invoiceId={selectedInvoice?.id ?? deleteState.invoiceId}
        onCancel={closeDeleteDialog}
        onConfirm={confirmDeleteInvoice}
        isBusy={isDeleting}
      />
    </AppShell>
  );
}
