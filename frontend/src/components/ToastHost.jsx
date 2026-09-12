import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Mounted lazily from main.jsx so react-toastify (~30 kB) stays out of the
// entry chunk. Toast CSS travels with this chunk; toasts fired before the
// chunk arrives are the only window, and no shell code toasts on mount.
export default function ToastHost() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
    />
  );
}
