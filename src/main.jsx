import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthProvider";
import { CourseProvider } from "./context/CourseContext";
import { CartProvider } from "./context/CartContext";
import { EnrollmentProvider } from "./context/EnrollmentContext";
import { NotificationProvider } from "./context/NotificationContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <NotificationProvider>
        <CourseProvider>
          <CartProvider>
            <EnrollmentProvider>
              <App />
            </EnrollmentProvider>
          </CartProvider>
        </CourseProvider>
      </NotificationProvider>
    </AuthProvider>
  </React.StrictMode>
);