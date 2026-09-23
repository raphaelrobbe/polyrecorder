import nodemailer from 'nodemailer'
import { getSmtpConfig } from './env.server'

export async function sendMail(options: {
  to: string
  subject: string
  text: string
  html: string
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const smtp = getSmtpConfig()
  if (!smtp) {
    if (process.env.NODE_ENV === 'production') {
      return { ok: false, reason: 'smtp_not_configured' }
    }
    console.info('[email:dev] SMTP not configured — message dumped:\n', {
      to: options.to,
      subject: options.subject,
      text: options.text,
    })
    return { ok: true }
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  })

  try {
    await transporter.sendMail({
      from: smtp.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    })
    return { ok: true }
  } catch (error) {
    console.error('[email] send failed', error)
    return { ok: false, reason: 'send_failed' }
  }
}
