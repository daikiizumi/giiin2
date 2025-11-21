import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// メール認証用のHTTPエンドポイント
http.route({
  path: "/verify-email",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response(
        generateErrorPage("認証URLが無効です", "認証トークンが見つかりません。"),
        {
          status: 400,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      );
    }

    try {
      const result = await ctx.runMutation(api.emailAuth.verifyEmailToken, {
        token,
      });

      if (result.success) {
        return new Response(
          generateSuccessPage(
            "メール認証完了！",
            "メールアドレスの認証が完了しました。",
            "アプリに戻ってログインしてください。"
          ),
          {
            status: 200,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          }
        );
      }
    } catch (error) {
      console.error("Email verification error:", error);
      return new Response(
        generateErrorPage(
          "認証に失敗しました",
          error instanceof Error ? error.message : "不明なエラーが発生しました。"
        ),
        {
          status: 400,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      );
    }

    return new Response(
      generateErrorPage("認証に失敗しました", "不明なエラーが発生しました。"),
      {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }),
});

// パスワードリセット用のHTTPエンドポイント
http.route({
  path: "/reset-password",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response(
        generateErrorPage("パスワードリセットURLが無効です", "認証トークンが見つかりません。"),
        {
          status: 400,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      );
    }

    try {
      const result = await ctx.runMutation(api.emailAuth.verifyPasswordResetToken, {
        token,
      });

      if (result.success) {
        return new Response(
          generatePasswordResetPage(token),
          {
            status: 200,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          }
        );
      }
    } catch (error) {
      console.error("Password reset verification error:", error);
      return new Response(
        generateErrorPage(
          "パスワードリセットに失敗しました",
          error instanceof Error ? error.message : "不明なエラーが発生しました。"
        ),
        {
          status: 400,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      );
    }

    return new Response(
      generateErrorPage("パスワードリセットに失敗しました", "不明なエラーが発生しました。"),
      {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }),
});

// パスワードリセット完了用のHTTPエンドポイント
http.route({
  path: "/complete-password-reset",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const formData = await request.formData();
    const token = formData.get("token") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!token || !newPassword || !confirmPassword) {
      return new Response(
        generateErrorPage("入力エラー", "すべての項目を入力してください。"),
        {
          status: 400,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      );
    }

    if (newPassword !== confirmPassword) {
      return new Response(
        generatePasswordResetPage(token, "パスワードが一致しません。"),
        {
          status: 400,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      );
    }

    if (newPassword.length < 8) {
      return new Response(
        generatePasswordResetPage(token, "パスワードは8文字以上で入力してください。"),
        {
          status: 400,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      );
    }

    try {
      const result = await ctx.runMutation(api.emailAuth.completePasswordReset, {
        token,
        newPassword,
      });

      if (result.success) {
        return new Response(
          generateSuccessPage(
            "パスワード再設定完了！",
            "パスワードが正常に再設定されました。",
            "新しいパスワードでログインしてください。"
          ),
          {
            status: 200,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          }
        );
      }
    } catch (error) {
      console.error("Password reset completion error:", error);
      return new Response(
        generatePasswordResetPage(
          token,
          error instanceof Error ? error.message : "パスワードの再設定に失敗しました。"
        ),
        {
          status: 400,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      );
    }

    return new Response(
      generateErrorPage("パスワード再設定に失敗しました", "不明なエラーが発生しました。"),
      {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }),
});

// 成功ページのHTML生成
function generateSuccessPage(title: string, message: string, instruction: string): string {
  return `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - GIIIN/ギイーン</title>
      <style>
        body {
          font-family: 'Noto Sans JP', Arial, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          margin: 0;
          padding: 20px;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          text-align: center;
          max-width: 500px;
          width: 100%;
        }
        .logo {
          color: #f97316;
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .subtitle {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 30px;
        }
        .success-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }
        h1 {
          color: #10b981;
          font-size: 24px;
          margin-bottom: 15px;
        }
        p {
          color: #374151;
          line-height: 1.6;
          margin-bottom: 20px;
        }
        .instruction {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          padding: 15px;
          color: #166534;
          font-weight: 500;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #9ca3af;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">GIIIN/ギイーン</div>
        <div class="subtitle">議員活動可視化システム</div>
        
        <div class="success-icon">✅</div>
        <h1>${title}</h1>
        <p>${message}</p>
        <div class="instruction">${instruction}</div>
        
        <div class="footer">
          © 2024 GIIIN/ギイーン 議員活動可視化システム
        </div>
      </div>
    </body>
    </html>
  `;
}

// エラーページのHTML生成
function generateErrorPage(title: string, message: string): string {
  return `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - GIIIN/ギイーン</title>
      <style>
        body {
          font-family: 'Noto Sans JP', Arial, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          margin: 0;
          padding: 20px;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          text-align: center;
          max-width: 500px;
          width: 100%;
        }
        .logo {
          color: #f97316;
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .subtitle {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 30px;
        }
        .error-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }
        h1 {
          color: #ef4444;
          font-size: 24px;
          margin-bottom: 15px;
        }
        p {
          color: #374151;
          line-height: 1.6;
          margin-bottom: 20px;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #9ca3af;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">GIIIN/ギイーン</div>
        <div class="subtitle">議員活動可視化システム</div>
        
        <div class="error-icon">❌</div>
        <h1>${title}</h1>
        <p>${message}</p>
        
        <div class="footer">
          © 2024 GIIIN/ギイーン 議員活動可視化システム
        </div>
      </div>
    </body>
    </html>
  `;
}

// パスワードリセットページのHTML生成
function generatePasswordResetPage(token: string, error?: string): string {
  return `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>パスワード再設定 - GIIIN/ギイーン</title>
      <style>
        body {
          font-family: 'Noto Sans JP', Arial, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          margin: 0;
          padding: 20px;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          max-width: 500px;
          width: 100%;
        }
        .logo {
          color: #f97316;
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 10px;
          text-align: center;
        }
        .subtitle {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 30px;
          text-align: center;
        }
        h1 {
          color: #1f2937;
          font-size: 24px;
          margin-bottom: 20px;
          text-align: center;
        }
        .form-group {
          margin-bottom: 20px;
        }
        label {
          display: block;
          color: #374151;
          font-weight: 500;
          margin-bottom: 8px;
        }
        input[type="password"] {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #d1d5db;
          border-radius: 8px;
          font-size: 16px;
          box-sizing: border-box;
        }
        input[type="password"]:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .submit-btn {
          width: 100%;
          background: linear-gradient(to right, #3b82f6, #8b5cf6);
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s;
        }
        .submit-btn:hover {
          background: linear-gradient(to right, #2563eb, #7c3aed);
          transform: translateY(-1px);
        }
        .error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #9ca3af;
          font-size: 12px;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">GIIIN/ギイーン</div>
        <div class="subtitle">議員活動可視化システム</div>
        
        <h1>パスワード再設定</h1>
        
        ${error ? `<div class="error">${error}</div>` : ''}
        
        <form action="/complete-password-reset" method="POST">
          <input type="hidden" name="token" value="${token}">
          
          <div class="form-group">
            <label for="newPassword">新しいパスワード</label>
            <input type="password" id="newPassword" name="newPassword" required minlength="8" placeholder="8文字以上で入力してください">
          </div>
          
          <div class="form-group">
            <label for="confirmPassword">パスワード確認</label>
            <input type="password" id="confirmPassword" name="confirmPassword" required minlength="8" placeholder="パスワードを再入力してください">
          </div>
          
          <button type="submit" class="submit-btn">パスワードを再設定</button>
        </form>
        
        <div class="footer">
          © 2024 GIIIN/ギイーン 議員活動可視化システム
        </div>
      </div>
    </body>
    </html>
  `;
}

export default http;
