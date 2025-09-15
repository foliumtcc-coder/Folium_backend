import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: Number(process.env.EMAIL_PORT) === 465, // true para porta 465, false para outras
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const sendLoginCode = async (to, code) => {
  try {
    await transporter.sendMail({
      from: `"Folium" <${process.env.GMAIL_USER}>`,
      to,
      subject: "Confirmação de Login",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Confirmação de Login</h2>
          <p>Use o código abaixo para confirmar seu login:</p>
          <div style="font-size: 2em; font-weight: bold; margin: 20px 0;">${code}</div>
          <p>Este código expira em 10 minutos.</p>
          <hr />
          <p style="font-size: 0.8em; color: #666;">Se você não solicitou este código, ignore este e-mail.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Erro ao enviar e-mail de login:', error);
    throw error; // relança para o chamador tratar
  }
};

export default sendLoginCode;

