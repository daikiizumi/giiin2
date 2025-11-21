import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Resend } from "resend";
import { api } from "./_generated/api";

// メール認証トークンを生成（URL用）
export const generateVerificationToken = mutation({
  args: {
    email: v.string(),
    type: v.union(v.literal("verification"), v.literal("password_reset")),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // 既存の未使用トークンを無効化
    const existingTokens = await ctx.db
      .query("emailVerificationTokens")
      .withIndex("by_email_and_type", (q) => 
        q.eq("email", args.email).eq("type", args.type)
      )
      .filter((q) => q.eq(q.field("used"), false))
      .collect();

    for (const token of existingTokens) {
      await ctx.db.patch(token._id, { used: true });
    }

    // 新しいトークンを生成（URLセーフなランダム文字列）
    const token = generateSecureToken();
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24時間後に期限切れ

    const tokenId = await ctx.db.insert("emailVerificationTokens", {
      email: args.email,
      token,
      type: args.type,
      expiresAt,
      used: false,
      userId: args.userId,
    });

    return { tokenId, token };
  },
});

// セキュアなトークン生成関数
function generateSecureToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// メール認証トークンを検証（URL用）
export const verifyEmailToken = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const tokenRecord = await ctx.db
      .query("emailVerificationTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .filter((q) => 
        q.and(
          q.eq(q.field("type"), "verification"),
          q.eq(q.field("used"), false)
        )
      )
      .first();

    if (!tokenRecord) {
      throw new Error("無効な認証URLです");
    }

    if (tokenRecord.expiresAt < Date.now()) {
      throw new Error("認証URLの有効期限が切れています");
    }

    // トークンを使用済みにマーク
    await ctx.db.patch(tokenRecord._id, { used: true });

    // ユーザーの認証状態を更新
    if (tokenRecord.userId) {
      const existingStatus = await ctx.db
        .query("userEmailStatus")
        .withIndex("by_user", (q) => q.eq("userId", tokenRecord.userId!))
        .first();

      if (existingStatus) {
        await ctx.db.patch(existingStatus._id, {
          isVerified: true,
          verifiedAt: Date.now(),
        });
      } else {
        await ctx.db.insert("userEmailStatus", {
          userId: tokenRecord.userId,
          email: tokenRecord.email,
          isVerified: true,
          verifiedAt: Date.now(),
        });
      }

      // ユーザーのemailVerificationTimeも更新
      await ctx.db.patch(tokenRecord.userId, {
        emailVerificationTime: Date.now(),
      });
    }

    return { 
      success: true, 
      userId: tokenRecord.userId,
      email: tokenRecord.email 
    };
  },
});

// パスワードリセット用トークン検証
export const verifyPasswordResetToken = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const tokenRecord = await ctx.db
      .query("emailVerificationTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .filter((q) => 
        q.and(
          q.eq(q.field("type"), "password_reset"),
          q.eq(q.field("used"), false)
        )
      )
      .first();

    if (!tokenRecord) {
      throw new Error("無効なパスワードリセットURLです");
    }

    if (tokenRecord.expiresAt < Date.now()) {
      throw new Error("パスワードリセットURLの有効期限が切れています");
    }

    return { 
      success: true, 
      userId: tokenRecord.userId,
      email: tokenRecord.email,
      token: args.token
    };
  },
});

// パスワードリセット完了
export const completePasswordReset = mutation({
  args: {
    token: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const tokenRecord = await ctx.db
      .query("emailVerificationTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .filter((q) => 
        q.and(
          q.eq(q.field("type"), "password_reset"),
          q.eq(q.field("used"), false)
        )
      )
      .first();

    if (!tokenRecord) {
      throw new Error("無効なパスワードリセットURLです");
    }

    if (tokenRecord.expiresAt < Date.now()) {
      throw new Error("パスワードリセットURLの有効期限が切れています");
    }

    // トークンを使用済みにマーク
    await ctx.db.patch(tokenRecord._id, { used: true });

    return { 
      success: true, 
      userId: tokenRecord.userId,
      email: tokenRecord.email 
    };
  },
});

// ユーザーのメール認証状態を取得
export const getUserEmailStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const status = await ctx.db
      .query("userEmailStatus")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return status;
  },
});

