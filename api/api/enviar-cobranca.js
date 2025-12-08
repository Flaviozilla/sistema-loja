// api/enviar-cobranca.js
import nodemailer from 'nodemailer';

const EMAIL_LOJA = process.env.EMAIL_LOJA;     // ex: corvaum87@gmail.com
const EMAIL_SENHA = process.env.EMAIL_SENHA;   // senha de app do Gmail

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { emailCliente, assunto, corpo } = req.body || {};

    if (!emailCliente) {
      return res.status(400).json({ error: 'E-mail do cliente não informado' });
    }

    if (!EMAIL_LOJA || !EMAIL_SENHA) {
      return res.status(500).json({
        error: 'Variáveis de ambiente EMAIL_LOJA e/ou EMAIL_SENHA não configuradas',
      });
    }

    // Configuração do Gmail (usando senha de app)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_LOJA,
        pass: EMAIL_SENHA,
      },
    });

    await transporter.sendMail({
      from: `"Wolf Artigos Militares" <${EMAIL_LOJA}>`,
      to: emailCliente,
      subject: assunto || 'Lembrete de pendência - Wolf Artigos Militares',
      text: corpo,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Erro ao enviar e-mail:', err);
    return res.status(500).json({ error: 'Falha ao enviar e-mail' });
  }
}
