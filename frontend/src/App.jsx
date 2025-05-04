import React from "react";
import { Routes, Route } from "react-router-dom";
import MainPage from "./components/MainPage"; // Import MainPage
import LoginPage from "./components/LoginPage"; // Import LoginPage
import RegisterPage from "./components/RegisterPage"; // Import LoginPage
import AppointmentBooking from "./components/AppointmentBooking";
import DoctorSchedule from "./components/DoctorSchedule";
import AppointmentConfirmation from "./components/AppointmentConfirmation";
import UserProfile from "./components/UserProfile";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/appointment" element={<AppointmentBooking />} />
      <Route path="/appointment/doctor/:doctorId" element={<DoctorSchedule />} />
      <Route path="/appointment/confirmation" element={<AppointmentConfirmation />} />
      <Route path="/profile" element={<UserProfile />} />
    </Routes>
  );
};

export default App;
