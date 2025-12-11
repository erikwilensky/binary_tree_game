# Supabase Credentials

**Keep this file secure - do NOT commit sensitive passwords!**

## Project Information

- **Project URL**: https://zihmxkuwkyqcwqrjbgoo.supabase.co
- **Project Reference**: zihmxkuwkyqcwqrjbgoo
- **Dashboard**: https://supabase.com/dashboard/project/zihmxkuwkyqcwqrjbgoo

## API Keys

### Anon/Public Key (Safe for frontend)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaG14a3V3a3lxY3dxcmpiZ29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTYzMDcsImV4cCI6MjA4MTAzMjMwN30.RyR5KRDAfL29rQGJ5V2fl6Dr0FyLJhyPUPeymCN8TV8
```

### Service Role Key (For serverless functions - get from Settings → API)
- Location: Supabase Dashboard → Settings → API → service_role key
- **WARNING**: Never expose this in frontend code!

## Database Connection

### Connection String Format
```
postgresql://postgres:[YOUR-PASSWORD]@db.zihmxkuwkyqcwqrjbgoo.supabase.co:5432/postgres
```

### To Get Your Password
1. Go to Supabase Dashboard
2. Settings → Database
3. Find "Database password" section
4. Click "Reset database password" if you don't know it
5. Copy the password

### Connection Pooling (Recommended for serverless)
```
postgresql://postgres:[YOUR-PASSWORD]@db.zihmxkuwkyqcwqrjbgoo.supabase.co:6543/postgres?pgbouncer=true
```
Port 6543 uses connection pooling (better for serverless functions)

## Environment Variables for Vercel

```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.zihmxkuwkyqcwqrjbgoo.supabase.co:5432/postgres
DATABASE_SSL=true
```

## Next Steps

1. Get your database password from Supabase dashboard
2. Run `database/supabase-schema.sql` in Supabase SQL Editor
3. Deploy to Vercel with the environment variables above
4. Update `config.js` with your Vercel API URL


