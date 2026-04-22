-- A migration 001 criou apenas politicas de SELECT e INSERT para 'generated-images'.
-- Uploads com upsert=true (ex: foto de perfil, logotipo) caem em UPDATE quando o
-- arquivo ja existe, e sem politica de UPDATE a operacao falha. DELETE tambem e
-- util para permitir remocao explicita (ex: "Remover logo").

DROP POLICY IF EXISTS "Usuarios atualizam imagens geradas" ON storage.objects;
CREATE POLICY "Usuarios atualizam imagens geradas" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'generated-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'generated-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Usuarios deletam imagens geradas" ON storage.objects;
CREATE POLICY "Usuarios deletam imagens geradas" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'generated-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
