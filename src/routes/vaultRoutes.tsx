import { lazy } from "react";
import { Route, Navigate } from "react-router-dom";
import { ProtectedProviders } from "@/components/providers/ProtectedProviders";

const VaultLandingPage = lazy(() => import("@/pages/vault/VaultLandingPage"));
const VaultWaitlistPage = lazy(() => import("@/pages/vault/VaultWaitlistPage"));
const VaultRedeemPage = lazy(() => import("@/pages/vault/VaultRedeemPage"));
const VaultMatchRoom = lazy(() => import("@/pages/vault/VaultMatchRoom"));
const VaultProfilePage = lazy(() => import("@/pages/vault/VaultProfilePage"));

export const vaultRoutes = (
  <>
    <Route path="/vault" element={<VaultLandingPage />} />
    <Route path="/vault/waitlist" element={<VaultWaitlistPage />} />
    <Route path="/vault/redeem" element={
      <ProtectedProviders><VaultRedeemPage /></ProtectedProviders>
    } />
    <Route path="/vault/perfil" element={
      <ProtectedProviders><VaultProfilePage /></ProtectedProviders>
    } />
    <Route path="/vault/app/match/:matchRoomId" element={
      <ProtectedProviders><VaultMatchRoom /></ProtectedProviders>
    } />
    {/* Redirect old vault/app routes to unified dashboard */}
    <Route path="/vault/app" element={<Navigate to="/minha-conta" replace />} />
    <Route path="/vault/app/*" element={<Navigate to="/minha-conta" replace />} />
  </>
);
