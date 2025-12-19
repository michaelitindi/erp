import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPaymentConfirmation, sendNewOrderNotification } from '@/lib/email'

// Stripe Webhook Handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')
    
    // In production, verify signature with Stripe SDK
    // const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    
    const event = JSON.parse(body)
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const sessionId = session.id
      const metadata = session.metadata || {}
      
      // Find order by payment reference (session ID)
      const order = await prisma.onlineOrder.findFirst({
        where: { paymentReference: sessionId },
        include: { 
          store: true, 
          items: true 
        }
      })
      
      if (!order) {
        console.log('Order not found for session:', sessionId)
        return NextResponse.json({ message: 'Order not found' })
      }
      
      if (order.paymentStatus === 'PAID') {
        return NextResponse.json({ message: 'Already processed' })
      }
      
      // Update order status
      await prisma.onlineOrder.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          status: 'CONFIRMED',
          paidAt: new Date(),
        }
      })
      
      // Send confirmation emails
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const trackingUrl = `${baseUrl}/store/${order.store.slug}/order/${order.orderNumber}`
      
      await sendPaymentConfirmation({
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        storeName: order.store.name,
        amount: Number(order.totalAmount),
        paymentMethod: 'Stripe',
        trackingUrl,
      })
      
      // Send admin notification
      const adminEmail = process.env.ADMIN_EMAIL
      if (adminEmail) {
        await sendNewOrderNotification({
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          storeName: order.store.name,
          total: Number(order.totalAmount),
          itemCount: order.items.length,
          adminEmail,
          dashboardUrl: `${baseUrl}/dashboard/ecommerce`,
        })
      }
      
      return NextResponse.json({ message: 'Payment processed successfully' })
    }
    
    return NextResponse.json({ message: 'Event received' })
  } catch (error) {
    console.error('Stripe webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
