import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr'; // 또는 사용 중인 utils 경로
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  // 1. 요청된 URL에서 'origin'(도메인)과 'code'(인증코드)를 추출
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  // [핵심] origin은 'http://localhost:3000' 또는 'https://니사이트.vercel.app'이 됨
  const origin = requestUrl.origin;
  
  // 2. 인증 코드가 있으면 세션으로 교환
  if (code) {
    const cookieStore = await cookies(); // Next.js 15+에서는 await 필요, 14 이하면 그냥 cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          // 쿠키 처리 로직 (기존 utils/supabase/server.ts랑 비슷함)
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Server Component에서 쿠키 설정 불가 에러 무시
            }
          },
        },
      }
    );
    
    // 코드 교환
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // 3. [성공 시] 로컬이면 로컬로, 배포면 배포로 리다이렉트
      // 뒤에 /blog나 /dashboard 등 원하는 경로 붙여도 됨
      return NextResponse.redirect(`${origin}/blog`);
    }
  }

  // 4. [실패 시] 로그인 페이지로 (auth-code-error 페이지도 있음)
  return NextResponse.redirect(`${origin}/login`);
}