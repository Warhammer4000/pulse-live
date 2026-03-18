import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SmartHome } from "@/components/SmartHome";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import SlideEditor from "./pages/SlideEditor";
import PresenterView from "./pages/PresenterView";
import JoinSession from "./pages/JoinSession";
import LiveSession from "./pages/LiveSession";
import SessionHistory from "./pages/SessionHistory";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<SmartHome />} />
            <Route path="/edit/:id" element={<ProtectedRoute><SlideEditor /></ProtectedRoute>} />
            <Route path="/present/:sessionId" element={<ProtectedRoute><PresenterView /></ProtectedRoute>} />
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
