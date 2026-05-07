-- ============================================
-- 工具状态流转完善：增加下线原因字段
-- ============================================

-- 新增下线原因字段
ALTER TABLE tools ADD COLUMN IF NOT EXISTS offline_reason TEXT;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS offline_reason_type TEXT; -- 'developer_offline' | 'admin_forced'

-- 更新 CHECK 约束（增加 offline / forced_offline 状态）
DROP CONSTRAINT IF EXISTS tools_status_check;
ALTER TABLE tools ADD CONSTRAINT tools_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'offline', 'forced_offline'));

-- 给拒绝申请增加原因字段（如果还没有的话）
ALTER TABLE tools ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 更新 RLS 策略：开发者仍然能查看自己被拒绝/下架的工具（用于重新提交）
-- 现有的 "开发者管理自己的工具" 策略已经是 ALL，保留不变

-- 允许公开读取所有非 pending 状态的工具（审核中和已上线的都可见）
-- 但只显示给登录用户自己看的字段由 RLS 控制
DROP POLICY IF EXISTS "公开读取已审核工具" ON tools;
CREATE POLICY "公开读取非待审核工具" ON tools FOR SELECT
  USING (
    status != 'pending'
    OR auth.uid() = developer_id
  );
