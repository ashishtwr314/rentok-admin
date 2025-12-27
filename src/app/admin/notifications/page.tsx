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
  Avatar,
  Tooltip,
  Alert,
  Snackbar,
  InputAdornment,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Badge,
  Divider,
  CircularProgress,
  Checkbox,
  FormGroup,
  RadioGroup,
  Radio,
  FormLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
} from "@mui/material";
import { supabase } from "../../../lib/supabase";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  FilterList as FilterIcon,
  Send as SendIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  PhoneAndroid as MobileIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  History as HistoryIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  ExpandMore as ExpandMoreIcon,
  Campaign as CampaignIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { Sidebar } from "../../../components/Sidebar";

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

interface NotificationHistory {
  id: string;
  title: string;
  message: string;
  types: string[];
  target_audience: "all" | "specific";
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  status: "draft" | "sending" | "sent" | "failed" | "scheduled";
  scheduled_at?: string;
  sent_at?: string;
  created_at: string;
  created_by: string;
}

interface AppUser {
  user_id: string;
  name: string;
  email: string;
  mobile_number: string;
  is_verified: boolean;
}

const NotificationsPage = () => {
  const [activeMenuItem, setActiveMenuItem] = useState("notifications");
  const [notificationHistory, setNotificationHistory] = useState<
    NotificationHistory[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] =
    useState<NotificationHistory | null>(null);
  const [openNotificationForm, setOpenNotificationForm] = useState(false);
  const [editingNotification, setEditingNotification] =
    useState<NotificationHistory | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    types: [] as string[],
    target_audience: "all" as "all" | "specific",
    specific_users: [] as string[],
    schedule_type: "now" as "now" | "scheduled",
    scheduled_date: "",
    scheduled_time: "",
    // Email specific fields
    email_subject: "",
    email_content: "",
    // SMS specific fields
    sms_content: "",
    sms_sender: "RentOK",
    // Push notification specific fields
    push_title: "",
    push_content: "",
    push_icon: "",
    include_unsubscribed: false,
  });
  const [sending, setSending] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Initialize with empty state and fetch users
  useEffect(() => {
    // In a real implementation, you would fetch notification history from your API
    // For now, we start with an empty state
    setNotificationHistory([]);
    fetchAppUsers();
  }, []);

  const fetchAppUsers = async () => {
    try {
      setLoadingUsers(true);

      // Fetch all app users from profiles table
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, name, email, mobile_number, is_verified")
        .eq("is_verified", true)
        .order("name", { ascending: true });

      if (error) throw error;

      setAppUsers(data || []);
    } catch (error) {
      console.error("Error fetching app users:", error);
      setSnackbar({
        open: true,
        message: "Error fetching users",
        severity: "error",
      });
    } finally {
      setLoadingUsers(false);
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
    } else if (itemId === "advertisements") {
      window.location.href = "/admin/advertisements";
    }
  };

  const handleDeleteNotification = async () => {
    if (!notificationToDelete) return;

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setNotificationHistory((prev) =>
        prev.filter((n) => n.id !== notificationToDelete.id)
      );
      setSnackbar({
        open: true,
        message: "Notification deleted successfully",
        severity: "success",
      });
      setDeleteConfirmOpen(false);
      setNotificationToDelete(null);
    } catch (error) {
      console.error("Error deleting notification:", error);
      setSnackbar({
        open: true,
        message: "Error deleting notification",
        severity: "error",
      });
    }
  };

  const handleSendNotification = async () => {
    try {
      // Validate required fields
      if (!formData.title.trim()) {
        setSnackbar({
          open: true,
          message: "Title is required",
          severity: "error",
        });
        return;
      }
      if (!formData.message.trim()) {
        setSnackbar({
          open: true,
          message: "General message is required",
          severity: "error",
        });
        return;
      }
      if (formData.types.length === 0) {
        setSnackbar({
          open: true,
          message: "Please select at least one notification type",
          severity: "error",
        });
        return;
      }

      // Validate specific content for each selected type
      if (formData.types.includes("Email")) {
        if (!formData.email_subject.trim()) {
          setSnackbar({
            open: true,
            message: "Email subject is required",
            severity: "error",
          });
          return;
        }
        if (!formData.email_content.trim()) {
          setSnackbar({
            open: true,
            message: "Email content is required",
            severity: "error",
          });
          return;
        }
      }

      if (formData.types.includes("SMS")) {
        if (!formData.sms_content.trim()) {
          setSnackbar({
            open: true,
            message: "SMS content is required",
            severity: "error",
          });
          return;
        }
      }

      if (formData.types.includes("Mobile notification")) {
        if (!formData.push_title.trim()) {
          setSnackbar({
            open: true,
            message: "Push notification title is required",
            severity: "error",
          });
          return;
        }
        if (!formData.push_content.trim()) {
          setSnackbar({
            open: true,
            message: "Push notification content is required",
            severity: "error",
          });
          return;
        }
      }

      if (
        formData.schedule_type === "scheduled" &&
        (!formData.scheduled_date || !formData.scheduled_time)
      ) {
        setSnackbar({
          open: true,
          message: "Please set scheduled date and time",
          severity: "error",
        });
        return;
      }

      setSending(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // In a real implementation, you would send this data to your API
      // const response = await fetch('/api/notifications', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // })
      // const newNotification = await response.json()

      // For now, we'll just show success message without adding to history
      // setNotificationHistory(prev => [newNotification, ...prev])
      setSnackbar({
        open: true,
        message:
          formData.schedule_type === "now"
            ? "Notification sent successfully!"
            : "Notification scheduled successfully!",
        severity: "success",
      });

      setOpenNotificationForm(false);
      resetForm();
    } catch (error) {
      console.error("Error sending notification:", error);
      setSnackbar({
        open: true,
        message: "Error sending notification",
        severity: "error",
      });
    } finally {
      setSending(false);
    }
  };

  const getEstimatedRecipientCount = () => {
    switch (formData.target_audience) {
      case "all":
        return appUsers.length;
      case "specific":
        return formData.specific_users.length;
      default:
        return 0;
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      message: "",
      types: [],
      target_audience: "all",
      specific_users: [],
      schedule_type: "now",
      scheduled_date: "",
      scheduled_time: "",
      // Email specific fields
      email_subject: "",
      email_content: "",
      // SMS specific fields
      sms_content: "",
      sms_sender: "RentOK",
      // Push notification specific fields
      push_title: "",
      push_content: "",
      push_icon: "",
      include_unsubscribed: false,
    });
    setPreviewMode(false);
  };

  const handleOpenNewNotificationForm = () => {
    setEditingNotification(null);
    resetForm();
    setOpenNotificationForm(true);
  };

  const handleTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, types: [...formData.types, type] });
    } else {
      setFormData({
        ...formData,
        types: formData.types.filter((t) => t !== type),
      });
    }
  };

  // Filter notifications based on search and filters
  const filteredNotifications = notificationHistory.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !filterStatus || notification.status === filterStatus;
    const matchesType = !filterType || notification.types.includes(filterType);

    return matchesSearch && matchesStatus && matchesType;
  });

  const paginatedNotifications = filteredNotifications.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getStatusChip = (status: string) => {
    switch (status) {
      case "sent":
        return (
          <Chip
            icon={<CheckCircleIcon />}
            label="Sent"
            color="success"
            size="small"
          />
        );
      case "sending":
        return (
          <Chip
            icon={<PendingIcon />}
            label="Sending"
            color="warning"
            size="small"
          />
        );
      case "scheduled":
        return (
          <Chip
            icon={<ScheduleIcon />}
            label="Scheduled"
            color="info"
            size="small"
          />
        );
      case "failed":
        return (
          <Chip
            icon={<ErrorIcon />}
            label="Failed"
            color="error"
            size="small"
          />
        );
      case "draft":
        return <Chip label="Draft" color="default" size="small" />;
      default:
        return <Chip label={status} color="default" size="small" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Email":
        return <EmailIcon sx={{ fontSize: 16 }} />;
      case "SMS":
        return <SmsIcon sx={{ fontSize: 16 }} />;
      case "Mobile notification":
        return <MobileIcon sx={{ fontSize: 16 }} />;
      default:
        return <NotificationsIcon sx={{ fontSize: 16 }} />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSuccessRate = (notification: NotificationHistory) => {
    if (notification.recipient_count === 0) return 0;
    return Math.round(
      (notification.sent_count / notification.recipient_count) * 100
    );
  };

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
            <NotificationsIcon sx={{ mr: 2, fontSize: 32 }} />
            <Box>
              <Typography
                variant="h4"
                component="h1"
                sx={{ fontWeight: "bold" }}
              >
                Notification Management
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                Send notifications to users via Email, SMS, and Mobile push
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleOpenNewNotificationForm}
            sx={{
              backgroundColor: "rgba(255,255,255,0.2)",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.3)",
              },
            }}
          >
            Send Notification
          </Button>
        </Box>

        {/* Main Content */}
        <Box sx={{ p: 3 }}>
          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3}>
                <Box sx={{ p: 2, display: "flex", alignItems: "center" }}>
                  <CampaignIcon
                    sx={{ color: THEME_COLORS.primary, mr: 2, fontSize: 32 }}
                  />
                  <Box>
                    <Typography
                      variant="h4"
                      sx={{
                        color: THEME_COLORS.rentPrimary,
                        fontWeight: "bold",
                      }}
                    >
                      {notificationHistory.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Sent
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3}>
                <Box sx={{ p: 2, display: "flex", alignItems: "center" }}>
                  <CheckCircleIcon
                    sx={{ color: "success.main", mr: 2, fontSize: 32 }}
                  />
                  <Box>
                    <Typography
                      variant="h4"
                      sx={{ color: "success.main", fontWeight: "bold" }}
                    >
                      {
                        notificationHistory.filter((n) => n.status === "sent")
                          .length
                      }
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Delivered
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3}>
                <Box sx={{ p: 2, display: "flex", alignItems: "center" }}>
                  <ScheduleIcon
                    sx={{ color: "info.main", mr: 2, fontSize: 32 }}
                  />
                  <Box>
                    <Typography
                      variant="h4"
                      sx={{ color: "info.main", fontWeight: "bold" }}
                    >
                      {
                        notificationHistory.filter(
                          (n) => n.status === "scheduled"
                        ).length
                      }
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Scheduled
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3}>
                <Box sx={{ p: 2, display: "flex", alignItems: "center" }}>
                  <TrendingUpIcon
                    sx={{ color: "warning.main", mr: 2, fontSize: 32 }}
                  />
                  <Box>
                    <Typography
                      variant="h4"
                      sx={{ color: "warning.main", fontWeight: "bold" }}
                    >
                      {Math.round(
                        notificationHistory.reduce(
                          (acc, n) => acc + getSuccessRate(n),
                          0
                        ) / Math.max(notificationHistory.length, 1)
                      )}
                      %
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Success Rate
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
          </Grid>

          {/* Search and Filters */}
          <Card sx={{ mb: 3, p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <FilterIcon sx={{ mr: 1, color: THEME_COLORS.rentPrimary }} />
              <Typography
                variant="h6"
                sx={{ fontWeight: "bold", color: THEME_COLORS.rentPrimary }}
              >
                Search & Filters
              </Typography>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  placeholder="Search notifications by title or message..."
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

              <Grid item xs={12} md={3}>
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
                    <MenuItem value="sent">Sent</MenuItem>
                    <MenuItem value="scheduled">Scheduled</MenuItem>
                    <MenuItem value="sending">Sending</MenuItem>
                    <MenuItem value="failed">Failed</MenuItem>
                    <MenuItem value="draft">Draft</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={filterType}
                    label="Type"
                    onChange={(e) => setFilterType(e.target.value)}
                    sx={{
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: THEME_COLORS.primary,
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: THEME_COLORS.rentPrimary,
                      },
                    }}
                  >
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="Email">Email</MenuItem>
                    <MenuItem value="SMS">SMS</MenuItem>
                    <MenuItem value="Mobile notification">Mobile Push</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={1}>
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
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: "bold",
                      color: THEME_COLORS.rentPrimary,
                      textAlign: "center",
                    }}
                  >
                    {filteredNotifications.length} items
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Clear Filters Button */}
            {(searchTerm || filterStatus || filterType) && (
              <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterStatus("");
                    setFilterType("");
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
              </Box>
            )}
          </Card>

          {/* Notifications History Table */}
          <Card>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: THEME_COLORS.tint }}>
                    <TableCell>Notification</TableCell>
                    <TableCell>Types</TableCell>
                    <TableCell>Audience</TableCell>
                    <TableCell>Recipients</TableCell>
                    <TableCell>Success Rate</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        sx={{ textAlign: "center", py: 4 }}
                      >
                        Loading notifications...
                      </TableCell>
                    </TableRow>
                  ) : paginatedNotifications.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        sx={{ textAlign: "center", py: 8 }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 2,
                          }}
                        >
                          <NotificationsIcon
                            sx={{
                              fontSize: 64,
                              color: "text.secondary",
                              opacity: 0.5,
                            }}
                          />
                          <Typography variant="h6" color="text.secondary">
                            No notifications sent yet
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 2 }}
                          >
                            Start by creating and sending your first
                            notification to users
                          </Typography>
                          <Button
                            variant="contained"
                            startIcon={<SendIcon />}
                            onClick={handleOpenNewNotificationForm}
                            sx={{
                              background: `linear-gradient(135deg, ${THEME_COLORS.primary} 0%, ${THEME_COLORS.secondary} 100%)`,
                            }}
                          >
                            Send First Notification
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedNotifications.map((notification) => (
                      <TableRow key={notification.id} hover>
                        <TableCell>
                          <Box>
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: "bold", mb: 0.5 }}
                            >
                              {notification.title}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {notification.message}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}
                          >
                            {notification.types.map((type, index) => (
                              <Chip
                                key={index}
                                icon={getTypeIcon(type)}
                                label={type}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: "0.7rem" }}
                              />
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            {notification.target_audience === "all" && (
                              <GroupIcon
                                sx={{
                                  fontSize: 16,
                                  mr: 1,
                                  color: "text.secondary",
                                }}
                              />
                            )}
                            {notification.target_audience === "specific" && (
                              <PersonIcon
                                sx={{
                                  fontSize: 16,
                                  mr: 1,
                                  color: "text.secondary",
                                }}
                              />
                            )}
                            <Typography
                              variant="body2"
                              sx={{ textTransform: "capitalize" }}
                            >
                              {notification.target_audience === "all"
                                ? "All Users"
                                : notification.target_audience}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: "bold" }}
                          >
                            {notification.recipient_count.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Sent: {notification.sent_count.toLocaleString()}
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
                            <LinearProgress
                              variant="determinate"
                              value={getSuccessRate(notification)}
                              sx={{
                                width: 60,
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: "#e0e0e0",
                                "& .MuiLinearProgress-bar": {
                                  backgroundColor:
                                    getSuccessRate(notification) >= 90
                                      ? "#4caf50"
                                      : getSuccessRate(notification) >= 70
                                      ? "#ff9800"
                                      : "#f44336",
                                },
                              }}
                            />
                            <Typography
                              variant="caption"
                              sx={{ fontWeight: "bold" }}
                            >
                              {getSuccessRate(notification)}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {getStatusChip(notification.status)}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {notification.sent_at
                              ? formatDate(notification.sent_at)
                              : notification.scheduled_at
                              ? `Scheduled: ${formatDate(
                                  notification.scheduled_at
                                )}`
                              : formatDate(notification.created_at)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                sx={{ color: THEME_COLORS.primary }}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Notification">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setNotificationToDelete(notification);
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
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredNotifications.length}
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
            Are you sure you want to delete notification "
            {notificationToDelete?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteNotification}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send Notification Form Dialog */}
      <Dialog
        open={openNotificationForm}
        onClose={() => setOpenNotificationForm(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
            maxHeight: "90vh",
          },
        }}
      >
        <DialogTitle
          sx={{
            background: `linear-gradient(135deg, ${THEME_COLORS.primary} 0%, ${THEME_COLORS.secondary} 100%)`,
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <SendIcon />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Send Notification
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Compose and send notifications to your users
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0, maxHeight: "75vh", overflowY: "auto" }}>
          {/* Step-by-step form with clear sections */}
          <Box sx={{ p: 0 }}>
            {/* Step 1: Basic Information */}
            <Box
              sx={{
                p: 3,
                borderBottom: "1px solid #e0e0e0",
                backgroundColor: "#fafafa",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    backgroundColor: THEME_COLORS.rentPrimary,
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    mr: 2,
                  }}
                >
                  1
                </Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", color: THEME_COLORS.rentPrimary }}
                >
                  Basic Information
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notification Title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                    variant="outlined"
                    helperText="Enter a clear and engaging title for internal reference"
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

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="General Message"
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    required
                    multiline
                    rows={4}
                    variant="outlined"
                    helperText="Write your main notification message (will be used for all selected types unless customized below)"
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
              </Grid>
            </Box>

            {/* Step 2: Notification Types & Audience */}
            <Box sx={{ p: 3, borderBottom: "1px solid #e0e0e0" }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    backgroundColor: THEME_COLORS.rentPrimary,
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    mr: 2,
                  }}
                >
                  2
                </Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", color: THEME_COLORS.rentPrimary }}
                >
                  Notification Types & Audience
                </Typography>
              </Box>

              {/* Notification Types */}
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: "bold",
                    mb: 2,
                    color: THEME_COLORS.rentPrimary,
                  }}
                >
                  Select Notification Types *
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.types.includes("Email")}
                          onChange={(e) =>
                            handleTypeChange("Email", e.target.checked)
                          }
                          sx={{ color: THEME_COLORS.rentPrimary }}
                        />
                      }
                      label={
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <EmailIcon sx={{ mr: 1, color: "#1976d2" }} />
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: "bold" }}
                            >
                              Email
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Send via email with rich formatting
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.types.includes("SMS")}
                          onChange={(e) =>
                            handleTypeChange("SMS", e.target.checked)
                          }
                          sx={{ color: THEME_COLORS.rentPrimary }}
                        />
                      }
                      label={
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <SmsIcon sx={{ mr: 1, color: "#4caf50" }} />
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: "bold" }}
                            >
                              SMS
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Send text message to mobile phones
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.types.includes(
                            "Mobile notification"
                          )}
                          onChange={(e) =>
                            handleTypeChange(
                              "Mobile notification",
                              e.target.checked
                            )
                          }
                          sx={{ color: THEME_COLORS.rentPrimary }}
                        />
                      }
                      label={
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <MobileIcon sx={{ mr: 1, color: "#ff9800" }} />
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: "bold" }}
                            >
                              Mobile Push
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Push notification to mobile app
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Target Audience */}
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: "bold", color: THEME_COLORS.rentPrimary }}
                  >
                    Target Audience
                  </Typography>
                  <Badge
                    badgeContent={getEstimatedRecipientCount()}
                    color="primary"
                    sx={{
                      ml: 2,
                      "& .MuiBadge-badge": {
                        backgroundColor: THEME_COLORS.rentPrimary,
                        color: "white",
                        fontWeight: "bold",
                      },
                    }}
                  >
                    <GroupIcon sx={{ color: THEME_COLORS.rentPrimary }} />
                  </Badge>
                </Box>
                <RadioGroup
                  value={formData.target_audience}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      target_audience: e.target.value as any,
                    })
                  }
                >
                  <FormControlLabel
                    value="all"
                    control={<Radio sx={{ color: THEME_COLORS.rentPrimary }} />}
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                          All App Users
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Send to all registered app users
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="specific"
                    control={<Radio sx={{ color: THEME_COLORS.rentPrimary }} />}
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                          Specific Users
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Select specific users from the list
                        </Typography>
                      </Box>
                    }
                  />
                </RadioGroup>

                {formData.target_audience === "specific" && (
                  <Box sx={{ mt: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel>Select Users</InputLabel>
                      <Select
                        multiple
                        value={formData.specific_users}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            specific_users: e.target.value as string[],
                          })
                        }
                        label="Select Users"
                        renderValue={(selected) => (
                          <Box
                            sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                          >
                            {selected.map((userId) => {
                              const user = appUsers.find(
                                (u) => u.user_id === userId
                              );
                              return (
                                <Chip
                                  key={userId}
                                  label={user?.name || user?.email || userId}
                                  size="small"
                                  onDelete={() => {
                                    setFormData({
                                      ...formData,
                                      specific_users:
                                        formData.specific_users.filter(
                                          (id) => id !== userId
                                        ),
                                    });
                                  }}
                                  deleteIcon={<CloseIcon />}
                                />
                              );
                            })}
                          </Box>
                        )}
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
                      >
                        {loadingUsers ? (
                          <MenuItem disabled>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            Loading users...
                          </MenuItem>
                        ) : appUsers.length === 0 ? (
                          <MenuItem disabled>No users found</MenuItem>
                        ) : (
                          appUsers.map((user) => (
                            <MenuItem key={user.user_id} value={user.user_id}>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  width: "100%",
                                }}
                              >
                                <Avatar
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    mr: 2,
                                    fontSize: "0.8rem",
                                  }}
                                >
                                  {user.name
                                    ? user.name.charAt(0).toUpperCase()
                                    : user.email?.charAt(0).toUpperCase()}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                  <Typography
                                    variant="body2"
                                    sx={{ fontWeight: "bold" }}
                                  >
                                    {user.name || "No Name"}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {user.email || user.mobile_number}
                                  </Typography>
                                </Box>
                                {user.is_verified && (
                                  <CheckCircleIcon
                                    sx={{ color: "success.main", fontSize: 16 }}
                                  />
                                )}
                              </Box>
                            </MenuItem>
                          ))
                        )}
                      </Select>
                    </FormControl>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Step 3: Customize Content for Selected Types */}
            {formData.types.length > 0 && (
              <Box
                sx={{
                  p: 3,
                  borderBottom: "1px solid #e0e0e0",
                  backgroundColor: "#fafafa",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      backgroundColor: THEME_COLORS.rentPrimary,
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      mr: 2,
                    }}
                  >
                    3
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: "bold", color: THEME_COLORS.rentPrimary }}
                  >
                    Customize Content for Each Type
                  </Typography>
                </Box>

                {/* Email Content */}
                {formData.types.includes("Email") && (
                  <Box sx={{ mb: 4 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                      <EmailIcon sx={{ mr: 1, color: "#1976d2" }} />
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: "bold", color: "#1976d2" }}
                      >
                        Email Content
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 3 }}>
                      <TextField
                        fullWidth
                        label="Email Subject *"
                        value={formData.email_subject}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            email_subject: e.target.value,
                          })
                        }
                        required
                        helperText="Subject line for the email"
                        sx={{
                          mb: 2,
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
                      <TextField
                        fullWidth
                        label="Email Content *"
                        value={formData.email_content}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            email_content: e.target.value,
                          })
                        }
                        required
                        multiline
                        rows={4}
                        helperText="Email body content (supports HTML formatting)"
                        placeholder={
                          formData.message || "Enter email content..."
                        }
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
                    </Box>
                  </Box>
                )}

                {/* SMS Content */}
                {formData.types.includes("SMS") && (
                  <Box sx={{ mb: 4 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                      <SmsIcon sx={{ mr: 1, color: "#4caf50" }} />
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: "bold", color: "#4caf50" }}
                      >
                        SMS Content
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 3 }}>
                      <TextField
                        fullWidth
                        label="SMS Content *"
                        value={formData.sms_content}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            sms_content: e.target.value,
                          })
                        }
                        required
                        multiline
                        rows={3}
                        helperText="SMS message content (160 characters recommended)"
                        placeholder={formData.message || "Enter SMS content..."}
                        inputProps={{ maxLength: 160 }}
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
                    </Box>
                  </Box>
                )}

                {/* Push Notification Content */}
                {formData.types.includes("Mobile notification") && (
                  <Box sx={{ mb: 4 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                      <MobileIcon sx={{ mr: 1, color: "#ff9800" }} />
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: "bold", color: "#ff9800" }}
                      >
                        Push Notification Content
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 3 }}>
                      <TextField
                        fullWidth
                        label="Push Title *"
                        value={formData.push_title}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            push_title: e.target.value,
                          })
                        }
                        required
                        helperText="Title for push notification"
                        placeholder={formData.title || "Enter push title..."}
                        sx={{
                          mb: 2,
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
                      <TextField
                        fullWidth
                        label="Push Content *"
                        value={formData.push_content}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            push_content: e.target.value,
                          })
                        }
                        required
                        multiline
                        rows={3}
                        helperText="Push notification body content"
                        placeholder={
                          formData.message || "Enter push content..."
                        }
                        sx={{
                          mb: 2,
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
                      <TextField
                        fullWidth
                        label="Icon URL (Optional)"
                        value={formData.push_icon}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            push_icon: e.target.value,
                          })
                        }
                        placeholder="https://example.com/icon.png"
                        helperText="Custom icon URL for push notifications"
                        size="small"
                      />
                    </Box>
                  </Box>
                )}

                {/* Auto-fill buttons */}
                <Box
                  sx={{
                    mt: 3,
                    p: 2,
                    backgroundColor: "#f8f9fa",
                    borderRadius: 1,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 2, fontWeight: "bold" }}
                  >
                    Quick Actions:
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        const updates: any = {};
                        if (
                          formData.types.includes("Email") &&
                          !formData.email_content
                        ) {
                          updates.email_content = formData.message;
                        }
                        if (
                          formData.types.includes("SMS") &&
                          !formData.sms_content
                        ) {
                          updates.sms_content = formData.message;
                        }
                        if (
                          formData.types.includes("Mobile notification") &&
                          !formData.push_content
                        ) {
                          updates.push_content = formData.message;
                        }
                        setFormData({ ...formData, ...updates });
                      }}
                      sx={{
                        color: THEME_COLORS.rentPrimary,
                        borderColor: THEME_COLORS.rentPrimary,
                      }}
                    >
                      Use General Message for All
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        const updates: any = {};
                        if (
                          formData.types.includes("Email") &&
                          !formData.email_subject
                        ) {
                          updates.email_subject = formData.title;
                        }
                        if (
                          formData.types.includes("Mobile notification") &&
                          !formData.push_title
                        ) {
                          updates.push_title = formData.title;
                        }
                        setFormData({ ...formData, ...updates });
                      }}
                      sx={{
                        color: THEME_COLORS.rentPrimary,
                        borderColor: THEME_COLORS.rentPrimary,
                      }}
                    >
                      Use Title for Subject/Push Title
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}

            {/* Step 4: Scheduling */}
            <Box sx={{ p: 3, borderBottom: "1px solid #e0e0e0" }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    backgroundColor: THEME_COLORS.rentPrimary,
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    mr: 2,
                  }}
                >
                  4
                </Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", color: THEME_COLORS.rentPrimary }}
                >
                  Scheduling Options
                </Typography>
              </Box>

              <RadioGroup
                value={formData.schedule_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    schedule_type: e.target.value as any,
                  })
                }
              >
                <FormControlLabel
                  value="now"
                  control={<Radio sx={{ color: THEME_COLORS.rentPrimary }} />}
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        Send Immediately
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Notification will be sent right after clicking send
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="scheduled"
                  control={<Radio sx={{ color: THEME_COLORS.rentPrimary }} />}
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        Schedule for Later
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Set a specific date and time to send the notification
                      </Typography>
                    </Box>
                  }
                />
              </RadioGroup>

              {formData.schedule_type === "scheduled" && (
                <Box
                  sx={{
                    mt: 3,
                    p: 2,
                    backgroundColor: "#f8f9fa",
                    borderRadius: 1,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 2, fontWeight: "bold" }}
                  >
                    Set Schedule
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Date"
                        type="date"
                        value={formData.scheduled_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            scheduled_date: e.target.value,
                          })
                        }
                        InputLabelProps={{ shrink: true }}
                        required
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
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Time"
                        type="time"
                        value={formData.scheduled_time}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            scheduled_time: e.target.value,
                          })
                        }
                        InputLabelProps={{ shrink: true }}
                        required
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
                  </Grid>
                </Box>
              )}
            </Box>

            {/* Step 5: Additional Options */}
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    backgroundColor: THEME_COLORS.rentPrimary,
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    mr: 2,
                  }}
                >
                  5
                </Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", color: THEME_COLORS.rentPrimary }}
                >
                  Additional Options
                </Typography>
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.include_unsubscribed}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        include_unsubscribed: e.target.checked,
                      })
                    }
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked": {
                        color: THEME_COLORS.rentPrimary,
                      },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                        {
                          backgroundColor: THEME_COLORS.rentPrimary,
                        },
                    }}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                      Include users who unsubscribed from marketing
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Only enable for important system notifications (account
                      security, service updates, etc.)
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, backgroundColor: "#f8f9fa" }}>
          <Button
            onClick={() => setOpenNotificationForm(false)}
            variant="outlined"
            disabled={sending}
            sx={{
              color: THEME_COLORS.rentPrimary,
              borderColor: THEME_COLORS.rentPrimary,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSendNotification}
            disabled={sending || formData.types.length === 0}
            startIcon={sending ? <CircularProgress size={20} /> : <SendIcon />}
            sx={{
              background: `linear-gradient(135deg, ${THEME_COLORS.primary} 0%, ${THEME_COLORS.secondary} 100%)`,
              px: 4,
            }}
          >
            {sending
              ? "Sending..."
              : formData.schedule_type === "now"
              ? "Send Now"
              : "Schedule"}
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

export default NotificationsPage;
