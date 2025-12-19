import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPaymentConfirmation, sendNewOrderNotification } from '@/lib/email'

// Flutterwave Webhook Handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const signature = request.headers.get('verif-hash')
    
    // In production, verify signature
    // const secretHash = process.env.FLUTTERWAVE_SECRET_HASH
    // if (signature !== secretHash) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    
    const event = body.event
    const data = body.data
    
    if (event === 'charge.completed' && data.status === 'successful') {
      const txRef = data.tx_ref
      const metadata = data.meta || {}
      
      // Find order by payment reference
      const order = await prisma.onlineOrder.findFirst({
        where: { paymentReference: txRef },
        include: { 
          store: true, 
          items: true 
        }
      })
      
      if (!order) {
        console.log('Order not found for tx_ref:', txRef)
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
        paymentMethod: 'Flutterwave',
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
    console.error('Flutterwave webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
