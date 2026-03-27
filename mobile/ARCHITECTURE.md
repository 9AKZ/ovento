# Mobile App - Architecture Update

## 🎯 What's Changed

The mobile authentication system has been completely overhauled to match the robust architecture of the web client:

### ✨ Key Improvements

1. **React Query Integration**
   - Replaces custom state management with TanStack Query
   - Better caching, refetching, and error handling
   - Consistent with the web client architecture
   - Automatic retry logic and stale time management

2. **AuthContext Provider**
   - New `AuthProvider` wraps the entire app
   - Centralized authentication state management
   - Integrated with React Query for mutations
   - Better error handling and user feedback

3. **Enhanced Mutations**
   - `loginMutation`: Handles login with proper error messages
   - `registerMutation`: Handles registration with validation
   - `logoutMutation`: Handles logout with cleanup
   - All mutations properly integrated with AsyncStorage

4. **Improved API Configuration**
   - Environment variable support via `EXPO_PUBLIC_API_URL`
   - Better timeout handling (15s instead of 10s)
   - Consistent with backend routes prefixed with `/api`

5. **Better Error Handling**
   - Proper error messages from server responses
   - User-friendly Alert notifications
   - Error state in mutations for UI feedback

## 🚀 Getting Started

### 1. Setup Environment

Create a `.env.local` file in the mobile directory:

```env
EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:4000/api
```

Replace `YOUR_COMPUTER_IP` with your actual IP address (e.g., `192.168.1.16`).

### 2. Install Dependencies

```bash
cd mobile
npm install
```

### 3. Start the App

```bash
npm start
```

Then choose:
- `i` for iOS simulator
- `a` for Android emulator
- `j` for Expo Go on your phone

## 📱 Usage

### Authentication Flow

1. **Login Screen** (`app/auth/login.tsx`)
   ```tsx
   const { user, isLoading, loginMutation } = useAuth();
   
   // Trigger login
   await loginMutation.mutateAsync({ email, password });
   ```

2. **Register Screen** (`app/auth/register.tsx`)
   ```tsx
   const { user, isLoading, registerMutation } = useAuth();
   
   // Trigger registration
   await registerMutation.mutateAsync({ email, password, fullName });
   ```

3. **Protected Routes**
   - Home screen (`app/index.tsx`) checks if user is logged in
   - Automatically redirects to login if not authenticated

### Using the Auth Hook

In any component wrapped by `AuthProvider`:

```tsx
import { useAuth } from '@/hooks/useAuthContext';

export function MyComponent() {
  const { user, isLoading, loginMutation, logoutMutation } = useAuth();
  
  if (isLoading) return <LoadingSpinner />;
  if (!user) return <LoginPrompt />;
  
  return <UserDashboard />;
}
```

## 🔄 Token Management

- Access tokens are stored in `AsyncStorage`
- Refresh tokens are automatically handled by interceptors
- 401 responses trigger automatic token refresh
- On failure, user is redirected to login

## 📁 File Structure

```
mobile/
├── app/
│   ├── auth/
│   │   ├── login.tsx          (Login screen)
│   │   └── register.tsx       (Register screen)
│   ├── index.tsx              (Home screen)
│   └── _layout.tsx            (Root layout with providers)
├── hooks/
│   ├── useAuthContext.tsx     (NEW: Auth context hook with React Query)
│   ├── useEvents.ts           (Events hook with React Query)
│   └── useAuth.ts             (OLD: Legacy - can be removed)
├── services/
│   ├── api.ts                 (Axios instance with interceptors)
│   ├── authService.ts         (Auth API calls)
│   └── eventService.ts        (Events API calls)
├── lib/
│   └── queryClient.ts         (React Query client setup)
├── .env.example               (Environment variables template)
└── package.json
```

## 🔧 Configuration

### Changing Backend URL

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Update `EXPO_PUBLIC_API_URL` with your backend URL:
   ```env
   EXPO_PUBLIC_API_URL=http://192.168.1.16:4000/api
   ```

3. Restart Expo: Press `r` in the terminal

### Building for Production

```bash
eas build --platform ios
eas build --platform android
```

## 📝 API Endpoints

All requests are automatically prefixed with `/api`:

- **POST** `/auth/login` - Login
- **POST** `/auth/register` - Register
- **POST** `/auth/logout` - Logout
- **GET** `/auth/me` - Get current user
- **POST** `/auth/refresh` - Refresh token
- **GET** `/events` - List events
- **GET** `/events/:id` - Get event details
- **POST** `/events` - Create event
- **POST** `/events/:id/inscriptions` - Join event
- **DELETE** `/events/:id/inscriptions` - Leave event

## 🐛 Troubleshooting

### Backend Connection Failed
- Ensure backend is running: `npm start` from `AdelBackend-main`
- Check your IP address: Open Command Prompt and run `ipconfig`
- Verify `EXPO_PUBLIC_API_URL` is set correctly
- Test with: `curl http://YOUR_IP:4000/api/health`

### Authentication Failed
- Check backend logs for errors
- Verify user credentials are correct
- Check if backend auth endpoints are working

### Stale Cache Issues
- Pull down to refresh
- React Query has 5-minute stale time by default
- Manually refetch with mutation results

## 🎓 Architecture Comparison

| Aspect | Web Client | Mobile (Updated) |
|--------|-----------|-----------------|
| State Management | React Query + Context | React Query + Context ✓ |
| Auth Mutations | useMutation hooks | useMutation hooks ✓ |
| Error Handling | Toast notifications | Alert notifications ✓ |
| Token Storage | localStorage | AsyncStorage ✓ |
| API Interceptors | Fetch with headers | Axios interceptors ✓ |
| Validation | Zod schemas | Service-level ✓ |

## 📚 Next Steps

1. Test login/register flows
2. Verify events load correctly
3. Test event creation and participation
4. Add logout button to UI
5. Implement refresh token rotation
6. Add biometric authentication

## 🆘 Need Help?

Check the following files for examples:
- `app/auth/login.tsx` - Login implementation
- `app/auth/register.tsx` - Register implementation  
- `hooks/useAuthContext.tsx` - Auth context setup
- `services/authService.ts` - Auth API service
