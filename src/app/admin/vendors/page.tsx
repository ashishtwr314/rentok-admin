"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Avatar,
  Tooltip,
  Alert,
  Snackbar,
  InputAdornment,
  TablePagination,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Store as StoreIcon,
  Search as SearchIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Verified as VerifiedIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { Sidebar } from "../../../components/Sidebar";
import { VendorForm } from "../../../components/VendorForm";
import { supabase } from "../../../lib/supabase";
import bcrypt from "bcryptjs";

// Brand theme colors
const THEME_COLORS = {
  primary: "#FBA800",
  secondary: "#9A2143",
  rentPrimary: "#9A2143",
  rentPrimaryDark: "#7a1a35",
  background: {
    default: "#ffffff",
    paper: "#ffffff",
  },
  tint: "#FCF5E9",
};

interface Vendor {
  vendor_id: string;
  name: string;
  email: string;
  phone: string;
  business_name?: string;
  business_address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  gst_number?: string;
  pan_number?: string;
  bank_account_number?: string;
  bank_ifsc_code?: string;
  bank_account_holder_name?: string;
  is_verified: boolean;
  is_active: boolean;
  commission_rate: number;
  profile_picture_url?: string;
  business_license_url?: string;
  created_at: string;
  updated_at: string;
}

const VendorsPage = () => {
  const [activeMenuItem, setActiveMenuItem] = useState("vendors");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);
  const [vendorDeleteData, setVendorDeleteData] = useState<{
    products: any[];
    orders: any[];
    earnings: any[];
  }>({ products: [], orders: [], earnings: [] });
  const [loadingDeleteData, setLoadingDeleteData] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    business_name: "",
    business_address: "",
    city: "Jagdalpur",
    state: "Chhattisgarh",
    postal_code: "494001",
    country: "India",
    gst_number: "",
    pan_number: "",
    bank_account_number: "",
    bank_ifsc_code: "",
    bank_account_holder_name: "",
    is_verified: false,
    is_active: true,
    commission_rate: 10.0,
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      setSnackbar({
        open: true,
        message: "Error fetching vendors",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMenuItemClick = (itemId: string) => {
    setActiveMenuItem(itemId);
    if (itemId === "dashboard") {
      window.location.href = "/admin/dashboard";
    }
  };

  const handleOpenDialog = (vendor?: Vendor) => {
    if (vendor) {
      setEditingVendor(vendor);
      setFormData({
        name: vendor.name,
        email: vendor.email,
        phone: vendor.phone.replace(/^\+91\s?/, ""),
        password: "", // Don't populate existing password for security
        confirmPassword: "",
        business_name: vendor.business_name || "",
        business_address: vendor.business_address || "",
        city: vendor.city || "Jagdalpur",
        state: vendor.state || "Chhattisgarh",
        postal_code: vendor.postal_code || "494001",
        country: vendor.country || "India",
        gst_number: vendor.gst_number || "",
        pan_number: vendor.pan_number || "",
        bank_account_number: vendor.bank_account_number || "",
        bank_ifsc_code: vendor.bank_ifsc_code || "",
        bank_account_holder_name: vendor.bank_account_holder_name || "",
        is_verified: vendor.is_verified,
        is_active: vendor.is_active,
        commission_rate: vendor.commission_rate,
      });
    } else {
      setEditingVendor(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        business_name: "",
        business_address: "",
        city: "Jagdalpur",
        state: "Chhattisgarh",
        postal_code: "494001",
        country: "India",
        gst_number: "",
        pan_number: "",
        bank_account_number: "",
        bank_ifsc_code: "",
        bank_account_holder_name: "",
        is_verified: false,
        is_active: true,
        commission_rate: 10.0,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingVendor(null);
  };

  const handleSaveVendor = async (data: typeof formData) => {
    try {
      if (editingVendor) {
        // Update existing vendor
        const vendorUpdateData = { ...data };
        delete vendorUpdateData.password;
        delete vendorUpdateData.confirmPassword;

        const { error } = await supabase
          .from("vendors")
          .update(vendorUpdateData)
          .eq("vendor_id", editingVendor.vendor_id);

        if (error) throw error;

        // Update password if provided
        if (data.password) {
          const hashedPassword = await bcrypt.hash(data.password, 12);
          const { error: authError } = await supabase
            .from("admins")
            .update({ password: hashedPassword })
            .eq("email", data.email)
            .eq("type", "vendor");

          if (authError) {
            console.error("Error updating vendor password:", authError);
            throw new Error("Failed to update vendor password");
          }
        }

        setSnackbar({
          open: true,
          message: "Vendor updated successfully",
          severity: "success",
        });
      } else {
        // Create new vendor - need to create both vendor record and admin auth record
        const vendorData = { ...data };
        delete vendorData.password;
        delete vendorData.confirmPassword;

        // First, create the vendor record
        const { data: vendorResult, error: vendorError } = await supabase
          .from("vendors")
          .insert([vendorData])
          .select()
          .single();

        if (vendorError) throw vendorError;

        // Then, create the admin auth record for login
        const hashedPassword = await bcrypt.hash(data.password, 12);
        const { error: authError } = await supabase.from("admins").insert([
          {
            email: data.email,
            password: hashedPassword,
            phone_number: `+91${data.phone.replace(/\s/g, "")}`, // Format phone with country code
            phone_verified: true, // Auto-verify for admin-created vendors
            email_verified: true, // Auto-verify for admin-created vendors
            type: "vendor",
          },
        ]);

        if (authError) {
          // If auth record creation fails, clean up the vendor record
          await supabase
            .from("vendors")
            .delete()
            .eq("vendor_id", vendorResult.vendor_id);

          console.error("Error creating vendor auth record:", authError);
          throw new Error("Failed to create vendor authentication record");
        }

        // Send welcome email to the new vendor
        try {
          const emailResponse = await fetch("/api/vendors/welcome-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              vendorName: data.name,
              email: data.email,
              password: data.password, // Send the plain password for the email
              businessName: data.business_name,
              phone: `+91${data.phone.replace(/\s/g, "")}`,
              city: data.city,
              state: data.state,
              gstNumber: data.gst_number,
              panNumber: data.pan_number,
              bankAccountNumber: data.bank_account_number,
              bankIfscCode: data.bank_ifsc_code,
              bankAccountHolderName: data.bank_account_holder_name,
              commissionRate: data.commission_rate,
              loginUrl: `${window.location.origin}/login`,
            }),
          });

          if (!emailResponse.ok) {
            console.error(
              "Failed to send welcome email, but vendor was created successfully"
            );
            // Don't throw error - vendor creation was successful
          } else {
            console.log("Welcome email sent successfully");
          }
        } catch (emailError) {
          console.error("Error sending welcome email:", emailError);
          // Don't throw error - vendor creation was successful
        }

        setSnackbar({
          open: true,
          message: "Vendor created successfully and welcome email sent!",
          severity: "success",
        });
      }

      handleCloseDialog();
      fetchVendors();
    } catch (error) {
      console.error("Error saving vendor:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error saving vendor";
      setSnackbar({ open: true, message: errorMessage, severity: "error" });
    }
  };

  const fetchVendorDeleteData = async (vendorId: string) => {
    setLoadingDeleteData(true);
    try {
      // Fetch all products for this vendor
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("product_id, title, price_per_day, stock_quantity")
        .eq("vendor_id", vendorId);

      if (productsError) throw productsError;

      // Fetch all orders that contain products from this vendor
      const productIds = products?.map((p) => p.product_id) || [];
      let orders: any[] = [];

      if (productIds.length > 0) {
        const { data: orderItems, error: orderItemsError } = await supabase
          .from("order_items")
          .select(
            "order_id, orders(order_id, order_number, total_amount, created_at, status)"
          )
          .in("product_id", productIds);

        if (orderItemsError) throw orderItemsError;

        // Extract unique orders
        const uniqueOrders = new Map();
        orderItems?.forEach((item: any) => {
          if (item.orders && !uniqueOrders.has(item.orders.order_id)) {
            uniqueOrders.set(item.orders.order_id, item.orders);
          }
        });
        orders = Array.from(uniqueOrders.values());
      }

      // Fetch vendor earnings
      const { data: earnings, error: earningsError } = await supabase
        .from("vendor_earnings")
        .select(
          "earning_id, gross_amount, commission_amount, net_amount, status"
        )
        .eq("vendor_id", vendorId);

      if (earningsError) throw earningsError;

      setVendorDeleteData({
        products: products || [],
        orders: orders || [],
        earnings: earnings || [],
      });
    } catch (error) {
      console.error("Error fetching vendor delete data:", error);
      setSnackbar({
        open: true,
        message: "Error loading vendor data",
        severity: "error",
      });
    } finally {
      setLoadingDeleteData(false);
    }
  };

  const handleDeleteVendor = async () => {
    if (!vendorToDelete) return;

    try {
      setLoading(true);
      const vendorId = vendorToDelete.vendor_id;

      // Get all product IDs for this vendor
      const { data: products } = await supabase
        .from("products")
        .select("product_id")
        .eq("vendor_id", vendorId);

      const productIds = products?.map((p) => p.product_id) || [];

      // Get all order IDs that contain these products
      let orderIds: string[] = [];
      if (productIds.length > 0) {
        const { data: orderItems } = await supabase
          .from("order_items")
          .select("order_id")
          .in("product_id", productIds);

        orderIds = [
          ...new Set(orderItems?.map((oi: any) => oi.order_id) || []),
        ];
      }

      // Delete in correct order to respect foreign key constraints

      // 1. Delete order status history (references orders)
      if (orderIds.length > 0) {
        await supabase
          .from("order_status_history")
          .delete()
          .in("order_id", orderIds);
      }

      // 2. Delete reviews (references products and orders)
      if (productIds.length > 0) {
        await supabase.from("reviews").delete().in("product_id", productIds);
      }

      // 3. Delete product highlights (references products)
      if (productIds.length > 0) {
        await supabase
          .from("product_highlights")
          .delete()
          .in("product_id", productIds);
      }

      // 4. Delete wishlist items (references products)
      if (productIds.length > 0) {
        await supabase.from("wishlist").delete().in("product_id", productIds);
      }

      // 5. Delete vendor earnings (references vendor, orders, order_items)
      await supabase.from("vendor_earnings").delete().eq("vendor_id", vendorId);

      // 6. Delete coupon usage (references vendor)
      await supabase.from("coupon_usage").delete().eq("vendor_id", vendorId);

      // 7. Delete order items (references orders and products)
      if (orderIds.length > 0) {
        await supabase.from("order_items").delete().in("order_id", orderIds);
      }

      // 8. Delete orders (now safe to delete)
      if (orderIds.length > 0) {
        await supabase.from("orders").delete().in("order_id", orderIds);
      }

      // 9. Delete coupons (references vendor)
      await supabase.from("coupons").delete().eq("vendor_id", vendorId);

      // 10. Delete products (references vendor)
      if (productIds.length > 0) {
        await supabase.from("products").delete().in("product_id", productIds);
      }

      // 11. Delete the vendor record
      const { error: vendorError } = await supabase
        .from("vendors")
        .delete()
        .eq("vendor_id", vendorId);

      if (vendorError) throw vendorError;

      // 12. Delete the corresponding admin auth record
      const { error: authError } = await supabase
        .from("admins")
        .delete()
        .eq("email", vendorToDelete.email)
        .eq("type", "vendor");

      if (authError) {
        console.error("Error deleting vendor auth record:", authError);
      }

      setSnackbar({
        open: true,
        message: "Vendor and all related data deleted successfully",
        severity: "success",
      });
      setDeleteConfirmOpen(false);
      setVendorToDelete(null);
      setVendorDeleteData({ products: [], orders: [], earnings: [] });
      fetchVendors();
    } catch (error) {
      console.error("Error deleting vendor:", error);
      setSnackbar({
        open: true,
        message: "Error deleting vendor",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter(
    (vendor) =>
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.business_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedVendors = filteredVendors.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <Sidebar
        userRole="admin"
        activeItem={activeMenuItem}
        onItemClick={handleMenuItemClick}
      />

      {/* Main Content */}
      <Box sx={{ flex: 1, marginLeft: "280px", backgroundColor: "#f5f5f5" }}>
        {/* Header */}
        <Box
          sx={{
            background: `linear-gradient(135deg, ${THEME_COLORS.primary} 0%, ${THEME_COLORS.secondary} 100%)`,
            color: "white",
            p: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <StoreIcon sx={{ mr: 2, fontSize: 32 }} />
            <Typography variant="h4" component="h1" sx={{ fontWeight: "bold" }}>
              Vendors Management
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              backgroundColor: "rgba(255,255,255,0.2)",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.3)",
              },
            }}
          >
            Add New Vendor
          </Button>
        </Box>

        {/* Main Content */}
        <Box sx={{ p: 3 }}>
          {/* Search and Stats */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                placeholder="Search vendors by name, email, or business name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>

          {/* Vendors Table */}
          <Card>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: THEME_COLORS.tint }}>
                    <TableCell>Vendor</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Business</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Commission</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        sx={{ textAlign: "center", py: 4 }}
                      >
                        Loading vendors...
                      </TableCell>
                    </TableRow>
                  ) : paginatedVendors.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        sx={{ textAlign: "center", py: 4 }}
                      >
                        No vendors found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedVendors.map((vendor) => (
                      <TableRow key={vendor.vendor_id} hover>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Avatar
                              sx={{ mr: 2, bgcolor: THEME_COLORS.primary }}
                            >
                              {vendor.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: "bold" }}
                              >
                                {vendor.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                ID: {vendor.vendor_id.slice(0, 8)}...
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                mb: 0.5,
                              }}
                            >
                              <EmailIcon
                                sx={{
                                  fontSize: 16,
                                  mr: 1,
                                  color: "text.secondary",
                                }}
                              />
                              <Typography variant="body2">
                                {vendor.email}
                              </Typography>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <PhoneIcon
                                sx={{
                                  fontSize: 16,
                                  mr: 1,
                                  color: "text.secondary",
                                }}
                              />
                              <Typography variant="body2">
                                {vendor.phone}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: "bold" }}
                            >
                              {vendor.business_name || "N/A"}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {vendor.city}, {vendor.state}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Chip
                              label={vendor.is_active ? "Active" : "Inactive"}
                              color={vendor.is_active ? "success" : "default"}
                              size="small"
                              sx={{ mb: 0.5 }}
                            />
                            <br />
                            <Chip
                              icon={<VerifiedIcon />}
                              label={
                                vendor.is_verified ? "Verified" : "Unverified"
                              }
                              color={vendor.is_verified ? "primary" : "default"}
                              size="small"
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: "bold" }}
                          >
                            {vendor.commission_rate}%
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <Tooltip title="Edit Vendor">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDialog(vendor)}
                                sx={{ color: THEME_COLORS.primary }}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Vendor">
                              <IconButton
                                size="small"
                                onClick={async () => {
                                  setVendorToDelete(vendor);
                                  setDeleteConfirmOpen(true);
                                  await fetchVendorDeleteData(vendor.vendor_id);
                                }}
                                sx={{ color: "error.main" }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredVendors.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(event, newPage) => setPage(newPage)}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10));
                setPage(0);
              }}
            />
          </Card>
        </Box>
      </Box>

      {/* Vendor Form Component */}
      <VendorForm
        open={openDialog}
        onClose={handleCloseDialog}
        onSave={handleSaveVendor}
        formData={formData}
        setFormData={setFormData}
        editingVendor={editingVendor}
        loading={loading}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setVendorDeleteData({ products: [], orders: [], earnings: [] });
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            backgroundColor: "#f44336",
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <DeleteIcon />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Confirm Vendor Deletion
            </Typography>
            <Typography variant="caption">
              This action cannot be undone
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {loadingDeleteData ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography>Loading vendor data...</Typography>
            </Box>
          ) : (
            <>
              <Alert severity="error" sx={{ mb: 3 }}>
                <Typography variant="body1" sx={{ fontWeight: "bold", mb: 1 }}>
                  Warning: All data related to vendor "{vendorToDelete?.name}"
                  will be permanently deleted!
                </Typography>
                <Typography variant="body2">
                  This includes all products, orders, earnings, coupons, and
                  reviews associated with this vendor.
                </Typography>
              </Alert>

              {/* Products Summary */}
              <Card sx={{ mb: 2, backgroundColor: "#fff3e0" }}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Avatar
                      sx={{ bgcolor: "#ff9800", mr: 2, width: 32, height: 32 }}
                    >
                      <Typography sx={{ fontWeight: "bold" }}>
                        {vendorDeleteData.products.length}
                      </Typography>
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                      Products to be deleted
                    </Typography>
                  </Box>
                  {vendorDeleteData.products.length > 0 ? (
                    <Box sx={{ maxHeight: 150, overflow: "auto" }}>
                      {vendorDeleteData.products.map((product) => (
                        <Box
                          key={product.product_id}
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            py: 1,
                            borderBottom: "1px solid #ffe0b2",
                          }}
                        >
                          <Typography variant="body2">
                            {product.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ₹{product.price_per_day}/day (Stock:{" "}
                            {product.stock_quantity})
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No products found
                    </Typography>
                  )}
                </CardContent>
              </Card>

              {/* Orders Summary */}
              <Card sx={{ mb: 2, backgroundColor: "#e3f2fd" }}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Avatar
                      sx={{ bgcolor: "#2196f3", mr: 2, width: 32, height: 32 }}
                    >
                      <Typography sx={{ fontWeight: "bold" }}>
                        {vendorDeleteData.orders.length}
                      </Typography>
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                      Orders to be deleted
                    </Typography>
                  </Box>
                  {vendorDeleteData.orders.length > 0 ? (
                    <Box sx={{ maxHeight: 150, overflow: "auto" }}>
                      {vendorDeleteData.orders.map((order) => (
                        <Box
                          key={order.order_id}
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            py: 1,
                            borderBottom: "1px solid #bbdefb",
                          }}
                        >
                          <Typography variant="body2">
                            {order.order_number}
                          </Typography>
                          <Box sx={{ textAlign: "right" }}>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: "bold" }}
                            >
                              ₹{order.total_amount}
                            </Typography>
                            <Chip
                              label={order.status}
                              size="small"
                              sx={{ height: 20, fontSize: "0.7rem", mt: 0.5 }}
                            />
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No orders found
                    </Typography>
                  )}
                </CardContent>
              </Card>

              {/* Earnings Summary */}
              <Card sx={{ backgroundColor: "#e8f5e9" }}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Avatar
                      sx={{ bgcolor: "#4caf50", mr: 2, width: 32, height: 32 }}
                    >
                      <Typography sx={{ fontWeight: "bold" }}>
                        {vendorDeleteData.earnings.length}
                      </Typography>
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                      Earnings records to be deleted
                    </Typography>
                  </Box>
                  {vendorDeleteData.earnings.length > 0 ? (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Total earnings: ₹
                        {vendorDeleteData.earnings
                          .reduce(
                            (sum, e) => sum + parseFloat(e.net_amount || 0),
                            0
                          )
                          .toFixed(2)}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No earnings found
                    </Typography>
                  )}
                </CardContent>
              </Card>

              <Alert severity="warning" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  Additionally, all related reviews, product highlights,
                  wishlist items, coupons, and coupon usage records will also be
                  deleted.
                </Typography>
              </Alert>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, backgroundColor: "#f5f5f5" }}>
          <Button
            onClick={() => {
              setDeleteConfirmOpen(false);
              setVendorDeleteData({ products: [], orders: [], earnings: [] });
            }}
            sx={{ mr: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteVendor}
            disabled={loadingDeleteData || loading}
            startIcon={<DeleteIcon />}
            sx={{
              fontWeight: "bold",
              px: 3,
            }}
          >
            {loading ? "Deleting..." : "Delete Everything"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VendorsPage;
