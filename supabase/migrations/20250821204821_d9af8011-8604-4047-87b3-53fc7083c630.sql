-- Storage policies for verification-documents bucket
-- Allow authenticated users to fully manage files within their own user-id folder
create policy "Users can upload to their folder (verification-documents)"
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'verification-documents'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can read their folder (verification-documents)"
on storage.objects
for select to authenticated
using (
  bucket_id = 'verification-documents'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can update their folder (verification-documents)"
on storage.objects
for update to authenticated
using (
  bucket_id = 'verification-documents'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'verification-documents'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can delete their folder (verification-documents)"
on storage.objects
for delete to authenticated
using (
  bucket_id = 'verification-documents'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow admins to fully manage the entire bucket
create policy "Admins can manage verification-documents"
on storage.objects
for all to authenticated
using (
  bucket_id = 'verification-documents'
  and public.get_current_user_role() in ('admin','super_admin')
)
with check (
  bucket_id = 'verification-documents'
  and public.get_current_user_role() in ('admin','super_admin')
);

-- Allow anonymous users to upload to the verification/ prefix (used during pre-auth registration)
create policy "Anon can upload verification prefix"
on storage.objects
for insert to anon
with check (
  bucket_id = 'verification-documents'
  and position('verification/' in name) = 1
);
