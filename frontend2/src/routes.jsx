import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "./auth/ProtectedRoute";
import AppLayout from "./layout/AppLayout.jsx";
import Home from "./pages/Home.jsx";
import ClientsPage from "./features/clients/ClientsPage.jsx";
import ProductsPage from "./features/products/ProductsPage.jsx";
import OrdersPage from "./features/orders/OrdersPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import AdminUsersPage from "./features/admin/AdminUsersPage.jsx";
import OrderTable from "./features/orders/OrderTable.jsx";
import Messenger from "./features/orders/Messenger.jsx";

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

// Landing page
import LandingPage from "./pages/LandingPage.jsx";

const routes = createBrowserRouter(
  [
    { path: "/", element: <LandingPage /> },
    { path: "/login", element: <LoginPage /> },
    { path: "/register", element: <RegisterPage /> },
    {
      element: <ProtectedRoute />, // check token
      children: [
        {
          path: "/app",
          element: <AppLayout />,
          children: [
            { index: true, element: <Home /> },
            { path: "clients", element: <ClientsPage /> },
            { path: "products", element: <ProductsPage /> },
            { path: "orders", element: <OrdersPage /> },
            { path: "OrderTable", element: <OrderTable /> },
            { path: "Messenger", element: <Messenger /> },

            // Admin routes
            { path: "admin", element: <AdminDashboard /> },
            { path: "admin/orders", element: <AdminOrderList /> },
            { path: "admin/orders/:id", element: <AdminOrderDetail /> },
            { path: "admin/files", element: <AdminFileActions /> },
            { path: "AdminUsersPage", element: <AdminUsersPage /> },

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
