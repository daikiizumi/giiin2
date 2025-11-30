import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface NewsProps {
  onNewsClick: (newsId: Id<"news">) => void;
}

export function News({ onNewsClick }: NewsProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  const news = useQuery(api.news.list);

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

  // カテゴリー一覧を取得
  const categories = Array.from(new Set(news.map(n => n.category))).sort();

  // ニュースをフィルタリング
  const filteredNews = news.filter(item => 
    selectedCategory === "all" || item.category === selectedCategory
  );

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ヘッダー */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent amano-text-glow">
          📢 お知らせ
        </h1>
        <p className="text-gray-300">
          サイトからの最新情報をお届けします
        </p>
      </div>

      {/* カテゴリーフィルター */}
      <div className="amano-bg-card rounded-xl p-4 amano-crystal-border">
        <div className="flex items-center space-x-4">
          <span className="text-yellow-400 font-medium">カテゴリー:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="auth-input-field"
          >
            <option value="all">すべて</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ニュース一覧 */}
      <div className="space-y-4">
        {filteredNews.length === 0 ? (
          <div className="text-center py-12 amano-bg-card rounded-xl amano-crystal-border">
            <div className="text-6xl mb-4">📢</div>
            <h3 className="text-xl font-medium text-gray-300 mb-2">お知らせがありません</h3>
            <p className="text-gray-400">
              現在表示できるお知らせがありません。
            </p>
          </div>
        ) : (
          filteredNews.map((item, index) => (
            <div
              key={item._id}
              onClick={() => onNewsClick(item._id)}
              className="cursor-pointer amano-bg-card rounded-xl p-6 amano-crystal-border hover:bg-gradient-to-r hover:from-yellow-500/20 hover:via-purple-500/20 hover:to-cyan-400/20 transition-all duration-300 transform hover:scale-[1.02] animate-slideUp"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start space-x-4">
                <div className="text-3xl">📢</div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h2 className="text-xl font-bold text-yellow-400 hover:text-white transition-colors">
                      {item.title}
                    </h2>
                    <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1 rounded-full text-sm">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-gray-300 mb-3 line-clamp-2">
                    {item.content.substring(0, 150)}...
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span>📅 {formatDate(item.publishDate)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
