import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import RequireAuth from "./components/RequireAuth";
import RequireRole from "./components/RequireRole";
import AddVehicle from "./pages/AddVehicle";
import AdminDashboard from "./pages/AdminDashboard";
import AuthPage from "./pages/AuthPage";
import BookingConfirmation from "./pages/BookingConfirmation";
import CreateRide from "./pages/CreateRide";
import DriverOnboarding from "./pages/DriverOnboarding";
import LandingPage from "./pages/LandingPage";
import MyRides from "./pages/MyRides";
import PassengerProfilePage from "./pages/PassengerProfilePage";
import ProfilePage from "./pages/ProfilePage";
import RideDetail from "./pages/RideDetail";
import SearchRides from "./pages/SearchRides";
import VerificationPage from "./pages/VerificationPage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/verify"
          element={
            <RequireAuth>
              <VerificationPage />
            </RequireAuth>
          }
        />
        <Route path="/driver/onboarding" element={<DriverOnboarding />} />
        <Route
          path="/driver/vehicle"
          element={
            <RequireRole role="driver">
              <AddVehicle />
            </RequireRole>
          }
        />
        <Route
          path="/driver/create-ride"
          element={
            <RequireRole role="driver">
              <CreateRide />
            </RequireRole>
          }
        />
        <Route path="/search" element={<SearchRides />} />
        <Route path="/rides/:rideId" element={<RideDetail />} />
        <Route path="/booking-confirmation" element={<BookingConfirmation />} />
        <Route path="/my-bookings" element={<Navigate to="/profile/passenger" />} />
        <Route
          path="/my-rides"
          element={
            <RequireRole role="driver">
              <MyRides />
            </RequireRole>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
        <Route
          path="/profile/driver"
          element={
            <RequireRole role="driver">
              <Navigate to="/my-rides" replace />
            </RequireRole>
          }
        />
        <Route
          path="/profile/passenger"
          element={
            <RequireRole role="passenger">
              <PassengerProfilePage />
            </RequireRole>
          }
        />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}
