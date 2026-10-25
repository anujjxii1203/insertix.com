import nodemailer from "nodemailer";

interface ContactNotificationParams {
  name: string;
  email: string;
  phone: string;
  service: string;
  budget: string;
  message: string;
}

export async function sendContactEmailNotification(params: ContactNotificationParams): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || "admin@insertixmedia.com";

  // If credentials are not configured, log cleanly without throwing
  if (!user || !pass) {
    console.log(
      `[Nodemailer Mock] New Contact lead from ${params.name} (${params.email}) for service "${params.service}". SMTP credentials not provided in .env; skipping actual dispatch.`
    );
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"Insertix Media Leads" <${user}>`,
      to: adminEmail,
      subject: `⚡ New Project Inquiry: ${params.name} - ${params.service}`,
      html: `
        <div style="font-family: sans-serif; background: #0c0c12; color: #f3f3f5; padding: 32px; border-radius: 12px; max-width: 600px; margin: auto;">
          <h2 style="color: #ccff00; margin-top: 0;">⚡ New Lead for Insertix Media</h2>
          <hr style="border: 1px solid #222;" />
          <p><strong>Name:</strong> ${params.name}</p>
          <p><strong>Email:</strong> ${params.email}</p>
          <p><strong>Phone:</strong> ${params.phone}</p>
          <p><strong>Service:</strong> ${params.service}</p>
          <p><strong>Budget:</strong> ${params.budget}</p>
          <p><strong>Message:</strong></p>
          <blockquote style="background: #171722; padding: 16px; border-left: 4px solid #ccff00; border-radius: 6px; margin: 0;">
            ${params.message}
          </blockquote>
          <p style="margin-top: 24px; font-size: 12px; color: #888;">
            Sent automatically from Insertix Media Web Platform.
          </p>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error("Failed to send contact notification email:", error);
    return false;
  }
}