// メール送信アクション
export const sendVerificationEmail = action({
  args: {
    email: v.string(),
    token: v.string(),
    type: v.union(v.literal("verification"), v.literal("password_reset")),
    userName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 環境変数から設定を取得
    const resendApiKey = process.env.RESEND_API_KEY || process.env.CONVEX_RESEND_API_KEY;
    const fromEmail = process.env.FROM_EMAIL || "account@giiin.info";
    
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY が設定されていません");
    }

    const resend = new Resend(resendApiKey);

    // 認証URLを生成
    const baseUrl = process.env.SITE_URL || "https://your-app.convex.site";
    const verificationUrl = `${baseUrl}/verify-email?token=${args.token}`;
    const resetUrl = `${baseUrl}/reset-password?token=${args.token}`;

    let subject: string;
    let htmlContent: string;

    if (args.type === "verification") {
      subject = "【GIIIN/ギイーン】メールアドレス認証のお願い";
      htmlContent = `
        <div style="font-family: 'Noto Sans JP', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #f97316; font-size: 24px; margin: 0;">GIIIN/ギイーン</h1>
              <p style="color: #6b7280; margin: 5px 0 0 0;">議員活動可視化システム</p>
            </div>
            
            <h2 style="color: #1f2937; font-size: 20px; margin-bottom: 20px;">メールアドレス認証</h2>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
              ${args.userName ? `${args.userName}様、` : ""}アカウント登録ありがとうございます。<br>
              以下のボタンをクリックして、メールアドレスの認証を完了してください。
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(to right, #3b82f6, #8b5cf6); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                メールアドレスを認証する
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              ボタンが機能しない場合は、以下のURLをコピーしてブラウザに貼り付けてください：<br>
              <a href="${verificationUrl}" style="color: #3b82f6; word-break: break-all;">${verificationUrl}</a>
            </p>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              ※ この認証URLは24時間有効です。<br>
              ※ このメールに心当たりがない場合は、このメールを削除してください。
            </p>
            
            <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © 2024 GIIIN/ギイーン 議員活動可視化システム<br>
                <a href="https://giiin.info" style="color: #9ca3af; text-decoration: none;">https://giiin.info</a>
              </p>
            </div>
          </div>
        </div>
      `;
    } else {
      subject = "【GIIIN/ギイーン】パスワード再設定のご案内";
      htmlContent = `
        <div style="font-family: 'Noto Sans JP', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #f97316; font-size: 24px; margin: 0;">GIIIN/ギイーン</h1>
              <p style="color: #6b7280; margin: 5px 0 0 0;">議員活動可視化システム</p>
            </div>
            
            <h2 style="color: #1f2937; font-size: 20px; margin-bottom: 20px;">パスワード再設定</h2>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
              パスワード再設定のリクエストを受け付けました。<br>
              以下のボタンをクリックして、新しいパスワードを設定してください。
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(to right, #ef4444, #f97316); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                パスワードを再設定する
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              ボタンが機能しない場合は、以下のURLをコピーしてブラウザに貼り付けてください：<br>
              <a href="${resetUrl}" style="color: #3b82f6; word-break: break-all;">${resetUrl}</a>
            </p>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              ※ この認証URLは24時間有効です。<br>
              ※ パスワード再設定をリクエストしていない場合は、このメールを削除してください。
            </p>
            
            <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © 2024 GIIIN/ギイーン 議員活動可視化システム<br>
                <a href="https://giiin.info" style="color: #9ca3af; text-decoration: none;">https://giiin.info</a>
              </p>
            </div>
          </div>
        </div>
      `;
    }

    try {
      const { data, error } = await resend.emails.send({
        from: `GIIIN/ギイーン <${fromEmail}>`,
        to: args.email,
        subject,
        html: htmlContent,
      });

      if (error) {
        console.error("Email sending error:", error);
        throw new Error("メール送信に失敗しました");
      }

      return { success: true, messageId: data?.id };
    } catch (error) {
      console.error("Email sending failed:", error);
      throw new Error("メール送信に失敗しました");
    }
  },
});

// メール認証要求（改善版）
export const requestEmailVerification = action({
  args: {
    email: v.string(),
    userId: v.optional(v.id("users")),
    userName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let userId = args.userId;
    
    // ユーザーIDが指定されていない場合は、メールアドレスから取得
    if (!userId) {
      // 新規作成されたユーザーを確実に取得するため、リトライ機能付き
      let user = null;
      let retries = 0;
      const maxRetries = 3;
      
      while (!user && retries < maxRetries) {
        try {
          user = await ctx.runQuery(api.auth.getUserByEmail, {
            email: args.email,
          });
          if (!user && retries < maxRetries - 1) {
            // 500ms待ってからリトライ
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error(`User lookup attempt ${retries + 1} failed:`, error);
        }
        retries++;
      }
      
      if (!user) {
        throw new Error("ユーザーが見つかりません。アカウント作成が完了していない可能性があります。");
      }
      
      userId = user._id;
    }

    // トークンを生成
    const { token } = await ctx.runMutation(api.emailAuth.generateVerificationToken, {
      email: args.email,
      type: "verification",
      userId: userId,
    });

    // メールを送信
    await ctx.runAction(api.emailAuth.sendVerificationEmail, {
      email: args.email,
      token,
      type: "verification",
      userName: args.userName,
    });

    return { success: true };
  },
});

// パスワードリセット要求
export const requestPasswordReset = action({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // ユーザーが存在するかチェック
    const user = await ctx.runQuery(api.auth.getUserByEmail, {
      email: args.email,
    });

    if (!user) {
      // セキュリティのため、ユーザーが存在しなくても成功を返す
      return { success: true };
    }

    // トークンを生成
    const { token } = await ctx.runMutation(api.emailAuth.generateVerificationToken, {
      email: args.email,
      type: "password_reset",
      userId: user._id,
    });

    // メールを送信
    await ctx.runAction(api.emailAuth.sendVerificationEmail, {
      email: args.email,
      token,
      type: "password_reset",
      userName: user.name,
    });

    return { success: true };
  },
});
