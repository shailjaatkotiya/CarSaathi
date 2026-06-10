import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import RequireAuth from "./components/RequireAuth";
import AddVehicle from "./pages/AddVehicle";
import AuthPage from "./pages/AuthPage";
import BookingConfirmation from "./pages/BookingConfirmation";
import CreateRide from "./pages/CreateRide";
import DriverProfilePage from "./pages/DriverProfilePage";
import DriverOnboarding from "./pages/DriverOnboarding";
import ExplorePage from "./pages/ExplorePage";
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
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/driver/onboarding" element={<DriverOnboarding />} />
        <Route path="/driver/vehicle" element={<AddVehicle />} />
        <Route path="/driver/create-ride" element={<CreateRide />} />
        <Route path="/search" element={<SearchRides />} />
        <Route path="/rides/:rideId" element={<RideDetail />} />
        <Route path="/booking-confirmation" element={<BookingConfirmation />} />
        <Route path="/my-bookings" element={<Navigate to="/profile/passenger" />} />
        <Route path="/my-rides" element={<MyRides />} />
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
            <RequireAuth>
              <DriverProfilePage />
            </RequireAuth>
          }
        />
        <Route
          path="/profile/passenger"
          element={
            <RequireAuth>
              <PassengerProfilePage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}
