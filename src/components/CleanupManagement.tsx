import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function CleanupManagement() {
  const [searchEmail, setSearchEmail] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  const searchTargets = useQuery(
    api.admin.searchCleanupTargets,
    searchEmail ? { email: searchEmail } : "skip"
  );

  const manualCleanup = useMutation(api.admin.manualCleanupByEmail);

  const handleSearch = () => {
    if (!searchEmail.trim()) {
      toast.error("メールアドレスを入力してください");
      return;
    }
    setIsSearching(true);
    // クエリが自動で実行されるため、ここでは状態をリセットするだけ
    setTimeout(() => setIsSearching(false), 500);
  };

  const handleCleanup = async () => {
    if (!searchEmail.trim()) {
      toast.error("メールアドレスを入力してください");
      return;
    }

    if (!searchTargets || searchTargets.totalCount === 0) {
      toast.error("削除対象のデータが見つかりません");
      return;
    }

    const confirmed = window.confirm(
      `${searchEmail} に関連する ${searchTargets.totalCount} 件のデータを完全に削除しますか？\n\n削除されるデータ:\n${searchTargets.targets.map(t => `- ${t.type}: ${t.count}件`).join('\n')}\n\nこの操作は取り消せません。`
    );

    if (!confirmed) return;

    setIsCleaningUp(true);

    try {
      const result = await manualCleanup({ email: searchEmail });
      
      if (result.success) {
        toast.success(
          `クリーンアップが完了しました。${result.deletedCount}件のデータを削除しました。`
        );
        
        // 詳細をコンソールに出力
        console.log("クリーンアップ結果:", result);
        
        // 検索をリセット
        setSearchEmail("");
      }
    } catch (error: any) {
      console.error("Cleanup error:", error);
      toast.error(`クリーンアップに失敗しました: ${error.message}`);
    } finally {
      setIsCleaningUp(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
        <h2 className="text-2xl font-bold text-yellow-400 mb-6 amano-text-glow">
          🧹 手動データクリーンアップ
        </h2>
        
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <span className="text-red-400 text-xl">⚠️</span>
            <div>
              <h3 className="text-red-400 font-bold mb-2">重要な注意事項</h3>
              <ul className="text-red-300 text-sm space-y-1">
                <li>• この機能は指定されたメールアドレスに関連する全データを完全に削除します</li>
                <li>• 削除されたデータは復元できません</li>
                <li>• 現在ログイン中のアカウントは削除できません</li>
                <li>• 実行前に必ず対象データを確認してください</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              クリーンアップ対象のメールアドレス
            </label>
            <div className="flex space-x-3">
              <input
                type="email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                placeholder="example@email.com"
                className="flex-1 px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchEmail.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                {isSearching ? "検索中..." : "検索"}
              </button>
            </div>
          </div>

          {searchTargets && (
            <div className="mt-6">
              <h3 className="text-lg font-bold text-yellow-400 mb-4">
                検索結果: {searchTargets.email}
              </h3>
              
              {searchTargets.totalCount === 0 ? (
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-green-400 text-xl">✅</span>
                    <div>
                      <p className="text-green-400 font-medium">クリーンな状態です</p>
                      <p className="text-green-300 text-sm">このメールアドレスに関連するデータは見つかりませんでした。</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                    <p className="text-yellow-400 font-medium mb-2">
                      削除対象: 合計 {searchTargets.totalCount} 件のデータが見つかりました
                    </p>
                    <div className="space-y-2">
                      {searchTargets.targets.map((target, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="text-gray-300">{target.type}</span>
                          <div className="text-right">
                            <span className="text-yellow-400 font-medium">{target.count}件</span>
                            <div className="text-gray-400 text-xs">{target.details}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleCleanup}
                    disabled={isCleaningUp}
                    className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    {isCleaningUp ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>削除中...</span>
                      </>
                    ) : (
                      <>
                        <span>🗑️</span>
                        <span>全データを削除する</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 使用方法の説明 */}
      <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
        <h3 className="text-lg font-bold text-yellow-400 mb-4">📖 使用方法</h3>
        <div className="space-y-3 text-gray-300 text-sm">
          <div className="flex items-start space-x-3">
            <span className="text-cyan-400 font-bold">1.</span>
            <p>クリーンアップしたいメールアドレスを入力して「検索」ボタンをクリック</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-cyan-400 font-bold">2.</span>
            <p>削除対象のデータ一覧を確認</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-cyan-400 font-bold">3.</span>
            <p>問題なければ「全データを削除する」ボタンをクリック</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-cyan-400 font-bold">4.</span>
            <p>確認ダイアログで「OK」をクリックして実行</p>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <p className="text-blue-300 text-sm">
            💡 <strong>ヒント:</strong> 新規登録でエラーが発生する場合、そのメールアドレスでこのクリーンアップを実行してから再度登録を試してください。
          </p>
        </div>
      </div>
    </div>
  );
}
