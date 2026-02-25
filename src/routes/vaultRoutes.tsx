import { lazy } from "react";
import { Route, Navigate } from "react-router-dom";
import { ProtectedProviders } from "@/components/providers/ProtectedProviders";
import { RouteWrapper } from "@/components/routing/RouteWrapper";

const VaultLandingPage = lazy(() => import("@/pages/vault/VaultLandingPage"));
const VaultWaitlistPage = lazy(() => import("@/pages/vault/VaultWaitlistPage"));
const VaultRedeemPage = lazy(() => import("@/pages/vault/VaultRedeemPage"));
const VaultMatchRoom = lazy(() => import("@/pages/vault/VaultMatchRoom"));
const VaultProfilePage = lazy(() => import("@/pages/vault/VaultProfilePage"));

export const vaultRoutes = (
  <>
    <Route path="/vault" element={
      <RouteWrapper section="Vault Club"><VaultLandingPage /></RouteWrapper>
    } />
    <Route path="/vault/waitlist" element={
      <RouteWrapper section="Vault Waitlist"><VaultWaitlistPage /></RouteWrapper>
    } />
    <Route path="/vault/redeem" element={
      <ProtectedProviders>
        <RouteWrapper section="Vault Resgate" skeleton="detail"><VaultRedeemPage /></RouteWrapper>
      </ProtectedProviders>
    } />
    <Route path="/vault/perfil" element={
      <ProtectedProviders>
        <RouteWrapper section="Vault Perfil" skeleton="detail"><VaultProfilePage /></RouteWrapper>
      </ProtectedProviders>
    } />
    <Route path="/vault/app/match/:matchRoomId" element={
      <ProtectedProviders>
        <RouteWrapper section="Match Room" skeleton="detail"><VaultMatchRoom /></RouteWrapper>
      </ProtectedProviders>
    } />
    {/* Redirect old vault/app routes to unified /app */}
    <Route path="/vault/app" element={<Navigate to="/app/vault" replace />} />
    <Route path="/vault/app/*" element={<Navigate to="/app/vault" replace />} />
  </>
);
