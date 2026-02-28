# Edge Functions

## create-user

Creates new auth users (admin only). Used by the Add User form.

### Deploy

```bash
supabase functions deploy create-user
```

### Settings (Supabase Dashboard)

1. Go to **Edge Functions** → **create-user** → **Settings**
2. Turn **OFF** "Enforce JWT Verification" (the function validates the user token itself)
3. Save

### Secrets

The function uses `SUPABASE_SERVICE_ROLE_KEY` which is automatically available in deployed functions. No extra setup needed.
