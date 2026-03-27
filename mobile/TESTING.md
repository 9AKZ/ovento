# Mobile App - Testing Guide

## ✅ Pre-Testing Checklist

- [ ] Backend server is running: `npm start` from `AdelBackend-main/`
- [ ] Backend port: `4000`
- [ ] Mobile IP configured in `.env.local`
- [ ] Dependencies installed: `npm install` in mobile/
- [ ] No lint errors: `npm run lint`

## 🧪 Test Scenarios

### 1. Fresh Login

**Steps:**
1. Start the app
2. Click "Se connecter"
3. Enter test credentials:
   - Email: `test@example.com`
   - Password: `password123`
4. Click "Se connecter"

**Expected:**
- ✓ Login button shows loading spinner
- ✓ On success: Redirects to home screen
- ✓ Events list loads
- ✓ User data persists on app restart

**If Login Fails:**
- Check backend logs for errors
- Verify user exists in database
- Test credentials with web client first

### 2. Registration

**Steps:**
1. From login screen, click "Créer un compte"
2. Fill registration form:
   - Nom complet: `Jean Test`
   - Email: `jean@example.com`
   - Mot de passe: `password123`
   - Confirmer mot de passe: `password123`
3. Click "Créer un compte"

**Expected:**
- ✓ Form validates fields
- ✓ Password confirmation validation
- ✓ Minimum length validation (6 chars)
- ✓ On success: Logged in and redirected to home
- ✓ New user appears in backend database

**Validation Tests:**
- Missing fields → Alert: "Veuillez remplir tous les champs"
- Password mismatch → Alert: "Les mots de passe ne correspondent pas"
- Short password → Alert: "au moins 6 caractères"

### 3. Home Screen

**Steps:**
1. Login successfully
2. Observe home screen

**Expected:**
- ✓ Events list displayed
- ✓ Event count shows correctly
- ✓ Each event card shows:
  - Event image (if available)
  - Title
  - Date (formatted as DD/MM/YYYY)
  - Location
  - Participant count (current/capacity)
  - Price (or "Gratuit")
- ✓ Pull-to-refresh works

### 4. Event Details

**Steps:**
1. From home screen, tap an event
2. View event details

**Expected:**
- ✓ Navigation works
- ✓ Event details display correctly
- ✓ Join/Leave button appears
- ✓ User can interact with event

### 5. Token Refresh

**Steps:**
1. Login successfully
2. Wait for token to expire (or manually clear in debug)
3. Make API request
4. App should handle refresh automatically

**Expected:**
- ✓ Automatic token refresh (401 response triggers refresh)
- ✓ Request is retried with new token
- ✓ User stays logged in
- ✓ If refresh fails: User sent to login screen

### 6. Session Persistence

**Steps:**
1. Login successfully
2. Close and reopen app
3. Verify user is still logged in

**Expected:**
- ✓ Auth state persists
- ✓ User session restored from AsyncStorage
- ✓ No need to login again

### 7. Logout

**Steps:**
1▪ Login successfully
2. (Add logout button if not present)
3. Click logout

**Expected:**
- ✓ AsyncStorage cleared
- ✓ User state cleared
- ✓ Redirects to login screen
- ✓ Cannot access home screen without login

## 🔍 Debug Mode

### View Network Requests

Add to `services/api.ts` in request interceptor:

```typescript
console.log('Request:', config.url, config.method);
```

Add to response interceptor:

```typescript
console.log('Response:', response.status, response.data);
```

### Check AsyncStorage

In dev tools or async storage viewer:

```
accessToken: "eyJhbGciOiJIUzI1NiIs..."
refreshToken: "..." 
user: { id: "...", email: "...", ... }
```

### Monitor Logs

Open terminal and watch for errors:

```bash
# In VS Code terminal from mobile directory
npm start
# Then press 'j' for web to see logs, or use Expo Go app logs
```

## 📊 Performance Metrics

### Expected Load Times

- Login: 1-2s
- Register: 1-2s
- Events list: 1-3s (depending on event count)
- Event details: <1s (cached)
- Pull-to-refresh: 1-2s

### React Query Caching

- **Stale time**: 5 minutes (auto-revalidate)
- **Cache time**: 10 minutes (keep in memory)
- **Retries**: 1 automatic retry on failure

## 🐛 Common Issues & Solutions

### Issue: "Network Error"

**Cause**: Backend not reachable
**Solution**:
1. Check backend is running
2. Verify IP address is correct
3. Test: `curl http://YOUR_IP:4000/api/events`

### Issue: "Unauthorized" on every request

**Cause**: Token not being sent or invalid
**Solution**:
1. Check AsyncStorage has `accessToken`
2. Verify token format (should start with "ey")
3. Check backend secret matches

### Issue: Events don't load

**Cause**: API returns invalid data
**Solution**:
1. Check backend logs
2. Inspect network request in Expo dev tools
3. Verify events exist in database

### Issue: App crashes on login

**Cause**: Unexpected response format
**Solution**:
1. Add error boundaries
2. Check backend response schema
3. Verify authService parsing

### Issue: Token refresh fails

**Cause**: Refresh token invalid or expired
**Solution**:
1. Clear AsyncStorage and re-login
2. Check refresh endpoint on backend
3. Verify token storage

## 🚀 Performance Optimization

### Implemented

- ✓ React Query caching
- ✓ Stale time management
- ✓ Automatic retries
- ✓ Token refresh interceptors

### To Consider

- [ ] Image caching
- [ ] Virtual lists for large event lists
- [ ] Search/filter optimization
- [ ] Offline support
- [ ] Biometric auth
- [ ] Background sync

## 📝 Test Reports Template

```markdown
## Test Report: [Date]

### Environment
- Backend URL: http://[IP]:4000/api
- Device: [iOS/Android]
- App Version: [Version]

### Passed Tests
- [ ] Login
- [ ] Register
- [ ] Home Screen
- [ ] Event Details
- [ ] Token Refresh
- [ ] Session Persistence

### Failed Tests
- Test: [Description]
  - Error: [Error message]
  - Steps to reproduce: [Steps]
  - Expected: [Expected behavior]
  - Actual: [Actual behavior]

### Issues
- Issue #1: [Description]
- Issue #2: [Description]

### Notes
[Any additional observations]
```

## 🎯 Next Steps After Testing

1. ✓ All tests pass → Deploy to production
2. Test on real device
3. Get user feedback
4. Monitor error logs
5. Iterate on improvements
