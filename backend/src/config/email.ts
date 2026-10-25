import nodemailer from "nodemailer";

export async function sendContactEmailNotification(data: {
  name: string;
  email: string;
  phone: string;
  service: string;
  budget: string;
  message: string;
}) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL;

  if (!host || !user || !pass || !adminEmail) {
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #D40000; border-bottom: 2px solid #D40000; padding-bottom: 10px;">New Project Inquiry - Insertix Media</h2>
        <p><strong>Client Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
        <p><strong>Phone:</strong> <a href="tel:${data.phone}">${data.phone}</a></p>
        <p><strong>Target Service:</strong> ${data.service}</p>
        <p><strong>Estimated Budget:</strong> ${data.budget}</p>
        <p><strong>Scope / Message:</strong></p>
        <div style="background-color: #f8f8f8; padding: 15px; border-radius: 6px; white-space: pre-wrap;">${data.message}</div>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888;">This inquiry was submitted from the Insertix Media website.</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Insertix Media Leads" <${user}>`,
      to: adminEmail,
      subject: `🚨 [New Lead] ${data.service} - ${data.name}`,
      html: htmlContent,
    });
    console.log(`Email notification sent to ${adminEmail}`);
  } catch (error) {
    console.error("Failed to send lead email notification:", error);
  }
}
