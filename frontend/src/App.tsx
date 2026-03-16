import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import WorkflowListPage from './pages/WorkflowListPage';
import WorkflowEditorPage from './pages/WorkflowEditorPage';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
      <Routes>
        <Route path="/" element={<WorkflowListPage />} />
        <Route path="/workflows/:id" element={<WorkflowEditorPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
