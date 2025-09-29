interface EmailWrapperProps {
  title: string;
  children: string;
}

function getEmailWrapper({ title, children }: EmailWrapperProps) {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary-color: #bb9375;
            --primary-light: #d4baa3;
            --primary-dark: #8b6d55;
            --accent-color: #4a3f35;
        }

        body {
            margin: 0;
            padding: 0;
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: #f8f9fa;
            -webkit-font-smoothing: antialiased;
        }

        .container {
            max-width: 600px;
            margin: 20px auto;
            padding: 0 15px;
        }

        .email-wrapper {
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            border-radius: 24px;
            overflow: hidden;
            position: relative;
        }

        .decorative-header {
            background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
            height: 8px;
            width: 100%;
        }

        .content-wrapper {
            padding: 32px 24px;
            position: relative;
        }

        @media (min-width: 768px) {
            .content-wrapper {
                padding: 40px;
            }
        }

        .welcome-text {
            font-size: 28px;
            font-weight: 700;
            color: var(--accent-color);
            margin: 0 0 24px 0;
            text-align: center;
        }

        .content {
            position: relative;
            z-index: 1;
        }

        .message-box {
            background: #ffffff;
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            margin-bottom: 24px;
            border: 1px solid rgba(187, 147, 117, 0.1);
        }

        .message-box p {
            margin: 0 0 16px;
            color: #4a5568;
            line-height: 1.6;
        }

        .message-box p:last-child {
            margin-bottom: 0;
        }

        .button-container {
            text-align: center;
            margin: 32px 0;
            position: relative;
        }

        .verify-button {
            display: inline-block;
            padding: 16px 32px;
            background-color: #bb9375 !important;
            background-image: linear-gradient(135deg, #bb9375 0%, #8b6d55 100%);
            color: #ffffff !important;
            text-decoration: none !important;
            border-radius: 12px;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(187, 147, 117, 0.2);
            position: relative;
            overflow: hidden;
            border: none;
        }

        .time-notice {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            color: #718096;
            font-size: 14px;
            margin: 24px 0;
            padding: 12px;
            background: #f8f9fa;
            border-radius: 8px;
        }

        .footer {
            text-align: center;
            color: #718096;
            font-size: 14px;
            padding-top: 24px;
            border-top: 1px solid #edf2f7;
        }

        .otp-code {
            font-size: 18px;
            font-weight: 700;
            letter-spacing: 8px;
            color: var(--accent-color);
            text-align: center;
            margin: 24px 0;
            font-family: monospace;
        }

        @media screen and (max-width: 480px) {
            .content-wrapper {
                padding: 24px 16px;
            }

            .welcome-text {
                font-size: 24px;
            }

            .verify-button {
                padding: 14px 28px;
                font-size: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="email-wrapper">
            <div class="decorative-header"></div>
            <div class="content-wrapper">
                <div class="content">
                    ${children}
                </div>

                <div class="footer">
                    <p style="margin-bottom: 8px;">© 2025 Tehele. All rights reserved.</p>
                    <div style="color: #a0aec0; font-size: 13px;">
                        This is an automated message, please do not reply.
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
  `;
}

function getEmailVerificationTemplate_(
  userName: string,
  verificationLink: string,
) {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Tehele</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary-color: #bb9375;
            --primary-light: #d4baa3;
            --primary-dark: #8b6d55;
            --accent-color: #4a3f35;
        }

        body {
            margin: 0;
            padding: 0;
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: #f8f9fa;
            -webkit-font-smoothing: antialiased;
        }

        .container {
            max-width: 600px;
            margin: 20px auto;
            padding: 0 15px;
        }

        .email-wrapper {
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            border-radius: 24px;
            overflow: hidden;
            position: relative;
        }

        .decorative-header {
            background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
            height: 8px;
            width: 100%;
        }

        .content-wrapper {
            padding: 32px 24px;
            position: relative;
        }

        @media (min-width: 768px) {
            .content-wrapper {
                padding: 40px;
            }
        }

        .welcome-text {
            font-size: 28px;
            font-weight: 700;
            color: var(--accent-color);
            margin: 0 0 24px 0;
            text-align: center;
        }

        .content {
            position: relative;
            z-index: 1;
        }

        .message-box {
            background: #ffffff;
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            margin-bottom: 24px;
            border: 1px solid rgba(187, 147, 117, 0.1);
        }

        .message-box p {
            margin: 0 0 16px;
            color: #4a5568;
            line-height: 1.6;
        }

        .message-box p:last-child {
            margin-bottom: 0;
        }

        .button-container {
            text-align: center;
            margin: 32px 0;
            position: relative;
        }

        .verify-button {
            display: inline-block;
            padding: 16px 32px;
            background-color: #bb9375 !important;
            background-image: linear-gradient(135deg, #bb9375 0%, #8b6d55 100%);
            color: #ffffff !important;
            text-decoration: none !important;
            border-radius: 12px;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(187, 147, 117, 0.2);
            position: relative;
            overflow: hidden;
            border: none;
        }

        .time-notice {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            color: #718096;
            font-size: 14px;
            margin: 24px 0;
            padding: 12px;
            background: #f8f9fa;
            border-radius: 8px;
        }

        .footer {
            text-align: center;
            color: #718096;
            font-size: 14px;
            padding-top: 24px;
            border-top: 1px solid #edf2f7;
        }

        @media screen and (max-width: 480px) {
            .content-wrapper {
                padding: 24px 16px;
            }

            .welcome-text {
                font-size: 24px;
            }

            .verify-button {
                padding: 14px 28px;
                font-size: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="email-wrapper">
            <div class="decorative-header"></div>
            <div class="content-wrapper">
                <div class="content">
                    <h1 class="welcome-text">Welcome to Tehele</h1>
                    
                    <div class="message-box">
                        <p>Hello <strong style="color: var(--primary-color)">${userName}</strong>,</p>
                        <p>We're thrilled to have you join our community! To get started with your journey, please verify your email address.</p>
                    </div>

                    <div class="button-container">
                        <!--[if mso]>
                        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${verificationLink}" style="height:50px;v-text-anchor:middle;width:200px;" arcsize="10%" stroke="f" fillcolor="#bb9375">
                            <w:anchorlock/>
                            <center>
                        <![endif]-->
                        <a href="${verificationLink}" class="verify-button" style="background-color: #bb9375; color: #ffffff; text-decoration: none;">
                            Verify Email Address
                        </a>
                        <!--[if mso]>
                            </center>
                        </v:roundrect>
                        <![endif]-->
                    </div>

                    <div class="time-notice">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        This link will expire in 24 hours
                    </div>

                    <div class="message-box" style="background: #fff5f5; border-color: rgba(187, 147, 117, 0.2);">
                        <p style="color: #718096;">If you didn't create an account, you can safely ignore this email.</p>
                    </div>
                </div>

                <div class="footer">
                    <p style="margin-bottom: 8px;">© 2025 Tehele. All rights reserved.</p>
                    <div style="color: #a0aec0; font-size: 13px;">
                        This is an automated message, please do not reply.
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
  `;
}

function getOTPEmailTemplate(userName: string, otpCode: string) {
  const content = `
    <h1 class="welcome-text">Verification Code</h1>
    <div class="message-box">
      <p>Hello <strong style="color: var(--primary-color)">${userName}</strong>,</p>
      <p>Please use the following verification code to complete your request:</p>

        <div class="otp-code" style="font-family: monospace; letter-spacing: 0.5em; font-size: 24px; text-align: center; padding: 1em 0;">
      ${otpCode}
    </div>
    </div>
  
    <div class="time-notice">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
      This code will expire in 10 minutes
    </div>
    <div class="message-box" style="background: #fff5f5; border-color: rgba(187, 147, 117, 0.2);">
      <p style="color: #718096;">If you didn't request this code, you can safely ignore this email.</p>
    </div>
  `;

  return getEmailWrapper({
    title: 'Verification Code',
    children: content,
  });
}

const getPasswordResetTemplate = (name: string, resetLink: string): string => {
  const emailContent = `
    <h1 class="welcome-text">Reset Your Password</h1>
    
    <div class="message-box">
      <p>Hello ${name || 'there'},</p>
      <p>We received a request to reset your password for your Tehele account. Click the button below to create a new password:</p>
    </div>
    
    <div class="button-container">
      <a href="${resetLink}" class="verify-button">Reset Password</a>
    </div>
    
    <div class="time-notice">
      This password reset link is only valid for the next 24 hours.
    </div>
    
    <div class="message-box">
      <p>If you didn't request a password reset, you can safely ignore this email or contact our support team.</p>
    </div>
  `;

  return getEmailWrapper({
    title: 'Reset Your Password - Tehele',
    children: emailContent,
  });
};

function getEmailVerificationTemplate(
  userName: string,
  verificationLink: string,
) {
  const content = `
    <h1 class="welcome-text">Welcome to Tehele</h1>
    
    <div class="message-box">
        <p>Hello <strong style="color: var(--primary-color)">${userName}</strong>,</p>
        <p>We're thrilled to have you join our community! To get started with your journey, please verify your email address.</p>
    </div>

    <div class="button-container">
        <!--[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${verificationLink}" style="height:50px;v-text-anchor:middle;width:200px;" arcsize="10%" stroke="f" fillcolor="#bb9375">
            <w:anchorlock/>
            <center>
        <![endif]-->
        <a href="${verificationLink}" class="verify-button" style="background-color: #bb9375; color: #ffffff; text-decoration: none;">
            Verify Email Address
        </a>
        <!--[if mso]>
            </center>
        </v:roundrect>
        <![endif]-->
    </div>

    <div class="time-notice">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        This link will expire in 24 hours
    </div>

    <div class="message-box" style="background: #fff5f5; border-color: rgba(187, 147, 117, 0.2);">
        <p style="color: #718096;">If you didn't create an account, you can safely ignore this email.</p>
    </div>
  `;

  return getEmailWrapper({
    title: 'Welcome to Tehele',
    children: content,
  });
}

export {
  getEmailVerificationTemplate,
  getEmailWrapper,
  getOTPEmailTemplate,
  getPasswordResetTemplate,
};
