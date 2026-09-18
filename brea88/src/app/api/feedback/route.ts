import { NextResponse } from 'next/server';
import { Resend } from 'resend';

function cleanString(value: unknown): string {
  return typeof value === 'string'
    ? value.trim()
    : '';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function POST(request: Request) {
  try {
    const contentLength = request.headers.get(
      'content-length',
    );

    if (
      contentLength &&
      Number(contentLength) > 2 * 1024 * 1024
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Feedback message is too large.',
        },
        { status: 413 },
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request body.',
        },
        { status: 400 },
      );
    }

    if (
      typeof body !== 'object' ||
      body === null ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid feedback data.',
        },
        { status: 400 },
      );
    }

    const data =
      body as Record<string, unknown>;

    const message = cleanString(data.message);

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Please enter your feedback.',
        },
        { status: 400 },
      );
    }

    const resendApiKey = cleanString(
      process.env.RESEND_API_KEY,
    );

    const fromEmail = cleanString(
      process.env.RESEND_FROM_EMAIL,
    );

    const feedbackToEmail = cleanString(
      process.env.FEEDBACK_TO_EMAIL,
    );

    if (
      !resendApiKey ||
      !fromEmail ||
      !feedbackToEmail
    ) {
      console.error(
        '[Feedback] Email configuration is missing.',
      );

      return NextResponse.json(
        {
          success: false,
          message:
            'Feedback service is not configured.',
        },
        { status: 500 },
      );
    }

    const resend = new Resend(
      resendApiKey,
    );

    const safeMessage =
      escapeHtml(message);

    const submittedAt =
      new Date().toLocaleString(
        'en-PH',
        {
          dateStyle: 'long',
          timeStyle: 'short',
        },
      );

    const safeSubmittedAt =
      escapeHtml(submittedAt);

    const result =
      await resend.emails.send({
        from: fromEmail,
        to: [feedbackToEmail],
        subject:
          'New Website Feedback — BREA 88 REALTY',

        text: `BREA 88 REALTY
Website Feedback

Anonymous Feedback

${message}

Submitted:
${submittedAt}

This feedback was submitted anonymously through the BREA 88 website.

BREA 88 REALTY
Service with a Heart`,

        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
              />
              <meta charset="UTF-8" />
              <title>BREA 88 Website Feedback</title>
            </head>

            <body
              style="
                margin:0;
                padding:0;
                background:#f1f5f9;
                font-family:
                  -apple-system,
                  BlinkMacSystemFont,
                  'Segoe UI',
                  Arial,
                  Helvetica,
                  sans-serif;
                color:#0f172a;
              "
            >

              <!-- Outer Container -->
              <table
                role="presentation"
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  width:100%;
                  background:#f1f5f9;
                  margin:0;
                  padding:0;
                "
              >
                <tr>
                  <td
                    align="center"
                    style="
                      padding:42px 16px;
                    "
                  >

                    <!-- Main Card -->
                    <table
                      role="presentation"
                      width="620"
                      cellpadding="0"
                      cellspacing="0"
                      border="0"
                      style="
                        width:100%;
                        max-width:620px;
                        background:#ffffff;
                        border-radius:24px;
                        overflow:hidden;
                        border:1px solid #e2e8f0;
                        box-shadow:
                          0 20px 50px rgba(15,23,42,0.08);
                      "
                    >

                      <!-- Header -->
                      <tr>
                        <td
                          style="
                            background:
                              linear-gradient(
                                135deg,
                                #071936 0%,
                                #0d274f 100%
                              );
                            padding:34px 36px;
                          "
                        >

                          <table
                            role="presentation"
                            width="100%"
                            cellpadding="0"
                            cellspacing="0"
                            border="0"
                          >
                            <tr>

                              <td
                                style="
                                  vertical-align:middle;
                                "
                              >
                                <div
                                  style="
                                    font-size:12px;
                                    line-height:18px;
                                    letter-spacing:2px;
                                    text-transform:uppercase;
                                    color:#cbd5e1;
                                    font-weight:700;
                                  "
                                >
                                  BREA 88 REALTY
                                </div>

                                <div
                                  style="
                                    margin-top:8px;
                                    font-size:28px;
                                    line-height:36px;
                                    color:#ffffff;
                                    font-weight:800;
                                    letter-spacing:-0.5px;
                                  "
                                >
                                  Website Feedback
                                </div>

                                <div
                                  style="
                                    margin-top:7px;
                                    font-size:14px;
                                    line-height:22px;
                                    color:#cbd5e1;
                                  "
                                >
                                  A new message has been
                                  submitted through your
                                  website.
                                </div>
                              </td>

                            </tr>
                          </table>

                        </td>
                      </tr>

                      <!-- Content -->
                      <tr>
                        <td
                          style="
                            padding:34px 36px 30px;
                          "
                        >

                          <!-- Anonymous Label -->
                          <table
                            role="presentation"
                            cellpadding="0"
                            cellspacing="0"
                            border="0"
                          >
                            <tr>
                              <td
                                style="
                                  background:#f8fafc;
                                  border:1px solid #e2e8f0;
                                  border-radius:999px;
                                  padding:7px 13px;
                                "
                              >
                                <span
                                  style="
                                    font-size:12px;
                                    line-height:18px;
                                    color:#475569;
                                    font-weight:700;
                                    letter-spacing:0.3px;
                                  "
                                >
                                  ● &nbsp;ANONYMOUS FEEDBACK
                                </span>
                              </td>
                            </tr>
                          </table>

                          <!-- Feedback Heading -->
                          <div
                            style="
                              margin-top:26px;
                              font-size:13px;
                              line-height:20px;
                              color:#64748b;
                              font-weight:700;
                              text-transform:uppercase;
                              letter-spacing:1px;
                            "
                          >
                            Feedback Message
                          </div>

                          <!-- Feedback Box -->
                          <div
                            style="
                              margin-top:10px;
                              padding:24px;
                              background:#f8fafc;
                              border:1px solid #e2e8f0;
                              border-radius:18px;
                            "
                          >
                            <div
                              style="
                                font-size:17px;
                                line-height:30px;
                                color:#1e293b;
                                white-space:pre-wrap;
                                word-break:break-word;
                              "
                            >
                              ${safeMessage}
                            </div>
                          </div>

                          <!-- Date -->
                          <table
                            role="presentation"
                            width="100%"
                            cellpadding="0"
                            cellspacing="0"
                            border="0"
                            style="
                              margin-top:18px;
                            "
                          >
                            <tr>

                              <td
                                width="44"
                                style="
                                  width:44px;
                                  vertical-align:top;
                                "
                              >
                                <div
                                  style="
                                    width:36px;
                                    height:36px;
                                    line-height:36px;
                                    text-align:center;
                                    background:#f1f5f9;
                                    border-radius:10px;
                                    color:#475569;
                                    font-size:16px;
                                  "
                                >
                                  ◷
                                </div>
                              </td>

                              <td
                                style="
                                  vertical-align:top;
                                  padding-left:10px;
                                "
                              >
                                <div
                                  style="
                                    font-size:12px;
                                    line-height:18px;
                                    color:#64748b;
                                    font-weight:600;
                                  "
                                >
                                  Submitted
                                </div>

                                <div
                                  style="
                                    margin-top:2px;
                                    font-size:14px;
                                    line-height:22px;
                                    color:#0f172a;
                                    font-weight:700;
                                  "
                                >
                                  ${safeSubmittedAt}
                                </div>
                              </td>

                            </tr>
                          </table>

                          <!-- Privacy Notice -->
                          <div
                            style="
                              margin-top:28px;
                              padding-top:22px;
                              border-top:1px solid #e2e8f0;
                              font-size:12px;
                              line-height:20px;
                              color:#94a3b8;
                            "
                          >
                            This feedback was submitted
                            anonymously through the BREA 88
                            website. No name or email address
                            was requested.
                          </div>

                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td
                          align="center"
                          style="
                            background:#f8fafc;
                            border-top:1px solid #e2e8f0;
                            padding:24px 30px;
                          "
                        >

                          <div
                            style="
                              font-size:13px;
                              line-height:20px;
                              color:#0f172a;
                              font-weight:800;
                              letter-spacing:0.5px;
                            "
                          >
                            BREA 88 REALTY
                          </div>

                          <div
                            style="
                              margin-top:4px;
                              font-size:12px;
                              line-height:18px;
                              color:#64748b;
                            "
                          >
                            Service with a Heart
                          </div>

                        </td>
                      </tr>

                    </table>

                    <!-- Bottom Text -->
                    <div
                      style="
                        max-width:620px;
                        margin-top:16px;
                        text-align:center;
                        font-size:11px;
                        line-height:18px;
                        color:#94a3b8;
                      "
                    >
                      BREA 88 REALTY OPC &nbsp;•&nbsp;
                      Website Feedback
                    </div>

                  </td>
                </tr>
              </table>

            </body>
          </html>
        `,
      });

    if (result.error) {
      console.error(
        '[Feedback] Resend error:',
        result.error,
      );

      return NextResponse.json(
        {
          success: false,
          message:
            'Failed to send feedback email.',
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          'Feedback submitted successfully.',
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      '[Feedback] POST error:',
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to submit feedback.',
      },
      { status: 500 },
    );
  }
}