import { createContext, useContext, useState } from "react";

const ModalContext = createContext();
export const useModal = () => useContext(ModalContext);

export const ModalProvider = ({ children }) => {
  const [showLogin, setShowLogin] = useState(false);

  const showLoginModal = () => setShowLogin(true);
  const hideLoginModal = () => setShowLogin(false);

  return (
    <ModalContext.Provider value={{ showLogin, showLoginModal, hideLoginModal }}>
      {children}
    </ModalContext.Provider>
  );
};
