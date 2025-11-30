import { useEffect } from "react";
import { Id } from "../../convex/_generated/dataModel";

interface UseUrlNavigationProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  setSelectedMemberId: (id: Id<"councilMembers"> | null) => void;
  setSelectedNewsId: (id: Id<"news"> | null) => void;
  setSelectedArticleId: (id: Id<"externalArticles"> | null) => void;
  setSelectedQuestionId: (id: Id<"questions"> | null) => void;
}

export function useUrlNavigation({
  currentView,
  setCurrentView,
  setSelectedMemberId,
  setSelectedNewsId,
  setSelectedArticleId,
  setSelectedQuestionId,
}: UseUrlNavigationProps) {
  // URLからパラメータを読み取って状態を更新
  const updateStateFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get("view") || "dashboard";
    const memberId = params.get("member");
    const newsId = params.get("news");
    const articleId = params.get("article");
    const questionId = params.get("question");

    // 常に状態を更新（比較せずに）
    setCurrentView(view);
    setSelectedMemberId(memberId ? memberId as Id<"councilMembers"> : null);
    setSelectedNewsId(newsId ? newsId as Id<"news"> : null);
    setSelectedArticleId(articleId ? articleId as Id<"externalArticles"> : null);
    setSelectedQuestionId(questionId ? questionId as Id<"questions"> : null);
  };

  // 初回読み込み時にURLから状態を復元
  useEffect(() => {
    updateStateFromUrl();
  }, []);

  // ブラウザの戻る/進むボタンに対応
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // popstateイベント発生時に強制的に状態を更新
      setTimeout(() => {
        updateStateFromUrl();
      }, 0);
    };

    window.addEventListener("popstate", handlePopState);
    
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [setCurrentView, setSelectedMemberId, setSelectedNewsId, setSelectedArticleId, setSelectedQuestionId]);
}
