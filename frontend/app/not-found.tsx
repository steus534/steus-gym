import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-black text-white mb-2">페이지를 찾을 수 없습니다</h1>
      <p className="text-sm text-zinc-500 mb-6">주소가 잘못되었거나 페이지가 이동되었을 수 있습니다.</p>
      <Link
        href="/"
        className="px-5 py-2.5 bg-lime-500 text-black font-bold rounded-xl text-sm hover:bg-lime-400 transition-colors"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
