# Wersee STRATO storage gateway

This package is deployed to `/api.wersee.com`.

```text
/api.wersee.com/
  .htaccess
  .user.ini
  config.php
  index.php
  storage/
    public/
    private/
    temp/
```

`config.php` is generated during deployment and must never be committed.
The gateway validates Supabase bearer tokens and performs metadata operations
with the caller's token so database RLS remains the authorization boundary.

During the hybrid migration, new gateway uploads use STRATO while existing
objects remain readable from Supabase until their checksum-verified backfill.
