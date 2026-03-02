/**
 * Centralized Route Paths — Type-safe route constants
 * 
 * All route paths are defined here to prevent typos, enable refactoring,
 * and provide parameterized route helpers.
 * 
 * Pattern used by: Airbnb, Shopify, Vercel
 */

export const PATHS = {
  // ─── Public ───────────────────────────────────────
  home: "/",
  solicitar: "/solicitar",
  rastreio: "/rastreio",
  rastreioDetail: (orderId: string) => `/rastreio/${orderId}` as const,
  orcamento: (token: string) => `/orcamento/${token}` as const,
  pagamento: (token: string) => `/pagamento/${token}` as const,
  confirmacao: (token: string) => `/confirmacao/${token}` as const,
  checkoutPreview: "/checkout-preview",
  termos: "/termos",
  politicas: "/politicas",
  trocasDevolucoes: "/trocas-devolucoes",
  instalar: "/instalar",
  autenticidade: "/autenticidade",
  autenticidadeCode: (code: string) => `/autenticidade/${code}` as const,
  sobreAutenticidade: "/sobre-autenticidade",
  diretrizesAnuncio: "/diretrizes-anuncio",
  regrasMarketplace: "/regras-marketplace",
  verificacaoAutenticidade: "/verificacao-autenticidade",
  previewDeliveryFlow: "/preview-delivery-flow",
  faq: "/faq",
  entrar: "/entrar",

  // ─── App (authenticated) ─────────────────────────
  app: {
    root: "/app",
    pedidos: "/app/pedidos",
    pedidoDetail: (orderId: string) => `/app/pedidos/${orderId}` as const,
    closet: "/app/closet",
    loja: "/app/loja",
    favoritos: "/app/favoritos",
    feed: "/app/feed",
    perfil: "/app/perfil",
    wishlist: "/app/wishlist",
    vault: "/app/vault",
    drops: "/app/drops",
    comunidade: "/app/comunidade",
    mais: "/app/mais",
    notificacoes: "/app/notificacoes",
    documentos: "/app/documentos",
    mensagens: "/app/mensagens",
    enderecos: "/app/enderecos",
    seguranca: "/app/seguranca",
  },

  // ─── Marketplace ─────────────────────────────────
  marketplace: {
    root: "/marketplace",
    checkout: "/marketplace/checkout",
    product: (slug: string) => `/marketplace/product/${slug}` as const,
    productBySlug: (slug: string) => `/marketplace/${slug}` as const,
    seller: (sellerId: string) => `/marketplace/seller/${sellerId}` as const,
    vender: "/vender",
    full: "/full",
  },

  // ─── Drops ────────────────────────────────────────
  drops: {
    article: (postId: string) => `/drops/${postId}` as const,
  },

  // ─── Vault ────────────────────────────────────────
  vault: {
    root: "/vault",
    waitlist: "/vault/waitlist",
    redeem: "/vault/redeem",
    perfil: "/vault/perfil",
    matchRoom: (matchRoomId: string) => `/vault/app/match/${matchRoomId}` as const,
  },

  // ─── Admin ────────────────────────────────────────
  admin: {
    login: "/admin/login",
    root: "/admin",
    pedidos: "/admin/pedidos",
    pedidoNovo: "/admin/pedidos/novo",
    pedidoDetail: (orderId: string) => `/admin/pedidos/${orderId}` as const,
    solicitacoes: "/admin/solicitacoes",
    financeiro: "/admin/financeiro",
    calculadora: "/admin/calculadora",
    modelos: "/admin/modelos",
    fornecedores: "/admin/fornecedores",
    fornecedorNovo: "/admin/fornecedores/novo",
    fornecedorEditar: (id: string) => `/admin/fornecedores/${id}/editar` as const,
    avaliacoes: "/admin/avaliacoes",
    indicacoes: "/admin/indicacoes",
    usuarios: "/admin/usuarios",
    configuracoes: "/admin/configuracoes",
    logs: "/admin/logs",
    faq: "/admin/faq",
    emails: "/admin/emails",
    whatsapp: "/admin/whatsapp",
    vault: {
      membros: "/admin/vault/membros",
      buscas: "/admin/vault/buscas",
      items: "/admin/vault/items",
      itemNovo: "/admin/vault/items/novo",
      itemDetail: (id: string) => `/admin/vault/items/${id}` as const,
      convites: "/admin/vault/convites",
      drops: "/admin/vault/drops",
      comunidade: "/admin/vault/comunidade",
      marketplace: "/admin/vault/marketplace",
      marketplaceInspecao: "/admin/vault/marketplace/inspecao",
      marketplacePlanos: "/admin/vault/marketplace/planos",
      marketplaceAnalytics: "/admin/vault/marketplace/analytics",
      marketplaceModeracao: "/admin/vault/marketplace/moderacao",
      marketplaceDisputas: "/admin/vault/marketplace/disputas",
      marketplaceCampanhas: "/admin/vault/marketplace/campanhas",
      matchrooms: "/admin/vault/matchrooms",
      matchroomDetail: (id: string) => `/admin/vault/matchrooms/${id}` as const,
    },
  },
} as const;

/**
 * Route preload registry — maps paths to their lazy import functions.
 * Used by the prefetch system to preload chunks on hover/visibility.
 */
export const ROUTE_PRELOADS: Record<string, () => Promise<unknown>> = {
  [PATHS.app.root]: () => import("@/pages/marketplace/MarketplaceHomePage"),
  [PATHS.app.pedidos]: () => import("@/pages/marketplace/MarketplaceOrdersPage2"),
  [PATHS.app.perfil]: () => import("@/pages/marketplace/MarketplaceProfilePage"),
  [PATHS.app.favoritos]: () => import("@/pages/marketplace/MarketplaceFavoritesPage"),
  [PATHS.app.feed]: () => import("@/pages/marketplace/MarketplaceFeedPage"),
  [PATHS.app.loja]: () => import("@/pages/marketplace/MarketplaceMyStorePage"),
  [PATHS.app.drops]: () => import("@/pages/app/AppDropsPage"),
  [PATHS.app.vault]: () => import("@/pages/app/AppVaultPage"),
  [PATHS.app.wishlist]: () => import("@/pages/app/AppWishlistPage"),
  [PATHS.app.comunidade]: () => import("@/pages/app/AppCommunityPage"),
  [PATHS.app.mais]: () => import("@/pages/app/AppMorePage"),
  [PATHS.app.notificacoes]: () => import("@/pages/app/AppNotificationsPage"),
  [PATHS.marketplace.checkout]: () => import("@/pages/marketplace/MarketplaceCheckoutPage"),
  [PATHS.vault.root]: () => import("@/pages/vault/VaultLandingPage"),
  [PATHS.entrar]: () => import("@/pages/client/ClientAuthPage"),
  [PATHS.admin.root]: () => import("@/pages/admin/AdminDashboard"),
};
