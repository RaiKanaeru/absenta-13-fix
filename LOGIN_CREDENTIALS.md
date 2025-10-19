# 🔐 Absenta Login Credentials

## Valid Login Credentials

### Admin Account
- **Username**: `admin123`
- **Password**: `admin123`
- **Role**: Admin
- **Access**: Full system access

### Teacher Account (if available)
- **Username**: `guru001`
- **Password**: `admin123`
- **Role**: Teacher
- **Access**: Teacher dashboard, attendance recording

### Student Account (if available)
- **Username**: `perwakilan2000`
- **Password**: `admin123`
- **Role**: Student
- **Access**: Student dashboard, schedule viewing

## How to Login

1. Open the application at: http://localhost:8081/
2. Enter the correct username and password
3. Click "Masuk" (Login)

## Troubleshooting

If you get "Invalid username or password" error:
1. Make sure you're using the correct username (case-sensitive)
2. Make sure you're using the correct password
3. Check that the backend server is running on port 3001
4. Check browser console for any network errors

## Backend Server

Make sure the backend server is running:
```bash
node scripts/maintenance/server_modern.js
```

The server should be accessible at: http://localhost:3001
