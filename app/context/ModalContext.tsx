import React, { createContext, useState, useContext } from 'react';

const ModalContext = createContext({
  showTrackingModal: false,
  setShowTrackingModal: (show: boolean) => {},
});

export const ModalProvider = ({ children }) => {
  const [showTrackingModal, setShowTrackingModal] = useState(false);

  return (
    <ModalContext.Provider value={{ showTrackingModal, setShowTrackingModal }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => useContext(ModalContext);