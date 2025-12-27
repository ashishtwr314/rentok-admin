"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
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
  Tooltip,
  Alert,
  Snackbar,
  InputAdornment,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Switch,
  FormControlLabel,
  Badge,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Label as TagIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  FilterList as FilterIcon,
  Image as ImageIcon,
  Palette as ColorIcon,
  Sort as SortIcon,
  ContentCopy as CopyIcon,
} from "@mui/icons-material";
import { Sidebar } from "../../../components/Sidebar";
import { TagForm } from "../../../components/TagForm";
import { supabase } from "../../../lib/supabase";
import Image from "next/image";

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

interface Tag {
  tag_id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  color: string;
  is_active: boolean;
  usage_count: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const TagsPage = () => {
  const [activeMenuItem, setActiveMenuItem] = useState("tags");
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
  const [openTagForm, setOpenTagForm] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const [filterStatus, setFilterStatus] = useState("");
  const [sortBy, setSortBy] = useState("sort_order");

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Fetched tags:", data?.length || 0, "tags");
      setTags(data || []);
    } catch (error) {
      console.error("Error fetching tags:", error);
      setSnackbar({
        open: true,
        message: `Error fetching tags: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        severity: "error",
      });
      setTags([]);
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
    } else if (itemId === "categories") {
      window.location.href = "/admin/categories";
    } else if (itemId === "coupons") {
      window.location.href = "/admin/coupons";
    }
  };

  const handleDeleteTag = async () => {
    if (!tagToDelete) return;

    try {
      const { error } = await supabase
        .from("tags")
        .delete()
        .eq("tag_id", tagToDelete.tag_id);

      if (error) throw error;

      setSnackbar({
        open: true,
        message: "Tag deleted successfully",
        severity: "success",
      });
      setDeleteConfirmOpen(false);
      setTagToDelete(null);
      fetchTags();
    } catch (error) {
      console.error("Error deleting tag:", error);
      setSnackbar({
        open: true,
        message: "Error deleting tag",
        severity: "error",
      });
    }
  };

  const toggleTagStatus = async (tag: Tag) => {
    try {
      const { error } = await supabase
        .from("tags")
        .update({ is_active: !tag.is_active })
        .eq("tag_id", tag.tag_id);

      if (error) throw error;

      setSnackbar({
        open: true,
        message: `Tag ${
          !tag.is_active ? "activated" : "deactivated"
        } successfully`,
        severity: "success",
      });
      fetchTags();
    } catch (error) {
      console.error("Error updating tag status:", error);
      setSnackbar({
        open: true,
        message: "Error updating tag status",
        severity: "error",
      });
    }
  };

  const handleSaveTag = async (tagData: any) => {
    try {
      if (editingTag) {
        // Update existing tag
        const { error } = await supabase
          .from("tags")
          .update({
            ...tagData,
            updated_at: new Date().toISOString(),
          })
          .eq("tag_id", editingTag.tag_id);

        if (error) throw error;
        setSnackbar({
          open: true,
          message: "Tag updated successfully",
          severity: "success",
        });
      } else {
        // Create new tag
        const { error } = await supabase.from("tags").insert([
          {
            ...tagData,
            usage_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);

        if (error) throw error;
        setSnackbar({
          open: true,
          message: "Tag created successfully",
          severity: "success",
        });
      }

      setOpenTagForm(false);
      setEditingTag(null);
      fetchTags();
    } catch (error) {
      console.error("Error saving tag:", error);
      setSnackbar({
        open: true,
        message: "Error saving tag",
        severity: "error",
      });
    }
  };

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag);
    setOpenTagForm(true);
  };

  const copyTagSlug = (slug: string) => {
    navigator.clipboard.writeText(slug);
    setSnackbar({
      open: true,
      message: "Tag slug copied to clipboard",
      severity: "success",
    });
  };

  // Filter and sort tags
  const filteredTags = tags
    .filter((tag) => {
      const matchesSearch =
        tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tag.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tag.slug.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        !filterStatus ||
        (filterStatus === "active" && tag.is_active) ||
        (filterStatus === "inactive" && !tag.is_active);

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "usage_count":
          return b.usage_count - a.usage_count;
        case "created_at":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "sort_order":
        default:
          return a.sort_order - b.sort_order;
      }
    });

  const paginatedTags = filteredTags.slice(
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
            <TagIcon sx={{ mr: 2, fontSize: 32 }} />
            <Box>
              <Typography
                variant="h4"
                component="h1"
                sx={{ fontWeight: "bold" }}
              >
                Tags Management
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                Manage product tags and labels
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingTag(null);
              setOpenTagForm(true);
            }}
            sx={{
              backgroundColor: "rgba(255,255,255,0.2)",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.3)",
              },
            }}
          >
            Create New Tag
          </Button>
        </Box>

        {/* Main Content */}
        <Box sx={{ p: 3 }}>
          {/* Search and Filters */}
          <Card
            sx={{
              mb: 3,
              p: 3,
              borderRadius: 2,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  backgroundColor: THEME_COLORS.tint,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mr: 2,
                }}
              >
                <FilterIcon
                  sx={{ color: THEME_COLORS.rentPrimary, fontSize: 20 }}
                />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", color: THEME_COLORS.rentPrimary }}
                >
                  Search & Filters
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Find and organize your tags
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={3}>
              {/* Search Field */}
              <Grid item xs={12} md={6} lg={4}>
                <TextField
                  fullWidth
                  placeholder="Search tags by name, description, or slug..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "&:hover fieldset": {
                        borderColor: THEME_COLORS.primary,
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: THEME_COLORS.rentPrimary,
                      },
                    },
                  }}
                />
              </Grid>

              {/* Status Filter */}
              <Grid item xs={12} sm={6} md={3} lg={2}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    label="Status"
                    onChange={(e) => setFilterStatus(e.target.value)}
                    sx={{
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: THEME_COLORS.primary,
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: THEME_COLORS.rentPrimary,
                      },
                    }}
                  >
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Sort By */}
              <Grid item xs={12} sm={6} md={3} lg={2}>
                <FormControl fullWidth>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    label="Sort By"
                    onChange={(e) => setSortBy(e.target.value)}
                    sx={{
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: THEME_COLORS.primary,
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: THEME_COLORS.rentPrimary,
                      },
                    }}
                  >
                    <MenuItem value="sort_order">Sort Order</MenuItem>
                    <MenuItem value="name">Name</MenuItem>
                    <MenuItem value="usage_count">Usage Count</MenuItem>
                    <MenuItem value="created_at">Date Created</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Results Counter */}
              <Grid item xs={12} sm={12} md={6} lg={2}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "56px",
                    backgroundColor: THEME_COLORS.tint,
                    borderRadius: 1,
                    border: `1px solid ${THEME_COLORS.primary}`,
                    px: 2,
                    minWidth: 120,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: "bold",
                      color: THEME_COLORS.rentPrimary,
                      textAlign: "center",
                      fontSize: "0.875rem",
                    }}
                  >
                    {filteredTags.length} / {tags.length}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Action Buttons */}
            <Box
              sx={{
                mt: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={fetchTags}
                  disabled={loading}
                  sx={{
                    color: THEME_COLORS.rentPrimary,
                    borderColor: THEME_COLORS.rentPrimary,
                    "&:hover": {
                      backgroundColor: THEME_COLORS.tint,
                      borderColor: THEME_COLORS.rentPrimaryDark,
                    },
                  }}
                >
                  {loading ? "Refreshing..." : "Refresh Data"}
                </Button>
              </Box>

              {(searchTerm || filterStatus) && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterStatus("");
                    setPage(0);
                  }}
                  sx={{
                    color: THEME_COLORS.rentPrimary,
                    borderColor: THEME_COLORS.rentPrimary,
                    "&:hover": {
                      backgroundColor: THEME_COLORS.tint,
                      borderColor: THEME_COLORS.rentPrimaryDark,
                    },
                  }}
                >
                  Clear All Filters
                </Button>
              )}
            </Box>
          </Card>

          {/* Tags Table */}
          <Card
            sx={{
              borderRadius: 2,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                p: 3,
                borderBottom: "1px solid #e0e0e0",
                backgroundColor: THEME_COLORS.tint,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <TagIcon sx={{ mr: 1, color: THEME_COLORS.rentPrimary }} />
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: "bold", color: THEME_COLORS.rentPrimary }}
                  >
                    Tags List
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {filteredTags.length} of {tags.length} tags
                </Typography>
              </Box>
            </Box>

            <TableContainer component={Paper} sx={{ boxShadow: "none" }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f8f9fa" }}>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        color: THEME_COLORS.rentPrimary,
                      }}
                    >
                      Tag
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        color: THEME_COLORS.rentPrimary,
                      }}
                    >
                      Description
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        color: THEME_COLORS.rentPrimary,
                      }}
                    >
                      Usage
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        color: THEME_COLORS.rentPrimary,
                      }}
                    >
                      Sort Order
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        color: THEME_COLORS.rentPrimary,
                      }}
                    >
                      Status
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        color: THEME_COLORS.rentPrimary,
                      }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        sx={{ textAlign: "center", py: 4 }}
                      >
                        Loading tags...
                      </TableCell>
                    </TableRow>
                  ) : paginatedTags.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        sx={{ textAlign: "center", py: 4 }}
                      >
                        No tags found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedTags.map((tag) => (
                      <TableRow key={tag.tag_id} hover>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Box sx={{ mr: 2, position: "relative" }}>
                              {tag.image_url ? (
                                <Image
                                  src={tag.image_url}
                                  alt={tag.name}
                                  width={48}
                                  height={48}
                                  style={{
                                    objectFit: "cover",
                                    borderRadius: "12px",
                                    border: "2px solid #e0e0e0",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                  }}
                                />
                              ) : (
                                <Avatar
                                  sx={{
                                    width: 48,
                                    height: 48,
                                    bgcolor: tag.color,
                                    color: "white",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                    border: "2px solid #e0e0e0",
                                  }}
                                >
                                  <TagIcon />
                                </Avatar>
                              )}
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  fontWeight: "bold",
                                  mb: 0.5,
                                  color: THEME_COLORS.rentPrimary,
                                }}
                              >
                                {tag.name}
                              </Typography>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <Tooltip title="Copy slug">
                                  <IconButton
                                    size="small"
                                    onClick={() => copyTagSlug(tag.slug)}
                                    sx={{
                                      color: THEME_COLORS.primary,
                                      "&:hover": {
                                        backgroundColor: THEME_COLORS.tint,
                                      },
                                    }}
                                  >
                                    <CopyIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ fontFamily: "monospace" }}
                                >
                                  {tag.slug}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {tag.description || "No description"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                backgroundColor:
                                  tag.usage_count > 0
                                    ? THEME_COLORS.primary
                                    : "#e0e0e0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                                fontWeight: "bold",
                                fontSize: "0.8rem",
                              }}
                            >
                              {tag.usage_count}
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {tag.usage_count === 0
                                ? "Not used"
                                : tag.usage_count === 1
                                ? "1 product"
                                : `${tag.usage_count} products`}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              backgroundColor: THEME_COLORS.tint,
                              border: `2px solid ${THEME_COLORS.primary}`,
                              color: THEME_COLORS.rentPrimary,
                              fontWeight: "bold",
                              fontSize: "0.9rem",
                            }}
                          >
                            {tag.sort_order}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={tag.is_active ? "Active" : "Inactive"}
                            color={tag.is_active ? "success" : "default"}
                            size="small"
                            onClick={() => toggleTagStatus(tag)}
                            sx={{
                              cursor: "pointer",
                              fontWeight: "bold",
                              "&:hover": {
                                transform: "scale(1.05)",
                                transition: "transform 0.2s",
                              },
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                sx={{
                                  color: THEME_COLORS.primary,
                                  "&:hover": {
                                    backgroundColor: THEME_COLORS.tint,
                                    transform: "scale(1.1)",
                                  },
                                }}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit Tag">
                              <IconButton
                                size="small"
                                onClick={() => handleEditTag(tag)}
                                sx={{
                                  color: THEME_COLORS.rentPrimary,
                                  "&:hover": {
                                    backgroundColor: THEME_COLORS.tint,
                                    transform: "scale(1.1)",
                                  },
                                }}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Tag">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setTagToDelete(tag);
                                  setDeleteConfirmOpen(true);
                                }}
                                sx={{
                                  color: "error.main",
                                  "&:hover": {
                                    backgroundColor: "#ffebee",
                                    transform: "scale(1.1)",
                                  },
                                }}
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
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredTags.length}
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete tag "{tagToDelete?.name}"? This
            action cannot be undone.
            {tagToDelete?.usage_count > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                This tag is currently used by {tagToDelete.usage_count}{" "}
                products. Deleting it will remove the tag from all products.
              </Alert>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteTag}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tag Form Dialog */}
      <TagForm
        open={openTagForm}
        onClose={() => {
          setOpenTagForm(false);
          setEditingTag(null);
        }}
        onSave={handleSaveTag}
        editingTag={editingTag}
        loading={loading}
      />

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

export default TagsPage;
