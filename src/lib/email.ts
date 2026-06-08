import nodemailer from 'nodemailer'

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
}

export interface SendSummaryOptions {
  to: string
  subject: string
  html: string
  attachments?: Array<{ filename: string; content: Buffer; contentType: string }>
}

export async function sendSummaryEmail(opts: SendSummaryOptions) {
  const transporter = createTransporter()
  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    attachments: opts.attachments,
  })
}
