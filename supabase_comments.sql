-- 댓글·답글·좋아요 테이블 (Supabase SQL Editor에서 실행)
-- 댓글: 관리자/일반 회원 모두 작성 가능. 삭제 시 소프트 삭제(is_deleted), "삭제된 댓글입니다" 표시용
-- 답글: parent_id가 있으면 답글, null이면 일반 댓글

-- ========================================
-- STEP 1: comments 테이블 생성 또는 수정
-- ========================================

-- 1-1. parent_id 컬럼 추가 (답글 기능)
ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id uuid;

-- 1-2. parent_id에 외래키 제약조건 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'comments_parent_id_fkey'
  ) THEN
    ALTER TABLE comments ADD CONSTRAINT comments_parent_id_fkey 
      FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 1-3. content 컬럼 추가 (body → content 마이그레이션)
ALTER TABLE comments ADD COLUMN IF NOT EXISTS content text;

-- 1-4. body 데이터를 content로 복사 (body 컬럼이 있는 경우)
UPDATE comments SET content = body WHERE content IS NULL AND body IS NOT NULL;

-- 1-5. content를 NOT NULL로 설정
ALTER TABLE comments ALTER COLUMN content SET NOT NULL;

-- 1-6. is_deleted 컬럼 추가 (없으면)
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;
ALTER TABLE comments ALTER COLUMN is_deleted SET DEFAULT false;

-- ========================================
-- STEP 2: comment_likes 테이블
-- ========================================

CREATE TABLE IF NOT EXISTS comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- ========================================
-- STEP 3: RLS 설정
-- ========================================

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- comments: 조회(모두), 추가(로그인 사용자), 수정/삭제(본인 또는 관리자)
DROP POLICY IF EXISTS "comments_select" ON comments;
CREATE POLICY "comments_select" ON comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "comments_insert" ON comments;
CREATE POLICY "comments_insert" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "comments_update" ON comments;
CREATE POLICY "comments_update" ON comments FOR UPDATE USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- comment_likes: 조회(모두), 추가/삭제(본인)
DROP POLICY IF EXISTS "comment_likes_select" ON comment_likes;
CREATE POLICY "comment_likes_select" ON comment_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "comment_likes_insert" ON comment_likes;
CREATE POLICY "comment_likes_insert" ON comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "comment_likes_delete" ON comment_likes;
CREATE POLICY "comment_likes_delete" ON comment_likes FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- STEP 4: 기존 body 컬럼 삭제 (선택사항)
-- ========================================
-- 마이그레이션이 완료되고 content 컬럼이 정상 작동하면 아래 주석을 해제하고 실행:
-- ALTER TABLE comments DROP COLUMN IF EXISTS body;
