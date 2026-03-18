import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import DashboardOverview from "./pages/DashboardOverview";
import PresentationsPage from "./pages/PresentationsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import SlideEditor from "./pages/SlideEditor";
import PresenterView from "./pages/PresenterView";
import SessionHistory from "./pages/SessionHistory";
import JoinSession from "./pages/JoinSession";
import LiveSession from "./pages/LiveSession";
import NotFound from "./pages/NotFound";
import { SmartHome } from "@/components/SmartHome";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<SmartHome />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Dashboard with sidebar layout */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<DashboardOverview />} />
              <Route path="presentations" element={<PresentationsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            <Route path="/edit/:id" element={<ProtectedRoute><SlideEditor /></ProtectedRoute>} />
            <Route path="/present/:sessionId" element={<ProtectedRoute><PresenterView /></ProtectedRoute>} />
            <Route path="/history/:presentationId" element={<ProtectedRoute><SessionHistory /></ProtectedRoute>} />
            <Route path="/join" element={<JoinSession />} />
            <Route path="/join/:code" element={<JoinSession />} />
            <Route path="/live/:code" element={<LiveSession />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
