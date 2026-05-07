-- ============================================
-- Storage Bucket 和 RLS 策略设置
-- 目的：为截图上传功能创建存储桶和访问权限
-- ============================================

-- 步骤1：创建存储桶（如果不存在）
-- 使用 supabase_admin 权限绕过 RLS 检查
DO $$
BEGIN
  -- 检查存储桶是否存在
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'promotion-assets'
  ) THEN
    -- 插入存储桶记录
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'promotion-assets',
      'promotion-assets',
      true,
      5242880,  -- 5MB 限制
      ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[]
    );
    RAISE NOTICE 'Created bucket: promotion-assets';
  ELSE
    RAISE NOTICE 'Bucket promotion-assets already exists';
  END IF;
END $$;

-- 步骤2：使用 security definer 函数创建策略（绕过权限限制）
-- 先创建辅助函数
CREATE OR REPLACE FUNCTION create_storage_policy(
  policy_name text,
  bucket_id text,
  policy_action text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 删除已存在的策略
  EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_name);
  
  -- 根据操作类型创建策略
  CASE policy_action
    WHEN 'SELECT' THEN
      EXECUTE format(
        'CREATE POLICY %I ON storage.objects FOR SELECT USING (bucket_id = %L)',
        policy_name, bucket_id
      );
    WHEN 'INSERT' THEN
      EXECUTE format(
        'CREATE POLICY %I ON storage.objects FOR INSERT WITH CHECK (bucket_id = %L)',
        policy_name, bucket_id
      );
    WHEN 'UPDATE' THEN
      EXECUTE format(
        'CREATE POLICY %I ON storage.objects FOR UPDATE USING (bucket_id = %L)',
        policy_name, bucket_id
      );
    WHEN 'DELETE' THEN
      EXECUTE format(
        'CREATE POLICY %I ON storage.objects FOR DELETE USING (bucket_id = %L)',
        policy_name, bucket_id
      );
  END CASE;
  
  RAISE NOTICE 'Created policy: %', policy_name;
END;
$$;

-- 步骤3：调用函数创建策略
SELECT create_storage_policy('promotion_assets_select', 'promotion-assets', 'SELECT');
SELECT create_storage_policy('promotion_assets_insert', 'promotion-assets', 'INSERT');
SELECT create_storage_policy('promotion_assets_update', 'promotion-assets', 'UPDATE');
SELECT create_storage_policy('promotion_assets_delete', 'promotion-assets', 'DELETE');

-- 步骤4：验证创建结果
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE 'promotion_assets%'
ORDER BY policyname;
