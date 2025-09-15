import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const escapeHtml = (unsafe) => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const sendVerificationEmail = async (email, name, hash) => {
  const safeName = escapeHtml(name);
const link = `${process.env.FRONTEND_URL}/verify_email.html?hash=${hash}`;
  try {
    await transporter.sendMail({
      from: `"Folium" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Verifique seu e-mail para confirmar sua conta',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <p>Olá, ${safeName}!</p>
          <p>Clique no botão abaixo para verificar seu e-mail e ativar sua conta:</p>
          <a href="${link}" style="
            display: inline-block;
            padding: 10px 20px;
            background-color: #007BFF;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
          ">Verificar e-mail</a>
          <p style="margin-top: 20px; font-size: 0.9em; color: #666;">
            Se você não solicitou este e-mail, por favor ignore esta mensagem.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Erro ao enviar email de verificação:', error);
    throw error;
  }
};

export default sendVerificationEmail;


