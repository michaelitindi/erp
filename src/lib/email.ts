import { Resend } from 'resend'

// Initialize Resend - will use RESEND_API_KEY from env
const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.FROM_EMAIL || 'orders@resend.dev'
const COMPANY_NAME = process.env.COMPANY_NAME || 'ERP Store'

// ================================
// ORDER CONFIRMATION EMAIL
// ================================
interface OrderItem {
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface OrderConfirmationData {
  orderNumber: string
  customerName: string
  customerEmail: string
  storeName: string
  items: OrderItem[]
  subtotal: number
  tax: number
  shipping: number
  total: number
  shippingAddress: string
  paymentMethod: string
  trackingUrl: string
}

export async function sendOrderConfirmation(data: OrderConfirmationData) {
  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.productName}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.unitPrice.toFixed(2)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.totalPrice.toFixed(2)}</td>
    </tr>
  `).join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Order Confirmed! ✓</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">${data.storeName}</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 32px;">
          <p style="color: #374151; font-size: 16px; margin: 0 0 24px;">
            Hi ${data.customerName},<br><br>
            Thank you for your order! We've received your order and will begin processing it shortly.
          </p>
          
          <!-- Order Info -->
          <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Order Number</p>
            <p style="margin: 4px 0 0; color: #111827; font-size: 20px; font-weight: 600; font-family: monospace;">${data.orderNumber}</p>
          </div>
          
          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280;">Item</th>
                <th style="padding: 12px; text-align: center; font-size: 12px; text-transform: uppercase; color: #6b7280;">Qty</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; text-transform: uppercase; color: #6b7280;">Price</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; text-transform: uppercase; color: #6b7280;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <!-- Totals -->
          <div style="border-top: 2px solid #e5e7eb; padding-top: 16px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #6b7280;">Subtotal</span>
              <span style="color: #374151;">$${data.subtotal.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #6b7280;">Tax</span>
              <span style="color: #374151;">$${data.tax.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
              <span style="color: #6b7280;">Shipping</span>
              <span style="color: #374151;">$${data.shipping.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: 600;">
              <span style="color: #111827;">Total</span>
              <span style="color: #111827;">$${data.total.toFixed(2)}</span>
            </div>
          </div>
          
          <!-- Shipping Address -->
          <div style="margin-top: 24px; padding: 16px; background: #f9fafb; border-radius: 8px;">
            <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; text-transform: uppercase;">Shipping Address</p>
            <p style="margin: 0; color: #374151;">${data.shippingAddress}</p>
          </div>
          
          <!-- Payment Method -->
          <div style="margin-top: 16px; padding: 16px; background: #f9fafb; border-radius: 8px;">
            <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; text-transform: uppercase;">Payment Method</p>
            <p style="margin: 0; color: #374151;">${data.paymentMethod}</p>
          </div>
          
          <!-- Track Order Button -->
          <div style="text-align: center; margin-top: 32px;">
            <a href="${data.trackingUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Track Your Order</a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            Questions? Reply to this email or contact our support team.
          </p>
          <p style="margin: 8px 0 0; color: #9ca3af; font-size: 12px;">
            © ${new Date().getFullYear()} ${data.storeName}. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `Order Confirmed - ${data.orderNumber}`,
      html,
    })
    return { success: true, id: result.data?.id }
  } catch (error) {
    console.error('Failed to send order confirmation email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ================================
// PAYMENT CONFIRMATION EMAIL
// ================================
interface PaymentConfirmationData {
  orderNumber: string
  customerName: string
  customerEmail: string
  storeName: string
  amount: number
  paymentMethod: string
  trackingUrl: string
}

export async function sendPaymentConfirmation(data: PaymentConfirmationData) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Payment Received! 💰</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">${data.storeName}</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 32px; text-align: center;">
          <p style="color: #374151; font-size: 16px; margin: 0 0 24px;">
            Hi ${data.customerName},<br><br>
            We've received your payment of <strong>$${data.amount.toFixed(2)}</strong> for order <strong>${data.orderNumber}</strong>.
          </p>
          
          <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 24px; margin: 24px 0;">
            <p style="margin: 0; color: #166534; font-size: 14px;">✓ Payment confirmed via ${data.paymentMethod}</p>
            <p style="margin: 8px 0 0; color: #166534; font-size: 14px;">✓ Your order is now being processed</p>
          </div>
          
          <a href="${data.trackingUrl}" style="display: inline-block; background: #10b981; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Track Your Order</a>
        </div>
        
        <!-- Footer -->
        <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #9ca3af; font-size: 12px;">
            © ${new Date().getFullYear()} ${data.storeName}. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `Payment Received - ${data.orderNumber}`,
      html,
    })
    return { success: true, id: result.data?.id }
  } catch (error) {
    console.error('Failed to send payment confirmation email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ================================
// SHIPPING UPDATE EMAIL
// ================================
interface ShippingUpdateData {
  orderNumber: string
  customerName: string
  customerEmail: string
  storeName: string
  status: 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED'
  trackingNumber?: string
  carrier?: string
  trackingUrl: string
}

const shippingStatuses = {
  SHIPPED: { icon: '📦', title: 'Your Order Has Shipped!', message: 'Your order is on its way.' },
  OUT_FOR_DELIVERY: { icon: '🚚', title: 'Out for Delivery!', message: 'Your order will arrive today.' },
  DELIVERED: { icon: '✅', title: 'Order Delivered!', message: 'Your order has been delivered.' },
}

export async function sendShippingUpdate(data: ShippingUpdateData) {
  const statusInfo = shippingStatuses[data.status]
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${statusInfo.icon} ${statusInfo.title}</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">${data.storeName}</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 32px; text-align: center;">
          <p style="color: #374151; font-size: 16px; margin: 0 0 24px;">
            Hi ${data.customerName},<br><br>
            ${statusInfo.message}
          </p>
          
          <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Order Number</p>
            <p style="margin: 4px 0 0; color: #111827; font-size: 18px; font-weight: 600; font-family: monospace;">${data.orderNumber}</p>
            ${data.trackingNumber ? `
              <p style="margin: 16px 0 0; color: #6b7280; font-size: 14px;">Tracking Number</p>
              <p style="margin: 4px 0 0; color: #111827; font-size: 16px; font-family: monospace;">${data.trackingNumber}</p>
              ${data.carrier ? `<p style="margin: 4px 0 0; color: #6b7280; font-size: 14px;">via ${data.carrier}</p>` : ''}
            ` : ''}
          </div>
          
          <a href="${data.trackingUrl}" style="display: inline-block; background: #8b5cf6; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Track Your Order</a>
        </div>
        
        <!-- Footer -->
        <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #9ca3af; font-size: 12px;">
            © ${new Date().getFullYear()} ${data.storeName}. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `${statusInfo.title} - ${data.orderNumber}`,
      html,
    })
    return { success: true, id: result.data?.id }
  } catch (error) {
    console.error('Failed to send shipping update email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ================================
// NEW ORDER NOTIFICATION (ADMIN)
// ================================
interface NewOrderNotificationData {
  orderNumber: string
  customerName: string
  customerEmail: string
  storeName: string
  total: number
  itemCount: number
  adminEmail: string
  dashboardUrl: string
}

export async function sendNewOrderNotification(data: NewOrderNotificationData) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🛒 New Order Received!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">${data.storeName}</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 32px;">
          <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 24px; text-align: center;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">Order</p>
            <p style="margin: 4px 0; color: #78350f; font-size: 24px; font-weight: 700; font-family: monospace;">${data.orderNumber}</p>
            <p style="margin: 0; color: #92400e; font-size: 14px;">${data.itemCount} item(s) • $${data.total.toFixed(2)}</p>
          </div>
          
          <div style="margin-top: 24px; padding: 16px; background: #f9fafb; border-radius: 8px;">
            <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; text-transform: uppercase;">Customer</p>
            <p style="margin: 0; color: #374151; font-weight: 500;">${data.customerName}</p>
            <p style="margin: 4px 0 0; color: #6b7280;">${data.customerEmail}</p>
          </div>
          
          <div style="text-align: center; margin-top: 32px;">
            <a href="${data.dashboardUrl}" style="display: inline-block; background: #f59e0b; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Order in Dashboard</a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #9ca3af; font-size: 12px;">
            This is an automated notification from your ERP system.
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.adminEmail,
      subject: `📦 New Order: ${data.orderNumber} - $${data.total.toFixed(2)}`,
      html,
    })
    return { success: true, id: result.data?.id }
  } catch (error) {
    console.error('Failed to send new order notification:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ================================
// FEEDBACK STATUS CHANGE EMAIL
// ================================
interface FeedbackStatusChangeData {
  feedbackTitle: string
  feedbackId: string
  authorName: string
  authorEmail: string
  oldStatus: string
  newStatus: string
  feedbackUrl: string
}

const statusLabels: Record<string, { label: string; color: string; emoji: string }> = {
  UNDER_REVIEW: { label: 'Under Review', color: '#eab308', emoji: '🔍' },
  PLANNED: { label: 'Planned', color: '#3b82f6', emoji: '📋' },
  IN_PROGRESS: { label: 'In Progress', color: '#8b5cf6', emoji: '🚀' },
  COMPLETED: { label: 'Completed', color: '#22c55e', emoji: '✅' },
  DECLINED: { label: 'Declined', color: '#6b7280', emoji: '❌' },
}

export async function sendFeedbackStatusChange(data: FeedbackStatusChangeData) {
  const newStatusInfo = statusLabels[data.newStatus] || statusLabels.UNDER_REVIEW
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, ${newStatusInfo.color}, ${newStatusInfo.color}dd); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${newStatusInfo.emoji} Status Updated!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Your feedback has a new status</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 32px;">
          <p style="color: #374151; font-size: 16px; margin: 0 0 24px;">
            Hi ${data.authorName},<br><br>
            Great news! Your feedback has been reviewed and its status has been updated.
          </p>
          
          <!-- Feedback Title -->
          <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Your Feedback</p>
            <p style="margin: 4px 0 0; color: #111827; font-size: 18px; font-weight: 600;">${data.feedbackTitle}</p>
          </div>
          
          <!-- Status Change -->
          <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">New Status</p>
            <p style="margin: 8px 0 0; color: ${newStatusInfo.color}; font-size: 24px; font-weight: 700;">
              ${newStatusInfo.emoji} ${newStatusInfo.label}
            </p>
          </div>
          
          <div style="text-align: center;">
            <a href="${data.feedbackUrl}" style="display: inline-block; background: ${newStatusInfo.color}; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Your Feedback</a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            Thank you for helping us improve!
          </p>
          <p style="margin: 8px 0 0; color: #9ca3af; font-size: 12px;">
            You're receiving this because you submitted feedback.
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.authorEmail,
      subject: `${newStatusInfo.emoji} Your feedback is now "${newStatusInfo.label}"`,
      html,
    })
    return { success: true, id: result.data?.id }
  } catch (error) {
    console.error('Failed to send feedback status change email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

