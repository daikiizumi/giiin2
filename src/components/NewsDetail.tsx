import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface NewsDetailProps {
  newsId: Id<"news">;
  onBack: () => void;
}

export function NewsDetail({ newsId, onBack }: NewsDetailProps) {
  const news = useQuery(api.news.getById, { id: newsId });

  if (!news) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">読み込み中...</p>
        </div>
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 戻るボタン */}
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-gray-300 hover:text-yellow-400 transition-colors"
      >
        <span>←</span>
        <span>お知らせ一覧に戻る</span>
      </button>

      {/* 記事詳細 */}
      <div className="amano-bg-card rounded-xl p-8 amano-crystal-border">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-3xl">📢</span>
            <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1 rounded-full text-sm">
              {news.category}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-yellow-400 mb-4 amano-text-glow">
            {news.title}
          </h1>
          <div className="text-gray-400 text-sm">
            📅 {formatDate(news.publishDate)}
          </div>
        </div>

        {/* サムネイル画像 */}
        {news.thumbnailUrl && (
          <div className="mb-8">
            <img
              src={news.thumbnailUrl}
              alt={news.title}
              className="w-full max-w-2xl mx-auto rounded-lg shadow-lg"
            />
          </div>
        )}

        {/* 本文 */}
        <div className="prose prose-invert max-w-none">
          <div className="text-gray-200 whitespace-pre-wrap leading-relaxed">
            {news.content}
          </div>
        </div>

        {/* フッター */}
        <div className="mt-8 pt-6 border-t border-gray-600">
          <div className="text-sm text-gray-400">
            カテゴリー: {news.category}
          </div>
        </div>
      </div>
    </div>
  );
}
