import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
}

export const ConfirmationModal = ({ isOpen, onClose, onConfirm, message }: Props) => {
  const [fade, setFade] = useState("animate-fadeIn");

  const closeModal = (callback: () => void) => {
    setFade("animate-fadeOut"); // Start fade-out animation
    setTimeout(() => {
      setFade("animate-fadeIn"); // Reset animation state
      callback(); // Execute the callback (onClose or onConfirm)
    }, 300); 
  };

  if (!isOpen) return null;

  return (
    <div className={`confirmation-modal ${fade}`}>
      <div className="relative p-4 w-full max-w-md max-h-full">
        <div className="relative bg-white rounded-lg shadow">
          <button
            type="button"
            onClick={() => closeModal(onClose)}
            className="absolute top-3 end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center"
            data-modal-hide="popup-modal"
          >
            <svg
              className="w-3 h-3"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 14 14"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
              />
            </svg>
            <span className="sr-only">Close modal</span>
          </button>
          <div className="p-4 md:p-5 text-center">
            <svg
              className="mx-auto mb-4 text-secondary w-12 h-12"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 20"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
            <h3 className="mb-5 text-lg  text-primary">{message}</h3>
            <button
              onClick={() => closeModal(onConfirm)}
              data-modal-hide="popup-modal"
              type="button"
              className="text-white bg-red-800 hover:bg-red-500 font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center"
            >
              Yes, I'm sure
            </button>
            <button
              onClick={() => closeModal(onClose)}
              data-modal-hide="popup-modal"
              type="button"
              className="py-2.5 px-5 ms-3 text-sm font-medium bg-primary text-white rounded-lg hover:bg-secondary"
            >
              No, cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
