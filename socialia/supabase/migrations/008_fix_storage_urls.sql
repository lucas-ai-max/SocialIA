-- Corrige URLs antigas do Supabase Storage que foram salvas sem o segmento "/public/".
-- O endpoint "/storage/v1/object/<bucket>/..." exige JWT; para <img src> o correto
-- e "/storage/v1/object/public/<bucket>/...". Reparamos aqui em profiles.profile_photo_url
-- e brand_profiles.brand_logo_url.
UPDATE public.profiles
SET profile_photo_url = replace(profile_photo_url, '/storage/v1/object/', '/storage/v1/object/public/')
WHERE profile_photo_url LIKE '%/storage/v1/object/%'
  AND profile_photo_url NOT LIKE '%/storage/v1/object/public/%'
  AND profile_photo_url NOT LIKE '%/storage/v1/object/sign/%';

UPDATE public.brand_profiles
SET brand_logo_url = replace(brand_logo_url, '/storage/v1/object/', '/storage/v1/object/public/')
WHERE brand_logo_url LIKE '%/storage/v1/object/%'
  AND brand_logo_url NOT LIKE '%/storage/v1/object/public/%'
  AND brand_logo_url NOT LIKE '%/storage/v1/object/sign/%';
