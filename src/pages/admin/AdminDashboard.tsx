import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ORDER_STATUS_LABELS, formatDate } from "@/lib/constants";
import { DashboardMetrics } from "@/components/admin/DashboardMetrics";

interface DashboardStats {
  total: number;
  pending: number;
  delivered: number;
  nearDeadline: number;
}

interface RecentOrder {
  order_id: string;
  order_type: string;
  current_status: string;
  client_name: string;
  product_name: string;
  created_at: string;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch all orders for stats
        const { data: orders, error } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (orders) {
          const now = new Date();
          const threeDaysFromNow = new Date(
            now.getTime() + 3 * 24 * 60 * 60 * 1000
          );

          const statsData: DashboardStats = {
            total: orders.length,
            pending: orders.filter((o) => o.current_status !== "DELIVERED")
              .length,
            delivered: orders.filter((o) => o.current_status === "DELIVERED")
              .length,
            nearDeadline: orders.filter((o) => {
              if (!o.sla_vault_due_date) return false;
              const dueDate = new Date(o.sla_vault_due_date);
              return dueDate <= threeDaysFromNow && dueDate >= now;
            }).length,
          };

          setStats(statsData);
          setRecentOrders(orders.slice(0, 5) as RecentOrder[]);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const statCards = [
    {
      title: "Total de Pedidos",
      value: stats?.total || 0,
      icon: Package,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Em Andamento",
      value: stats?.pending || 0,
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Entregues",
      value: stats?.delivered || 0,
      icon: CheckCircle2,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Prazos Próximos",
      value: stats?.nearDeadline || 0,
      icon: AlertTriangle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do sistema de pedidos
          </p>
        </div>
        <Link to="/admin/pedidos/novo">
          <Button className="btn-gold">
            <Package className="mr-2 h-4 w-4" />
            Novo Pedido
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="metrics">Métricas Detalhadas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="card-premium">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                        <p className="text-3xl font-bold mt-1">{stat.value}</p>
                      </div>
                      <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Recent orders */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent orders */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="card-premium">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Pedidos Recentes
                  </CardTitle>
                  <Link to="/admin/pedidos">
                    <Button variant="ghost" size="sm">
                      Ver todos
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {recentOrders.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum pedido cadastrado
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {recentOrders.map((order) => (
                        <Link
                          key={order.order_id}
                          to={`/admin/pedidos/${order.order_id}`}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                        >
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            <div>
                              <p className="font-medium text-sm">{order.order_id}</p>
                              <p className="text-xs text-muted-foreground">
                                {order.client_name}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-medium">
                              {ORDER_STATUS_LABELS[order.current_status] ||
                                order.current_status}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(order.created_at)}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="metrics">
          <DashboardMetrics />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
