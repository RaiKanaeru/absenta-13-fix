# Sentry Setup Guide

## Overview
Sentry adalah platform monitoring dan error tracking yang membantu mengidentifikasi, debug, dan memonitor error dalam aplikasi secara real-time.

## Setup Sentry

### 1. Daftar Akun Sentry
1. Kunjungi [sentry.io](https://sentry.io)
2. Buat akun baru atau login
3. Buat project baru untuk aplikasi Absenta
4. Pilih platform "Node.js" untuk backend dan "React" untuk frontend

### 2. Dapatkan DSN
Setelah membuat project, Sentry akan memberikan DSN (Data Source Name) yang akan digunakan untuk konfigurasi.

### 3. Konfigurasi Environment Variables

Tambahkan ke file `.env`:

```bash
# Sentry Configuration
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
VITE_APP_VERSION=1.0.0
```

### 4. Install Dependencies

Dependencies sudah ditambahkan ke `package.json`:
- `@sentry/node` - untuk backend Node.js
- `@sentry/profiling-node` - untuk profiling backend
- `@sentry/react` - untuk frontend React
- `@sentry/profiling` - untuk profiling frontend

### 5. Konfigurasi Backend

File `backend/config/sentry.js` sudah dikonfigurasi dengan:
- Error tracking
- Performance monitoring
- Profiling
- Request tracing
- Data filtering untuk keamanan

### 6. Konfigurasi Frontend

File `src/config/sentry.ts` sudah dikonfigurasi dengan:
- Error boundary
- Performance monitoring
- Profiling
- React Router integration
- Data filtering untuk keamanan

### 7. Integrasi dengan Aplikasi

#### Backend Integration
```javascript
// server_modular.js
import { initSentry, sentryMiddleware } from './backend/config/sentry.js';

// Initialize Sentry
initSentry();

// Use middleware
app.use(sentryMiddleware.requestHandler);
app.use(sentryMiddleware.tracingHandler);
// ... your routes
app.use(sentryMiddleware.errorHandler);
```

#### Frontend Integration
```typescript
// src/main.tsx
import { initSentry } from './config/sentry';
import ErrorBoundary from './components/ErrorBoundary';

// Initialize Sentry
initSentry();

// Wrap your app with ErrorBoundary
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### 8. Penggunaan Manual

#### Backend
```javascript
import { captureException, captureMessage, addBreadcrumb } from './backend/config/sentry.js';

// Capture exception
try {
  // some code
} catch (error) {
  captureException(error, { context: 'user-action' });
}

// Capture message
captureMessage('User performed action', 'info', { userId: 123 });

// Add breadcrumb
addBreadcrumb('User clicked button', 'ui', 'info', { button: 'submit' });
```

#### Frontend
```typescript
import { useSentry } from './hooks/useSentry';

const MyComponent = () => {
  const { captureException, captureMessage, addBreadcrumb } = useSentry();

  const handleError = (error: Error) => {
    captureException(error, { component: 'MyComponent' });
  };

  const handleAction = () => {
    addBreadcrumb('User clicked button', 'ui', 'info');
    captureMessage('User performed action', 'info');
  };

  return <div>...</div>;
};
```

## Features

### 1. Error Tracking
- Automatic error capture
- Error grouping dan deduplication
- Stack trace analysis
- Error context dan user information

### 2. Performance Monitoring
- Transaction tracking
- Database query monitoring
- API endpoint performance
- Frontend performance metrics

### 3. Profiling
- CPU profiling
- Memory usage tracking
- Function call analysis
- Performance bottlenecks identification

### 4. Release Tracking
- Version tracking
- Release deployment monitoring
- Regression detection
- Feature flag integration

### 5. User Context
- User identification
- Custom tags dan context
- Breadcrumb tracking
- Session replay (optional)

## Security Considerations

### 1. Data Filtering
Sentry configuration sudah memfilter data sensitif:
- Password fields
- Authorization headers
- Cookie data
- Token information

### 2. Environment Separation
- Development: Full error reporting
- Production: Sampled error reporting
- Staging: Medium sampling rate

### 3. Data Privacy
- PII (Personally Identifiable Information) filtering
- Sensitive data redaction
- GDPR compliance ready

## Monitoring Dashboard

### 1. Error Dashboard
- Error frequency
- Error trends
- Affected users
- Error resolution status

### 2. Performance Dashboard
- Response time metrics
- Throughput analysis
- Database performance
- Frontend performance

### 3. Release Dashboard
- Deployment tracking
- Error rate per release
- Performance regression
- Feature adoption

## Best Practices

### 1. Error Handling
```javascript
// Good: Specific error handling
try {
  await processData();
} catch (error) {
  if (error.code === 'VALIDATION_ERROR') {
    // Handle validation error
  } else {
    captureException(error, { context: 'data-processing' });
  }
}

// Bad: Generic error handling
try {
  await processData();
} catch (error) {
  captureException(error); // No context
}
```

### 2. Breadcrumb Usage
```javascript
// Good: Meaningful breadcrumbs
addBreadcrumb('User started checkout process', 'checkout', 'info', {
  cartItems: cart.length,
  totalAmount: cart.total
});

// Bad: Too generic
addBreadcrumb('User clicked button', 'ui', 'info');
```

### 3. Context Setting
```javascript
// Good: Rich context
setUser({ id: user.id, username: user.username, role: user.role });
setTag('feature', 'new-checkout');
setContext('checkout', { items: cart.length, total: cart.total });

// Bad: Minimal context
setUser({ id: user.id });
```

## Troubleshooting

### 1. Common Issues

#### DSN Not Working
- Pastikan DSN benar
- Check network connectivity
- Verify project permissions

#### No Events Showing
- Check environment variables
- Verify initialization
- Check rate limiting

#### Performance Impact
- Adjust sampling rates
- Use async error reporting
- Optimize breadcrumb usage

### 2. Debug Mode
```javascript
// Enable debug mode
Sentry.init({
  debug: true,
  // ... other options
});
```

### 3. Testing
```javascript
// Test error reporting
captureException(new Error('Test error'));
captureMessage('Test message', 'info');
```

## Cost Optimization

### 1. Sampling Rates
- Production: 10% error sampling
- Development: 100% error sampling
- Staging: 50% error sampling

### 2. Data Retention
- Error events: 90 days
- Performance data: 30 days
- Profiling data: 7 days

### 3. Event Filtering
- Filter out 404 errors
- Filter out client-side errors
- Filter out development errors

## Integration dengan CI/CD

### 1. Release Tracking
```bash
# Set release version
export SENTRY_RELEASE=$(git rev-parse HEAD)

# Create release
npx @sentry/cli releases new $SENTRY_RELEASE

# Upload source maps
npx @sentry/cli releases files $SENTRY_RELEASE upload-sourcemaps ./dist

# Finalize release
npx @sentry/cli releases finalize $SENTRY_RELEASE
```

### 2. Deployment Tracking
```bash
# Track deployment
npx @sentry/cli releases deploys $SENTRY_RELEASE new -e production
```

## Advanced Features

### 1. Custom Dashboards
- Create custom dashboards
- Set up alerts
- Configure notifications

### 2. Integrations
- Slack notifications
- Email alerts
- Webhook integrations
- JIRA integration

### 3. Advanced Filtering
- Custom error filtering
- User-based filtering
- Environment-based filtering
- Feature-based filtering

## Monitoring Best Practices

### 1. Error Response
- Respond to errors quickly
- Set up proper alerting
- Create runbooks
- Document solutions

### 2. Performance Monitoring
- Set performance baselines
- Monitor trends
- Identify bottlenecks
- Optimize critical paths

### 3. User Experience
- Monitor user journeys
- Track conversion funnels
- Identify UX issues
- Measure satisfaction

## Conclusion

Sentry memberikan visibility yang komprehensif ke dalam aplikasi Absenta, membantu tim development untuk:
- Mengidentifikasi dan memperbaiki error dengan cepat
- Memonitor performance aplikasi
- Meningkatkan user experience
- Mengoptimalkan resource usage
- Mencegah error di production
