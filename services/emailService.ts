
import { Resend } from "resend";
import { WelcomeEmail } from "../emails/WelcomeEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(to: string, name: string) {
  try {
    const data = await resend.emails.send({
      from: "CupCircle <support@cupcircle.co>",
      to,
      subject: "Welcome to CupCircle ☕",
      react: WelcomeEmail({ name }),
    });
    console.log("Welcome email sent:", data);
    return data;
  } catch (error) {
    console.error("Error sending welcome email:", error);
    throw error;
  }
}
