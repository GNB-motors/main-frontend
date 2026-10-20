import React from 'react';

function DeleteExpenseDialog({ deleteTarget, setDeleteTarget, handleDelete }) {
  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50"
      role="presentation"
      onClick={() => setDeleteTarget(null)}
    >
      <div
        className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl"
        role="presentation"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold">Delete Expense</h3>
        <p className="mt-2 text-sm text-gray-600">
          Are you sure you want to delete <strong>{deleteTarget.title}</strong>?
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={() => setDeleteTarget(null)}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteExpenseDialog;
