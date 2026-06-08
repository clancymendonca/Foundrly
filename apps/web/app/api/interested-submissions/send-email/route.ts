import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { getTransporter, isEmailConfigured } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!isEmailConfigured()) {
      return NextResponse.json({ success: false, error: 'Email not configured' }, { status: 500 });
    }

    const { to, subject, body, html } = await req.json();
    if (!to || !subject || (!body && !html)) {
      return NextResponse.json({ success: false, error: 'Missing to, subject, and body/html' }, { status: 400 });
    }

    const transporter = getTransporter();

    const mailOptions: any = {
      from: `Foundrly <${process.env.SMTP_USER}>`,
      to,
      subject,
      replyTo: session.user.email || undefined,
    };

    if (html) {
      mailOptions.html = html;
      if (body) mailOptions.text = body;
    } else {
      mailOptions.text = body;
    }

    const result = await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to send email' }, { status: 500 });
  }
}


