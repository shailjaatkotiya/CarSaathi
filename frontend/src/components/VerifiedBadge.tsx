import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import { Chip } from "@mui/material";

export default function VerifiedBadge({ verified }: { verified: boolean }) {
  return (
    <Chip
      size="small"
      icon={<VerifiedRoundedIcon />}
      label={verified ? "Verified" : "Pending"}
      color={verified ? "primary" : "warning"}
      variant={verified ? "filled" : "outlined"}
      sx={{ height: 28 }}
    />
  );
}
