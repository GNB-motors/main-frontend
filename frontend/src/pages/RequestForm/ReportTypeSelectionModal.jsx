import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
} from "@mui/material";
import {
  Close as CloseIcon,
  ReceiptLong as ReceiptIcon,
  Update as UpdateIcon,
} from "@mui/icons-material";
import "./ReportTypeSelectionModal.css";

const ReportTypeSelectionModal = ({ isOpen, onSelectType }) => {
  const reportTypes = [
    {
      type: "custom_trip",
      title: "Custom Trip",
      icon: <ReceiptIcon sx={{ fontSize: 48 }} />,
      description: "Upload two fuel receipts to create a trip report",
      details: "Perfect for tracking a specific journey with start and end receipts",
      color: "#3B82F6",
    },
    {
      type: "since_last_refuel",
      title: "Since Last Refuel",
      icon: <UpdateIcon sx={{ fontSize: 48 }} />,
      description: "Use your last refuel record + one new receipt",
      details: "Quick reporting using your previously saved refuel data",
      color: "#10B981",
    },
  ];

  return (
    <Dialog
      open={isOpen}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxWidth: 800,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" fontWeight="600">
            Choose Report Type
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Select how you'd like to create your fuel consumption report
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 2, pb: 3 }}>
        <Box
          display="grid"
          gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }}
          gap={3}
        >
          {reportTypes.map((reportType) => (
            <Card
              key={reportType.type}
              className="report-type-card"
              onClick={() => onSelectType(reportType.type)}
              sx={{
                cursor: "pointer",
                transition: "all 0.3s ease",
                border: "2px solid transparent",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 4,
                  borderColor: reportType.color,
                },
              }}
            >
              <CardContent sx={{ p: 3, textAlign: "center" }}>
                <Box
                  sx={{
                    display: "inline-flex",
                    p: 2,
                    borderRadius: "50%",
                    bgcolor: `${reportType.color}15`,
                    color: reportType.color,
                    mb: 2,
                  }}
                >
                  {reportType.icon}
                </Box>

                <Typography
                  variant="h6"
                  fontWeight="600"
                  gutterBottom
                  sx={{ color: reportType.color }}
                >
                  {reportType.title}
                </Typography>

                <Typography
                  variant="body1"
                  color="text.primary"
                  sx={{ mb: 1.5, fontWeight: 500 }}
                >
                  {reportType.description}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  {reportType.details}
                </Typography>

                {/* Warning for Custom Trip */}
                {reportType.type === "custom_trip" && (
                  <Box
                    sx={{
                      mt: 2,
                      p: 1.5,
                      bgcolor: "#FEF3C7",
                      borderRadius: 1,
                      border: "1px solid #F59E0B",
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Typography variant="caption" color="#92400E" fontWeight={600}>
                        ⚠️ Receipt overlap will trigger trip split
                      </Typography>
                    </Box>
                  </Box>
                )}

                <Box
                  sx={{
                    mt: 3,
                    py: 1.5,
                    px: 3,
                    borderRadius: 1,
                    bgcolor: `${reportType.color}10`,
                    color: reportType.color,
                    fontWeight: 600,
                  }}
                >
                  Select
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Box sx={{ mt: 3, p: 2, bgcolor: "#F3F4F6", borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Note:</strong> Both options will generate the same detailed
            report. The difference is in how you provide the starting fuel
            data.
          </Typography>
        </Box>
        
        <Box sx={{ mt: 2, p: 2, bgcolor: "#EFF6FF", borderRadius: 1, border: "1px solid #3B82F6" }}>
          <Typography variant="body2" color="#1E40AF">
            <strong>🆕 New Feature:</strong> When uploading a receipt that falls within an existing trip, 
            the system will automatically split the trip into two separate trips with accurate data.
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ReportTypeSelectionModal;
