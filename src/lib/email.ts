import nodemailer from 'nodemailer'

export function createTransporter(gmailUser: string, gmailAppPassword: string) {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: gmailUser, pass: gmailAppPassword },
  })
}

export interface SendSummaryOptions {
  to: string
  subject: string
  html: string
  attachments?: Array<{ filename: string; content: Buffer; contentType: string }>
  gmailUser: string
  gmailAppPassword: string
}

export async function sendSummaryEmail(opts: SendSummaryOptions) {
  const transporter = createTransporter(opts.gmailUser, opts.gmailAppPassword)
  await transporter.sendMail({
    from: opts.gmailUser,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    attachments: opts.attachments,
  })
}
