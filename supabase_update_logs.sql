-- 업데이트 로그 테이블 (Supabase SQL Editor에서 실행)
-- 관리자가 웹에서 직접 추가/수정/삭제하는 패치 노트용

CREATE TABLE IF NOT EXISTS update_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  "desc" text NOT NULL,
  font_size smallint NOT NULL DEFAULT 11 CHECK (font_size >= 1 AND font_size <= 30),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS 활성화
ALTER TABLE update_logs ENABLE ROW LEVEL SECURITY;

-- 모든 사용자: 조회만 허용
CREATE POLICY "update_logs_select" ON update_logs
  FOR SELECT USING (true);

-- 관리자(profiles.role = 'admin')만 추가/수정/삭제
CREATE POLICY "update_logs_insert_admin" ON update_logs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "update_logs_update_admin" ON update_logs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "update_logs_delete_admin" ON update_logs
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- [기존 테이블에 font_size를 숫자로 바꾼 경우] 아래 한 번만 실행:
-- ALTER TABLE update_logs ADD COLUMN IF NOT EXISTS font_size_new smallint DEFAULT 11;
-- UPDATE update_logs SET font_size_new = CASE
--   WHEN font_size::text IN ('small','medium','large') THEN 11
--   ELSE LEAST(30, GREATEST(1, (font_size::text)::int)) END
--   WHERE font_size IS NOT NULL;
-- ALTER TABLE update_logs DROP COLUMN font_size;
-- ALTER TABLE update_logs RENAME COLUMN font_size_new TO font_size;
-- ALTER TABLE update_logs ADD CONSTRAINT update_logs_font_size_check CHECK (font_size >= 1 AND font_size <= 30);

-- (선택) 초기 데이터가 필요하면 웹에서 '로그 추가'로 입력하거나, 아래를 한 번만 실행
-- INSERT INTO update_logs (title, "desc", font_size) VALUES
--   ('모바일 UI 대규모 개편', '메인 대시보드, 식단, 그래프 페이지 모바일 최적화 완료.', 11),
--   ('서비스 베타 오픈', 'GYM RAT 웹 서비스 배포 시작.', 11);
