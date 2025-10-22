/**
 * Custom Login Page with default credentials
 * Pre-fills gamemaster/admin123 for development convenience
 */

import { Login, useLogin, useNotify } from 'react-admin';
import { Box, Button, Card, CardContent, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';

export const LoginPage = () => {
  const login = useLogin();
  const notify = useNotify();

  const { register, handleSubmit } = useForm({
    defaultValues: {
      username: 'gamemaster',
      password: 'admin123',
    },
  });

  const onSubmit = (data: { username: string; password: string }) => {
    void login(data).catch(() => notify('Invalid credentials', { type: 'error' }));
  };

  return (
    <Login>
      <Card sx={{ minWidth: 300, marginTop: '6em' }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            War Rooms Y - Admin
          </Typography>
          <Box
            component="form"
            onSubmit={(e) => {
              void handleSubmit(onSubmit)(e);
            }}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              mt: 2,
            }}
          >
            <TextField
              {...register('username')}
              label="Username"
              fullWidth
              autoComplete="username"
            />
            <TextField
              {...register('password')}
              label="Password"
              type="password"
              fullWidth
              autoComplete="current-password"
            />
            <Button type="submit" variant="contained" color="primary" fullWidth>
              Sign in
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Login>
  );
};
