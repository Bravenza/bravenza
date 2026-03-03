import { Search, ShoppingBag, Heart, Activity, Store } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  path: string;
  label: string;
  mobileLabel: string;
  icon?: LucideIcon;
  exact?: boolean;
}

export const navItems: NavItem[] = [
  { path: "/app", label: "Explorar", mobileLabel: "Explorar", exact: true },
  { path: "/app/pedidos", label: "Pedidos", mobileLabel: "Pedidos", icon: ShoppingBag },
  { path: "/app/favoritos", label: "Favoritos", mobileLabel: "Favoritos", icon: Heart },
  { path: "/app/feed", label: "Feed", mobileLabel: "Feed", icon: Activity },
  { path: "/app/loja", label: "Minha Loja", mobileLabel: "Loja", icon: Store },
];
