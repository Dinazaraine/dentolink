import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "./auth/ProtectedRoute";
import AppLayout from "./layout/AppLayout.jsx";
import Home from "./pages/Home.jsx";
import ClientsPage from "./features/clients/ClientsPage.jsx";
import ProductsPage from "./features/products/ProductsPage.jsx";
import OrdersPage from "./features/orders/OrdersPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";

// Admin pages
import AdminDashboard from "./features/admin2/AdminDashboard.jsx";
import AdminOrderList from "./features/admin2/OrderList.jsx";
import AdminOrderDetail from "./features/admin2/OrderDetail.jsx";
import AdminFileActions from "./features/admin2/FileActions.jsx";

// Dentiste pages
import DentisteDashboard from "./features/dentiste/DentisteDashboard.jsx";
import DentisteOrderList from "./features/dentiste/OrderList.jsx";
import DentisteOrderDetail from "./features/dentiste/OrderDetail.jsx";
import DentisteOrderFileUpload from "./features/dentiste/OrderFileUpload.jsx";

const routes = createBrowserRouter(
  [
    // Routes publiques
    { path: "/login", element: <LoginPage /> },
    { path: "/register", element: <RegisterPage /> },

    // Routes protégées
    {
      element: <ProtectedRoute />, // check token
      children: [
        {
          path: "/",
          element: <AppLayout />,
          children: [
            { index: true, element: <Home /> },
            { path: "clients", element: <ClientsPage /> },
            { path: "products", element: <ProductsPage /> },
            { path: "orders", element: <OrdersPage /> },

            // Admin routes
            { path: "admin", element: <AdminDashboard /> },
            { path: "admin/orders", element: <AdminOrderList /> },
            { path: "admin/orders/:id", element: <AdminOrderDetail /> },
            { path: "admin/files", element: <AdminFileActions /> },

            // Dentiste routes
            { path: "dentiste", element: <DentisteDashboard /> },
            { path: "dentiste/orders", element: <DentisteOrderList /> },
            { path: "dentiste/orders/:id", element: <DentisteOrderDetail /> },
            { path: "dentiste/orders/:id/upload", element: <DentisteOrderFileUpload /> },
          ],
        },
      ],
    },
  ],
  {
    future: {
      v7_startTransition: true,
    },
  }
);

export default routes;
