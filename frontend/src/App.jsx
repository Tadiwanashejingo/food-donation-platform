import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/useAuth";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DonorDashboard from "./pages/DonorDashboard";
import ReceiverDashboard from "./pages/ReceiverDashboard";
import ManageRequests from "./pages/ManageRequests";
import ImpactStats from "./pages/ImpactStats";

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route
        path="/register"
        element={!user ? <Register /> : <Navigate to="/" />}
      />

      <Route
        path="/donor"
        element={
          user && user.role === "donor" ? (
            <DonorDashboard />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/receiver"
        element={
          user && user.role === "receiver" ? (
            <ReceiverDashboard />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/manage-requests"
        element={
          user && user.role === "donor" ? (
            <ManageRequests />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/impact"
        element={user ? <ImpactStats /> : <Navigate to="/login" />}
      />

      <Route
        path="/"
        element={
          user ? (
            user.role === "donor" ? (
              <Navigate to="/donor" />
            ) : user.role === "receiver" ? (
              <Navigate to="/receiver" />
            ) : (
              <Navigate to="/login" />
            )
          ) : (
            <Navigate to="/login" />
          )
        }
      />
    </Routes>
  );
}

export default App;