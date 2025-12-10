import React from "react";
import { Drawer, Box, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface RightDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: number | string;
}

const RightDrawer: React.FC<RightDrawerProps> = ({
  open,
  onClose,
  title,
  children,
  width = 500,
}) => {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        "& .MuiDrawer-paper": {
          width: width,
          maxWidth: "100%",
          boxSizing: "border-box",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 2,
            borderBottom: "1px solid #E0E0E0",
            backgroundColor: "#F5F7FF",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "#3B5CFF",
            }}
          >
            {title}
          </Typography>
          <IconButton
            onClick={onClose}
            sx={{
              color: "#666",
              "&:hover": {
                backgroundColor: "#E0E0E0",
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Content */}
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            p: 2,
          }}
        >
          {children}
        </Box>
      </Box>
    </Drawer>
  );
};

export default RightDrawer;
