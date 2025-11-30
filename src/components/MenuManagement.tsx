import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

const DEFAULT_MENU_SETTINGS = [
  { menuKey: "questions", menuName: "質問・回答", isVisible: true, order: 1, description: "議会質問と回答を閲覧できます" },
  { menuKey: "members", menuName: "議員一覧", isVisible: true, order: 2, description: "市議会議員の一覧と詳細情報" },
  { menuKey: "rankings", menuName: "統計", isVisible: true, order: 3, description: "議員の活動統計" },
  { menuKey: "news", menuName: "お知らせ", isVisible: true, order: 4, description: "サイトからのお知らせ" },
  { menuKey: "externalArticles", menuName: "議員ブログ・SNS", isVisible: false, order: 5, description: "議員のブログやSNS投稿" },
  { menuKey: "faq", menuName: "よくある質問", isVisible: true, order: 6, description: "よくある質問と回答" },
  { menuKey: "contact", menuName: "お問い合わせ", isVisible: true, order: 7, description: "お問い合わせフォーム" },
];

export function MenuManagement() {
  const menuSettings = useQuery(api.menuSettings.getMenuSettings);
  const initializeMenuSettings = useMutation(api.menuSettings.initializeMenuSettings);
  const updateMultipleMenuSettings = useMutation(api.menuSettings.updateMultipleMenuSettings);
  
  const [localSettings, setLocalSettings] = useState<any[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (menuSettings) {
      if (menuSettings.length === 0) {
        setLocalSettings(DEFAULT_MENU_SETTINGS);
      } else {
        setLocalSettings([...menuSettings]);
      }
      setHasChanges(false);
    }
  }, [menuSettings]);

  // 初期化処理
  useEffect(() => {
    const initializeIfNeeded = async () => {
      if (menuSettings && menuSettings.length === 0) {
        try {
          await initializeMenuSettings();
        } catch (error) {
          console.error("メニュー設定の初期化に失敗しました:", error);
        }
      }
    };
    
    initializeIfNeeded();
  }, [menuSettings, initializeMenuSettings]);

  const handleVisibilityChange = (menuKey: string, isVisible: boolean) => {
    setLocalSettings(prev => 
      prev.map(setting => 
        setting.menuKey === menuKey 
          ? { ...setting, isVisible }
          : setting
      )
    );
    setHasChanges(true);
  };

  const handleOrderChange = (menuKey: string, newOrder: number) => {
    setLocalSettings(prev => 
      prev.map(setting => 
        setting.menuKey === menuKey 
          ? { ...setting, order: newOrder }
          : setting
      ).sort((a, b) => a.order - b.order)
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!hasChanges) return;
    
    setIsLoading(true);
    try {
      await updateMultipleMenuSettings({
        settings: localSettings.map(setting => ({
          menuKey: setting.menuKey,
          isVisible: setting.isVisible,
          order: setting.order,
          menuName: setting.menuName,
          description: setting.description,
        }))
      });
      setHasChanges(false);
    } catch (error) {
      console.error("設定の保存に失敗しました:", error);
      alert("設定の保存に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (menuSettings && menuSettings.length > 0) {
      setLocalSettings([...menuSettings]);
    } else {
      setLocalSettings(DEFAULT_MENU_SETTINGS);
    }
    setHasChanges(false);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    
    const newSettings = [...localSettings];
    const currentOrder = newSettings[index].order;
    const prevOrder = newSettings[index - 1].order;
    
    newSettings[index].order = prevOrder;
    newSettings[index - 1].order = currentOrder;
    
    newSettings.sort((a, b) => a.order - b.order);
    setLocalSettings(newSettings);
    setHasChanges(true);
  };

  const moveDown = (index: number) => {
    if (index === localSettings.length - 1) return;
    
    const newSettings = [...localSettings];
    const currentOrder = newSettings[index].order;
    const nextOrder = newSettings[index + 1].order;
    
    newSettings[index].order = nextOrder;
    newSettings[index + 1].order = currentOrder;
    
    newSettings.sort((a, b) => a.order - b.order);
    setLocalSettings(newSettings);
    setHasChanges(true);
  };

  if (!menuSettings) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">読み込み中...</p>
        </div>
      </div>
    );
  }

  console.log("MenuManagement - menuSettings:", menuSettings);
  console.log("MenuManagement - localSettings:", localSettings);

  // デバッグ用：強制的にデフォルト設定を表示するボタンを追加
  const forceDefaultSettings = () => {
    setLocalSettings(DEFAULT_MENU_SETTINGS);
    setHasChanges(true);
  };

  // 強制初期化（既存設定を上書き）
  const forceInitialize = async () => {
    if (confirm("既存のメニュー設定を削除して、デフォルト設定で初期化しますか？")) {
      try {
        await updateMultipleMenuSettings({
          settings: DEFAULT_MENU_SETTINGS.map(setting => ({
            menuKey: setting.menuKey,
            isVisible: setting.isVisible,
            order: setting.order,
            menuName: setting.menuName,
            description: setting.description,
          }))
        });
        // 再読み込みを促す
        window.location.reload();
      } catch (error) {
        console.error("初期化に失敗しました:", error);
        alert("初期化に失敗しました");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-yellow-400 amano-text-glow">
            🎛️ メニュー表示設定
          </h2>
          <p className="text-gray-300 text-sm mt-2">
            各メニューの表示・非表示と順序を設定できます
          </p>
          <button
            onClick={forceDefaultSettings}
            className="mt-2 px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition-colors mr-2"
          >
            デフォルト設定を強制適用
          </button>
          <button
            onClick={forceInitialize}
            className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
          >
            設定を初期化
          </button>
        </div>
        
        {hasChanges && (
          <div className="flex space-x-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              リセット
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 text-white rounded-lg font-medium hover:from-yellow-500 hover:via-purple-500 hover:to-cyan-400 transition-all duration-500 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "保存中..." : "変更を保存"}
            </button>
          </div>
        )}
      </div>

      {/* 設定一覧 */}
      <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
        {localSettings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">メニュー設定を初期化中...</p>
            <button
              onClick={() => setLocalSettings(DEFAULT_MENU_SETTINGS)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              デフォルト設定を読み込み
            </button>
          </div>
        ) : (
          <div className="space-y-4">
          {localSettings.map((setting, index) => (
            <div
              key={setting.menuKey}
              className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                setting.isVisible 
                  ? "bg-gradient-to-r from-green-500/20 to-blue-500/20 border-green-400/50" 
                  : "bg-gradient-to-r from-gray-500/20 to-gray-600/20 border-gray-500/50"
              }`}
            >
              {/* メニュー情報 */}
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">
                    {setting.menuKey === "questions" && "❓"}
                    {setting.menuKey === "members" && "👥"}
                    {setting.menuKey === "rankings" && "📊"}
                    {setting.menuKey === "news" && "📢"}
                    {setting.menuKey === "externalArticles" && "📰"}
                    {setting.menuKey === "faq" && "💡"}
                    {setting.menuKey === "contact" && "📧"}
                  </span>
                  <div>
                    <h3 className="font-medium text-gray-200">{setting.menuName}</h3>
                    {setting.description && (
                      <p className="text-sm text-gray-400">{setting.description}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 順序変更ボタン */}
              <div className="flex items-center space-x-2 mx-4">
                <button
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="p-2 text-gray-400 hover:text-yellow-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="上に移動"
                >
                  ↑
                </button>
                <span className="text-sm text-gray-400 min-w-[2rem] text-center">
                  {setting.order}
                </span>
                <button
                  onClick={() => moveDown(index)}
                  disabled={index === localSettings.length - 1}
                  className="p-2 text-gray-400 hover:text-yellow-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="下に移動"
                >
                  ↓
                </button>
              </div>

              {/* 表示・非表示切り替え */}
              <div className="flex items-center space-x-3">
                <span className={`text-sm font-medium ${
                  setting.isVisible ? "text-green-400" : "text-gray-400"
                }`}>
                  {setting.isVisible ? "表示" : "非表示"}
                </span>
                <button
                  onClick={() => handleVisibilityChange(setting.menuKey, !setting.isVisible)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    setting.isVisible ? "bg-green-600" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      setting.isVisible ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
        )}

        {/* 説明 */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg">
          <h4 className="text-sm font-medium text-blue-400 mb-2">💡 使い方</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• スイッチでメニューの表示・非表示を切り替えできます</li>
            <li>• ↑↓ボタンでメニューの表示順序を変更できます</li>
            <li>• 変更後は「変更を保存」ボタンで設定を保存してください</li>
            <li>• 非表示にしたメニューは一般ユーザーには表示されません</li>
          </ul>
        </div>
      </div>

      {/* プレビュー */}
      <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
        <h3 className="text-lg font-bold text-yellow-400 mb-4 amano-text-glow">
          👀 表示プレビュー
        </h3>
        <div className="space-y-2">
          <p className="text-sm text-gray-400 mb-3">
            一般ユーザーに表示されるメニュー（表示順）:
          </p>
          <div className="flex flex-wrap gap-2">
            {localSettings
              .filter(setting => setting.isVisible)
              .sort((a, b) => a.order - b.order)
              .map((setting) => (
                <span
                  key={setting.menuKey}
                  className="px-3 py-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full text-sm"
                >
                  {setting.menuName}
                </span>
              ))}
          </div>
          {localSettings.filter(setting => setting.isVisible).length === 0 && (
            <p className="text-gray-400 text-sm italic">表示されるメニューがありません</p>
          )}
        </div>
      </div>
    </div>
  );
}
