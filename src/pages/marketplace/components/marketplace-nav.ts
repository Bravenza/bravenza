import { Compass, Package, Heart, Newspaper, Store } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  path: string;
  label: string;
  mobileLabel: string;
  icon?: LucideIcon;
  exact?: boolean;
}

export const navItems: NavItem[] = [
  { path: "/app", label: "Explorar", mobileLabel: "Explorar", icon: Compass, exact: true },
  { path: "/app/pedidos", label: "Pedidos", mobileLabel: "Pedidos", icon: Package },
  { path: "/app/favoritos", label: "Favoritos", mobileLabel: "Favoritos", icon: Heart },
  { path: "/app/feed", label: "Feed", mobileLabel: "Feed", icon: Newspaper },
  { path: "/app/loja", label: "Minha Loja", mobileLabel: "Loja", icon: Store },
];
