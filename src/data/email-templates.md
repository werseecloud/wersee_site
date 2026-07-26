# Supabase Email Templates for Wersee

Copy and paste these into your Supabase Dashboard under **Authentication > Email Templates**.

## 1. Confirm Signup
**Subject:** Confirm your signup on Wersee
**Content:**
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1d1d1f; background-color: #f5f5f7; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.04); }
    .header { background: #050505; padding: 40px; text-align: center; }
    .content { padding: 40px; }
    .button { display: inline-block; padding: 16px 32px; background: #050505; color: #ffffff !important; text-decoration: none; border-radius: 14px; font-weight: 600; margin: 24px 0; }
    .footer { padding: 24px; text-align: center; font-size: 12px; color: #86868b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/business_logos/a1e58d3a96480df827eafe98567353d2-removebg-preview.png" width="40" height="40" alt="Wersee">
    </div>
    <div class="content">
      <h2>Welcome to Wersee!</h2>
      <p>Thanks for signing up. Please confirm your email address to activate your account and start exploring the future of digital commerce.</p>
      <a href="{{ .ConfirmationURL }}" class="button">Confirm Email Address</a>
      <p>If you didn't sign up for Wersee, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      &copy; 2026 Wersee Inc. All rights reserved.
    </div>
  </div>
</body>
</html>
```

## 2. Reset Password
**Subject:** Reset your Wersee password
**Content:**
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1d1d1f; background-color: #f5f5f7; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.04); }
    .header { background: #050505; padding: 40px; text-align: center; }
    .content { padding: 40px; }
    .button { display: inline-block; padding: 16px 32px; background: #050505; color: #ffffff !important; text-decoration: none; border-radius: 14px; font-weight: 600; margin: 24px 0; }
    .footer { padding: 24px; text-align: center; font-size: 12px; color: #86868b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/business_logos/a1e58d3a96480df827eafe98567353d2-removebg-preview.png" width="40" height="40" alt="Wersee">
    </div>
    <div class="content">
      <h2>Reset Password</h2>
      <p>We received a request to reset your password. Click the button below to choose a new one.</p>
      <a href="{{ .ConfirmationURL }}" class="button">Reset Password</a>
      <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
    </div>
    <div class="footer">
      &copy; 2026 Wersee Inc. All rights reserved.
    </div>
  </div>
</body>
</html>
```

## 3. Magic Link
**Subject:** Your Wersee Login Link
**Content:**
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1d1d1f; background-color: #f5f5f7; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.04); }
    .header { background: #050505; padding: 40px; text-align: center; }
    .content { padding: 40px; }
    .button { display: inline-block; padding: 16px 32px; background: #050505; color: #ffffff !important; text-decoration: none; border-radius: 14px; font-weight: 600; margin: 24px 0; }
    .footer { padding: 24px; text-align: center; font-size: 12px; color: #86868b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/business_logos/a1e58d3a96480df827eafe98567353d2-removebg-preview.png" width="40" height="40" alt="Wersee">
    </div>
    <div class="content">
      <h2>Login to Wersee</h2>
      <p>Click the button below to log in to your account. This link will expire shortly.</p>
      <a href="{{ .ConfirmationURL }}" class="button">Log In to Wersee</a>
      <p>If you didn't request this link, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      &copy; 2026 Wersee Inc. All rights reserved.
    </div>
  </div>
</body>
</html>
```

## 4. Change Email Address
**Subject:** Confirm your new email address on Wersee
**Content:**
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1d1d1f; background-color: #f5f5f7; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.04); }
    .header { background: #050505; padding: 40px; text-align: center; }
    .content { padding: 40px; }
    .button { display: inline-block; padding: 16px 32px; background: #050505; color: #ffffff !important; text-decoration: none; border-radius: 14px; font-weight: 600; margin: 24px 0; }
    .footer { padding: 24px; text-align: center; font-size: 12px; color: #86868b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/business_logos/a1e58d3a96480df827eafe98567353d2-removebg-preview.png" width="40" height="40" alt="Wersee">
    </div>
    <div class="content">
      <h2>Confirm Email Change</h2>
      <p>You requested to change your email address. Please click the button below to confirm the new address.</p>
      <a href="{{ .ConfirmationURL }}" class="button">Confirm New Email</a>
      <p>If you didn't request this change, please contact support immediately.</p>
    </div>
    <div class="footer">
      &copy; 2026 Wersee Inc. All rights reserved.
    </div>
  </div>
</body>
</html>
```
