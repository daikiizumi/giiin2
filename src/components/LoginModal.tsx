import { useState } from "react";
import { SignUpForm } from "./SignUpForm";
import { TermsAndPrivacy } from "./TermsAndPrivacy";
import { useAction } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [currentView, setCurrentView] = useState<"signIn" | "signUp" | "passwordReset" | "terms">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { signIn } = useAuthActions();
  const requestPasswordReset = useAction(api.emailActions.sendPasswordResetEmail);

  // Password reset form state
  const [resetEmail, setResetEmail] = useState("");
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  if (!isOpen) return null;

  const handleSuccess = () => {
    onClose();
    setCurrentView("signIn"); // リセット
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail) {
      toast.error("メールアドレスを入力してください");
      return;
    }

    setIsResetLoading(true);

    try {
      await requestPasswordReset({ email: resetEmail });
      setIsEmailSent(true);
      toast.success("パスワードリセット用のメールを送信しました");
    } catch (error) {
      console.error("Password reset error:", error);
      toast.error("パスワードリセットの要求に失敗しました");
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("メールアドレスとパスワードを入力してください");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("password", password);
      formData.set("flow", "signIn");

      await signIn("password", formData);
      toast.success("ログインしました");
      handleSuccess();
    } catch (error: any) {
      console.error("Sign in error:", error);
      
      if (error.message?.includes("Invalid login credentials") || error.message?.includes("INVALID_LOGIN_CREDENTIALS")) {
        toast.error("メールアドレスまたはパスワードが正しくありません");
      } else if (error.message?.includes("Account not found") || error.message?.includes("ACCOUNT_NOT_FOUND")) {
        toast.error("アカウントが見つかりません");
      } else {
        toast.error("ログイン中にエラーが発生しました");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const PasswordResetForm = () => {
    if (isEmailSent) {
      return (
        <div className="space-y-6 text-center">
          <div className="text-6xl mb-4">📧</div>
          <h2 className="text-2xl font-bold text-yellow-400 amano-text-glow">
            メール送信完了
          </h2>
          <p className="text-gray-300">
            パスワードリセット用のメールを送信しました。
            <br />
            メールに記載されたリンクをクリックして、新しいパスワードを設定してください。
          </p>
          <button
            onClick={() => {
              setCurrentView("signIn");
              setIsEmailSent(false);
              setResetEmail("");
            }}
            className="auth-button"
          >
            ログイン画面に戻る
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent amano-text-glow">
            パスワードリセット
          </h2>
          <p className="text-gray-300 mt-2 text-sm">
            登録されたメールアドレスにパスワードリセット用のリンクを送信します
          </p>
        </div>

        <form onSubmit={handlePasswordReset} className="space-y-4">
          <div>
            <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-300 mb-2">
              メールアドレス <span className="text-red-400">*</span>
            </label>
            <input
              id="resetEmail"
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="auth-input-field"
              placeholder="example@email.com"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isResetLoading}
            className="auth-button"
          >
            {isResetLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>送信中...</span>
              </div>
            ) : (
              "リセットメールを送信"
            )}
          </button>
        </form>
      </div>
    );
  };

  const renderContent = () => {
    switch (currentView) {
      case "signUp":
        return (
          <SignUpForm
            onSuccess={handleSuccess}
            onSwitchToSignIn={() => setCurrentView("signIn")}
            onShowTerms={() => setCurrentView("terms")}
          />
        );
      case "passwordReset":
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-4 mb-6">
              <button
                onClick={() => setCurrentView("signIn")}
                className="flex items-center space-x-2 text-cyan-400 hover:text-yellow-400 transition-colors"
              >
                <span>←</span>
                <span>戻る</span>
              </button>
            </div>
            <PasswordResetForm />
          </div>
        );
      case "terms":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-yellow-400 amano-text-glow">
                利用規約・プライバシーポリシー
              </h2>
              <button
                onClick={() => setCurrentView("signUp")}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ← 戻る
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <TermsAndPrivacy />
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent amano-text-glow">
                ログイン
              </h2>
              <p className="text-gray-300 mt-2 text-sm">
                GIIIN/ギイーンにアクセスするためにログインしてください
              </p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  メールアドレス <span className="text-red-400">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input-field"
                  placeholder="example@email.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  パスワード <span className="text-red-400">*</span>
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input-field"
                  placeholder="パスワードを入力"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="auth-button"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>ログイン中...</span>
                  </div>
                ) : (
                  "ログイン"
                )}
              </button>
            </form>

            <div className="text-center space-y-2">
              <p className="text-gray-400 text-sm">
                アカウントをお持ちでない方は{" "}
                <button
                  onClick={() => setCurrentView("signUp")}
                  className="text-cyan-400 hover:text-yellow-400 font-medium underline hover:no-underline transition-colors"
                >
                  新規登録
                </button>
              </p>
              <p className="text-gray-400 text-sm">
                パスワードを忘れた方は{" "}
                <button
                  onClick={() => setCurrentView("passwordReset")}
                  className="text-cyan-400 hover:text-yellow-400 font-medium underline hover:no-underline transition-colors"
                >
                  パスワードリセット
                </button>
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="amano-bg-card rounded-xl p-6 amano-crystal-border w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div></div> {/* スペーサー */}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-xl"
          >
            ✕
          </button>
        </div>
        {renderContent()}
      </div>
    </div>
  );
}
