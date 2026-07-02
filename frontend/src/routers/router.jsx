import {createBrowserRouter} from "react-router-dom";
import App from "../App";
import Home from "../pages/home/Home";
import Login from "../components/Login";
import Register from "../components/Register";
import CartPage from "../pages/books/CartPage";
import CheckoutPage from "../pages/books/CheckoutPage";
import AddressSelection from "../pages/books/AddressSelection";
import BookDetail from "../pages/books/BookDetail";
import UserRoute from "./UserRoute";
import AdminRoute from "./AdminRoute";
import AdminLogin from "../components/AdminLogin";
import AdminRegister from "../components/AdminRegister";
import DashboardLayout from "../pages/dashboard/DashboardLayout";
import MainDashboard from "../pages/dashboard/MainDashboard";
import ManageBooks from "../pages/dashboard/books/ManageBooks";
import ManageOrders from "../pages/dashboard/orders/ManageOrders";
import AddBook from "../pages/dashboard/books/AddBook";
import UpdateBook from "../pages/dashboard/books/UpdateBook";
import UserDashboard from "../pages/dashboard/users/UserDashboard";
import SearchResults from "../pages/home/SearchResults";
import CategoriesPage from "../pages/books/CategoriesPage";
import AudioPlayer from "../pages/books/AudioPlayer";
import SampleReader from "../pages/books/SampleReader";
import ManageBanners from "../pages/dashboard/banners/ManageBanners";
import AddBanner from "../pages/dashboard/banners/AddBanner";
import UpdateBanner from "../pages/dashboard/banners/UpdateBanner";
import ManageAuthors from "../pages/dashboard/authors/ManageAuthors";
import AddAuthor from "../pages/dashboard/authors/AddAuthor";
import UpdateAuthor from "../pages/dashboard/authors/UpdateAuthor";
import ManageGenres from "../pages/dashboard/genres/ManageGenres";
import AddGenre from "../pages/dashboard/genres/AddGenre";
import UpdateGenre from "../pages/dashboard/genres/UpdateGenre";
import ManageUsers from "../pages/dashboard/users/ManageUsers";
import SellerProfile from "../pages/dashboard/SellerProfile";

const router = createBrowserRouter([
    {
      path: "/",
      element: <App/>,
      children: [
        {
            path: "/",
            element: <Home/>,
        },
        {
            path: "/about",
            element: <div>About</div>
        },
        {
          path: "/login",
          element: <Login/>
        },
        {
          path: "/register",
          element: <Register/>
        },
        {
          path: "/cart",
          element: <CartPage/>
        },
        {
          path: "/checkout",
          element: <UserRoute><CheckoutPage/></UserRoute>
        },
        {
          path: "/checkout/address",
          element: <UserRoute><AddressSelection/></UserRoute>
        },
        {
          path: "/books/:id",
          element: <BookDetail/>
        },
        {
          path: "/search",
          element: <SearchResults/>
        },
        {
          path: "/books",
          element: <CategoriesPage/>
        },
        {
          path: "/audio-player",
          element: <AudioPlayer/>
        },
        {
          path: "/reader",
          element: <SampleReader/>
        },
        {
          path: "/user-dashboard",
          element: <UserRoute><UserDashboard/></UserRoute>
        }
        
      ]
    },
    {
      path: "/admin",
      element: <AdminLogin/>
    },
    {
      path: "/admin/register",
      element: <AdminRegister/>
    },
    {
      path: "/dashboard",
      element: <AdminRoute>
        <DashboardLayout/>
      </AdminRoute>,
      children:[
        {
          path: "",
          element: <AdminRoute><MainDashboard/></AdminRoute>
        },
        {
          path: "add-new-book",
          element: <AdminRoute>
            <AddBook/>
          </AdminRoute>
        },
        {
          path: "edit-book/:id",
          element: <AdminRoute>
            <UpdateBook/>
          </AdminRoute>
        },
        {
          path: "manage-books",
          element: <AdminRoute>
            <ManageBooks/>
          </AdminRoute>
        },
        {
          path: "manage-banners",
          element: <AdminRoute><ManageBanners/></AdminRoute>
        },
        {
          path: "add-banner",
          element: <AdminRoute><AddBanner/></AdminRoute>
        },
        {
          path: "edit-banner/:id",
          element: <AdminRoute><UpdateBanner/></AdminRoute>
        },
        {
          path: "manage-orders",
          element: <AdminRoute>
            <ManageOrders/>
          </AdminRoute>
        },
        {
          path: "manage-authors",
          element: <AdminRoute><ManageAuthors/></AdminRoute>
        },
        {
          path: "add-author",
          element: <AdminRoute><AddAuthor/></AdminRoute>
        },
        {
          path: "edit-author/:id",
          element: <AdminRoute><UpdateAuthor/></AdminRoute>
        },
        {
          path: "manage-genres",
          element: <AdminRoute><ManageGenres/></AdminRoute>
        },
        {
          path: "add-genre",
          element: <AdminRoute><AddGenre/></AdminRoute>
        },
        {
          path: "edit-genre/:id",
          element: <AdminRoute><UpdateGenre/></AdminRoute>
        },
        {
          path: "manage-users",
          element: <AdminRoute><ManageUsers/></AdminRoute>
        },
        {
          path: "profile",
          element: <AdminRoute><SellerProfile/></AdminRoute>
        },
      ]
    }
  ]);

  export default router;