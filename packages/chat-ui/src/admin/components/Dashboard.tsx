/**
 * Simple Dashboard for React-Admin
 */

import { Card, CardContent, Typography } from '@mui/material';

export const Dashboard = () => (
  <Card>
    <CardContent>
      <Typography variant="h4">War Rooms Y - Admin Dashboard</Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>
        Welcome to the admin panel. Use the menu to manage forces, rooms, and templates.
      </Typography>
    </CardContent>
  </Card>
);
