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
  Avatar,
  Tooltip,
  Alert,
  Snackbar,
  InputAdornment,
  TablePagination,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon,
  Search as SearchIcon,
  Image as ImageIcon,
  DragHandle as DragHandleIcon,
} from "@mui/icons-material";
import { Sidebar } from "../../../components/Sidebar";
import { supabase } from "../../../lib/supabase";
import Image from "next/image";
import ImageSelector, {
  ImageSelectorRef,
} from "../../../components/ImageSelector";

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

interface Category {
  category_id: string;
  name: string;
  description?: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const CategoriesPage = () => {
  const [activeMenuItem, setActiveMenuItem] = useState("categories");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null
  );
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
    description: "",
    image_url: "",
    sort_order: 0,
    is_active: true,
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageSelectorRef = React.useRef<ImageSelectorRef>(null);

  useEffect(() => {
    fetchCategories();

    // Initialize authentication for storage uploads
    const initAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        // Try to create an anonymous session for uploads
        try {
          await supabase.auth.signInAnonymously();
          console.log("Anonymous session created for storage uploads");
        } catch (error) {
          console.warn("Could not create anonymous session:", error);
        }
      }
    };

    initAuth();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setSnackbar({
        open: true,
        message: "Error fetching categories",
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
    } else if (itemId === "vendors") {
      window.location.href = "/admin/vendors";
    } else if (itemId === "products") {
      window.location.href = "/admin/products";
    }
  };

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || "",
        image_url: category.image_url || "",
        sort_order: category.sort_order,
        is_active: category.is_active,
      });
    } else {
      setEditingCategory(null);
      // Get the next sort order
      const maxSortOrder =
        categories.length > 0
          ? Math.max(...categories.map((c) => c.sort_order))
          : 0;
      setFormData({
        name: "",
        description: "",
        image_url: "",
        sort_order: maxSortOrder + 1,
        is_active: true,
      });
    }

    // Clear ImageSelector when opening dialog
    setTimeout(() => {
      imageSelectorRef.current?.clearImages();
    }, 100);

    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCategory(null);
  };

  const handleSaveCategory = async () => {
    try {
      if (!formData.name.trim()) {
        setSnackbar({
          open: true,
          message: "Category name is required",
          severity: "error",
        });
        return;
      }

      setUploadingImage(true);
      let finalImageUrl = formData.image_url;

      // Upload images using ImageSelector if any are selected
      try {
        const uploadedUrls =
          (await imageSelectorRef.current?.uploadToImageKit()) || [];
        if (uploadedUrls.length > 0) {
          finalImageUrl = uploadedUrls[0]; // Use the first uploaded image
        }
      } catch (uploadError) {
        console.error("Error uploading image:", uploadError);
        setSnackbar({
          open: true,
          message: "Error uploading image to ImageKit",
          severity: "error",
        });
        setUploadingImage(false);
        return;
      }

      const categoryData = {
        name: formData.name,
        description: formData.description,
        image_url: finalImageUrl,
        sort_order: formData.sort_order,
        is_active: formData.is_active,
      };

      if (editingCategory) {
        // Update existing category
        const { error } = await supabase
          .from("categories")
          .update({
            ...categoryData,
            updated_at: new Date().toISOString(),
          })
          .eq("category_id", editingCategory.category_id);

        if (error) throw error;
        setSnackbar({
          open: true,
          message: "Category updated successfully",
          severity: "success",
        });
      } else {
        // Create new category
        const { error } = await supabase.from("categories").insert([
          {
            ...categoryData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);

        if (error) throw error;
        setSnackbar({
          open: true,
          message: "Category created successfully",
          severity: "success",
        });
      }

      handleCloseDialog();
      fetchCategories();
    } catch (error) {
      console.error("Error saving category:", error);
      setSnackbar({
        open: true,
        message: "Error saving category",
        severity: "error",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      // Check if category has products
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("product_id")
        .eq("category_id", categoryToDelete.category_id)
        .limit(1);

      if (productsError) throw productsError;

      if (products && products.length > 0) {
        setSnackbar({
          open: true,
          message:
            "Cannot delete category with existing products. Please move or delete products first.",
          severity: "error",
        });
        setDeleteConfirmOpen(false);
        setCategoryToDelete(null);
        return;
      }

      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("category_id", categoryToDelete.category_id);

      if (error) throw error;

      setSnackbar({
        open: true,
        message: "Category deleted successfully",
        severity: "success",
      });
      setDeleteConfirmOpen(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      setSnackbar({
        open: true,
        message: "Error deleting category",
        severity: "error",
      });
    }
  };

  const toggleCategoryStatus = async (category: Category) => {
    try {
      const { error } = await supabase
        .from("categories")
        .update({
          is_active: !category.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("category_id", category.category_id);

      if (error) throw error;

      setSnackbar({
        open: true,
        message: `Category ${
          !category.is_active ? "activated" : "deactivated"
        } successfully`,
        severity: "success",
      });
      fetchCategories();
    } catch (error) {
      console.error("Error updating category status:", error);
      setSnackbar({
        open: true,
        message: "Error updating category status",
        severity: "error",
      });
    }
  };

  const filteredCategories = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedCategories = filteredCategories.slice(
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
            <CategoryIcon sx={{ mr: 2, fontSize: 32 }} />
            <Box>
              <Typography
                variant="h4"
                component="h1"
                sx={{ fontWeight: "bold" }}
              >
                Categories Management
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                Manage product categories and their organization
              </Typography>
            </Box>
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
            Add New Category
          </Button>
        </Box>

        {/* Main Content */}
        <Box sx={{ p: 3 }}>
          {/* Search and Stats */}
          <Box sx={{ display: "flex", gap: 3, mb: 3, flexWrap: "wrap" }}>
            <Box sx={{ flex: 1, minWidth: 300 }}>
              <TextField
                fullWidth
                placeholder="Search categories by name or description..."
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
            </Box>
            <Box sx={{ minWidth: 200 }}>
              <Card sx={{ p: 2, textAlign: "center" }}>
                <Typography
                  variant="h6"
                  sx={{ color: THEME_COLORS.rentPrimary, fontWeight: "bold" }}
                >
                  {filteredCategories.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Categories
                </Typography>
              </Card>
            </Box>
          </Box>

          {/* Categories Table */}
          <Card>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: THEME_COLORS.tint }}>
                    <TableCell>Category</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Sort Order</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
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
                        Loading categories...
                      </TableCell>
                    </TableRow>
                  ) : paginatedCategories.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        sx={{ textAlign: "center", py: 4 }}
                      >
                        No categories found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedCategories.map((category) => (
                      <TableRow key={category.category_id} hover>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Box sx={{ mr: 2 }}>
                              {category.image_url ? (
                                <Image
                                  src={category.image_url}
                                  alt={category.name}
                                  width={50}
                                  height={50}
                                  style={{
                                    objectFit: "cover",
                                    borderRadius: "8px",
                                    border: "1px solid #e0e0e0",
                                  }}
                                />
                              ) : (
                                <Avatar
                                  sx={{
                                    width: 50,
                                    height: 50,
                                    bgcolor: THEME_COLORS.tint,
                                    color: THEME_COLORS.rentPrimary,
                                  }}
                                >
                                  <ImageIcon />
                                </Avatar>
                              )}
                            </Box>
                            <Box>
                              <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: "bold" }}
                              >
                                {category.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                ID: {category.category_id.slice(0, 8)}...
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              maxWidth: 200,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {category.description || "No description"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <DragHandleIcon
                              sx={{
                                fontSize: 16,
                                mr: 1,
                                color: "text.secondary",
                              }}
                            />
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: "bold" }}
                            >
                              {category.sort_order}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={category.is_active ? "Active" : "Inactive"}
                            color={category.is_active ? "success" : "default"}
                            size="small"
                            onClick={() => toggleCategoryStatus(category)}
                            sx={{ cursor: "pointer" }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(category.created_at).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <Tooltip title="Edit Category">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDialog(category)}
                                sx={{ color: THEME_COLORS.primary }}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Category">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setCategoryToDelete(category);
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
              count={filteredCategories.length}
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

      {/* Category Form Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingCategory ? "Edit Category" : "Add New Category"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <TextField
                  fullWidth
                  label="Category Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <TextField
                  fullWidth
                  label="Sort Order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sort_order: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </Box>
            </Box>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />

            {/* Image Upload Section */}
            <ImageSelector
              ref={imageSelectorRef}
              maxImages={1}
              folder="categories"
              tags={["category"]}
              label="Category Image"
              helperText="Select one image for this category (max 5MB)"
              size="medium"
              disabled={uploadingImage}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveCategory}
            disabled={uploadingImage}
            sx={{
              backgroundColor: THEME_COLORS.rentPrimary,
              "&:hover": {
                backgroundColor: THEME_COLORS.rentPrimaryDark,
              },
            }}
          >
            {uploadingImage
              ? "Uploading..."
              : editingCategory
              ? "Update"
              : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete category "{categoryToDelete?.name}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteCategory}
          >
            Delete
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

export default CategoriesPage;
