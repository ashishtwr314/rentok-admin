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
  Grid,
  Avatar,
  Tooltip,
  Alert,
  Snackbar,
  InputAdornment,
  TablePagination,
  TextField,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DeliveryDining as DeliveryIcon,
  Search as SearchIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Verified as VerifiedIcon,
  Close as CloseIcon,
  DirectionsCar as VehicleIcon,
  LocationOn as LocationIcon,
} from "@mui/icons-material";
import { Sidebar } from "../../../components/Sidebar";
import { DeliveryPartnerForm } from "../../../components/DeliveryPartnerForm";
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

interface DeliveryPartner {
  delivery_partner_id: string;
  name: string;
  email: string;
  phone: string;
  vehicle_type?: string;
  vehicle_number?: string;
  address?: string;
  city?: string;
  state?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const DeliveryPartnersPage = () => {
  const [activeMenuItem, setActiveMenuItem] = useState("delivery-partners");
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPartner, setEditingPartner] = useState<DeliveryPartner | null>(
    null
  );
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [partnerToDelete, setPartnerToDelete] =
    useState<DeliveryPartner | null>(null);
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
    vehicle_type: "",
    vehicle_number: "",
    address: "",
    city: "Jagdalpur",
    state: "Chhattisgarh",
    is_active: true,
  });

  useEffect(() => {
    fetchDeliveryPartners();
  }, []);

  const fetchDeliveryPartners = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("delivery_partners")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPartners(data || []);
    } catch (error) {
      console.error("Error fetching delivery partners:", error);
      setSnackbar({
        open: true,
        message: "Error fetching delivery partners",
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

  const handleOpenDialog = (partner?: DeliveryPartner) => {
    if (partner) {
      setEditingPartner(partner);
      setFormData({
        name: partner.name,
        email: partner.email,
        phone: partner.phone.replace(/^\+91\s?/, ""),
        password: "",
        confirmPassword: "",
        vehicle_type: partner.vehicle_type || "",
        vehicle_number: partner.vehicle_number || "",
        address: partner.address || "",
        city: partner.city || "Jagdalpur",
        state: partner.state || "Chhattisgarh",
        is_active: partner.is_active,
      });
    } else {
      setEditingPartner(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        vehicle_type: "",
        vehicle_number: "",
        address: "",
        city: "Jagdalpur",
        state: "Chhattisgarh",
        is_active: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPartner(null);
  };

  const handleSavePartner = async (data: typeof formData) => {
    try {
      if (editingPartner) {
        // Update existing partner using API route (which handles auth updates)
        const { password, confirmPassword, ...partnerUpdateData } = data;

        const updatePayload: any = {
          ...partnerUpdateData,
          oldEmail: editingPartner.email,
        };

        // Only include password if it's provided
        if (password) {
          updatePayload.password = password;
        }

        const response = await fetch(
          `/api/delivery-partners/${editingPartner.delivery_partner_id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updatePayload),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to update delivery partner");
        }

        setSnackbar({
          open: true,
          message: "Delivery partner updated successfully",
          severity: "success",
        });
      } else {
        // Create new partner
        const { password, confirmPassword, ...partnerData } = data;

        // First, create the partner record
        const { data: partnerResult, error: partnerError } = await supabase
          .from("delivery_partners")
          .insert([partnerData])
          .select()
          .single();

        if (partnerError) {
          console.error("Error creating partner record:", partnerError);

          // Show specific error message
          let errorMessage = "Failed to create delivery partner";
          if (partnerError.code === "23505") {
            if (partnerError.message.includes("email")) {
              errorMessage = "This email is already registered";
            } else {
              errorMessage = "A partner with these details already exists";
            }
          } else if (partnerError.message) {
            errorMessage = partnerError.message;
          }

          throw new Error(errorMessage);
        }

        // Then, create the admin auth record for login
        const hashedPassword = await bcrypt.hash(data.password, 12);
        const { error: authError } = await supabase.from("admins").insert([
          {
            email: data.email,
            password: hashedPassword,
            phone_number: `+91${data.phone.replace(/\s/g, "")}`,
            phone_verified: true,
            email_verified: true,
            type: "delivery_partner",
          },
        ]);

        if (authError) {
          // If auth record creation fails, clean up the partner record
          await supabase
            .from("delivery_partners")
            .delete()
            .eq("delivery_partner_id", partnerResult.delivery_partner_id);

          console.error("Error creating partner auth record:", authError);

          // Show specific error message
          let errorMessage = "Failed to create partner authentication record";
          if (authError.code === "23505") {
            if (authError.message.includes("phone_number")) {
              errorMessage = "This phone number is already registered";
            } else if (authError.message.includes("email")) {
              errorMessage = "This email is already registered";
            } else {
              errorMessage = "This phone number or email is already registered";
            }
          } else if (authError.message) {
            errorMessage = authError.message;
          }

          throw new Error(errorMessage);
        }

        setSnackbar({
          open: true,
          message: "Delivery partner created successfully!",
          severity: "success",
        });
      }

      handleCloseDialog();
      fetchDeliveryPartners();
    } catch (error) {
      console.error("Error saving delivery partner:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error saving delivery partner";
      setSnackbar({ open: true, message: errorMessage, severity: "error" });
    }
  };

  const handleDeletePartner = async () => {
    if (!partnerToDelete) return;

    try {
      setLoading(true);

      // Use API route to delete (handles auth deletion properly)
      const response = await fetch(
        `/api/delivery-partners/${partnerToDelete.delivery_partner_id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete delivery partner");
      }

      setSnackbar({
        open: true,
        message: "Delivery partner deleted successfully",
        severity: "success",
      });
      setDeleteConfirmOpen(false);
      setPartnerToDelete(null);
      fetchDeliveryPartners();
    } catch (error) {
      console.error("Error deleting delivery partner:", error);
      setSnackbar({
        open: true,
        message:
          error instanceof Error
            ? error.message
            : "Error deleting delivery partner",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPartners = partners.filter(
    (partner) =>
      partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedPartners = filteredPartners.slice(
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
            <DeliveryIcon sx={{ mr: 2, fontSize: 32 }} />
            <Typography variant="h4" component="h1" sx={{ fontWeight: "bold" }}>
              Delivery Partners Management
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
            Add New Partner
          </Button>
        </Box>

        {/* Main Content */}
        <Box sx={{ p: 3 }}>
          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* @ts-expect-error MUI Grid item prop */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: "bold",
                      mb: 1,
                      color: THEME_COLORS.rentPrimary,
                    }}
                  >
                    {partners.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Partners
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            {/* @ts-expect-error MUI Grid item prop */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: "bold",
                      mb: 1,
                      color: THEME_COLORS.primary,
                    }}
                  >
                    {partners.filter((p) => p.is_active).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Partners
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Search */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* @ts-expect-error MUI Grid item prop */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                placeholder="Search partners by name, email, or phone..."
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

          {/* Partners Table */}
          <Card>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: THEME_COLORS.tint }}>
                    <TableCell>Partner</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Vehicle</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Status</TableCell>
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
                        Loading delivery partners...
                      </TableCell>
                    </TableRow>
                  ) : paginatedPartners.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        sx={{ textAlign: "center", py: 4 }}
                      >
                        No delivery partners found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedPartners.map((partner) => (
                      <TableRow key={partner.delivery_partner_id} hover>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Avatar
                              sx={{ mr: 2, bgcolor: THEME_COLORS.primary }}
                            >
                              {partner.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: "bold" }}
                              >
                                {partner.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                ID: {partner.delivery_partner_id.slice(0, 8)}...
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
                                {partner.email}
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
                                {partner.phone}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            {partner.vehicle_type && (
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: "bold",
                                  textTransform: "capitalize",
                                }}
                              >
                                {partner.vehicle_type}
                              </Typography>
                            )}
                            {partner.vehicle_number && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {partner.vehicle_number}
                              </Typography>
                            )}
                            {!partner.vehicle_type &&
                              !partner.vehicle_number && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Not specified
                                </Typography>
                              )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: "bold" }}
                            >
                              {partner.city || "N/A"}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {partner.state || "N/A"}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={partner.is_active ? "Active" : "Inactive"}
                            color={partner.is_active ? "success" : "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <Tooltip title="Edit Partner">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDialog(partner)}
                                sx={{ color: THEME_COLORS.primary }}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Partner">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setPartnerToDelete(partner);
                                  setDeleteConfirmOpen(true);
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
              count={filteredPartners.length}
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

      {/* Partner Form Dialog */}
      <DeliveryPartnerForm
        open={openDialog}
        onClose={handleCloseDialog}
        onSave={handleSavePartner}
        formData={formData}
        setFormData={setFormData}
        editingPartner={editingPartner}
        loading={loading}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="sm"
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
              Confirm Deletion
            </Typography>
            <Typography variant="caption">
              This action cannot be undone
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body1" sx={{ fontWeight: "bold", mb: 1 }}>
              Are you sure you want to delete delivery partner "
              {partnerToDelete?.name}"?
            </Typography>
            <Typography variant="body2">
              This will permanently delete the partner's account and all
              associated data.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3, backgroundColor: "#f5f5f5" }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} sx={{ mr: 2 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeletePartner}
            disabled={loading}
            startIcon={<DeleteIcon />}
            sx={{
              fontWeight: "bold",
              px: 3,
            }}
          >
            {loading ? "Deleting..." : "Delete Partner"}
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

export default DeliveryPartnersPage;
