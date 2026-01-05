import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { prisma } from '@/lib/prisma'

type WebhookEvent = {
  type: string
  data: {
    id: string
    organization: {
      id: string
      name: string
    }
    public_user_data: {
      user_id: string
      first_name: string | null
      last_name: string | null
      identifier: string // email
    }
    role: string
  }
}

// Auto-generate employee number
async function generateEmployeeNumber(orgId: string): Promise<string> {
  const last = await prisma.employee.findFirst({
    where: { organizationId: orgId },
    orderBy: { employeeNumber: 'desc' },
    select: { employeeNumber: true }
  })
  if (!last) return 'EMP-000001'
  const lastNum = parseInt(last.employeeNumber.replace('EMP-', '')) || 0
  return `EMP-${String(lastNum + 1).padStart(6, '0')}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const svixHeaders = {
      'svix-id': request.headers.get('svix-id') || '',
      'svix-timestamp': request.headers.get('svix-timestamp') || '',
      'svix-signature': request.headers.get('svix-signature') || '',
    }

    // Verify webhook (optional in development)
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
    let event: WebhookEvent

    if (webhookSecret) {
      const wh = new Webhook(webhookSecret)
      event = wh.verify(body, svixHeaders) as WebhookEvent
    } else {
      // Development mode - no verification
      event = JSON.parse(body)
    }

    // Handle organization membership created
    if (event.type === 'organizationMembership.created') {
      const { organization, public_user_data, role } = event.data
      const clerkOrgId = organization.id
      const clerkUserId = public_user_data.user_id
      const email = public_user_data.identifier
      const firstName = public_user_data.first_name || 'New'
      const lastName = public_user_data.last_name || 'Employee'

      // Find organization in our database
      let org = await prisma.organization.findUnique({
        where: { clerkOrgId }
      })

      // Create org if not exists (for first member/admin)
      if (!org) {
        org = await prisma.organization.create({
          data: {
            clerkOrgId,
            name: organization.name || 'Organization',
            slug: clerkOrgId.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          }
        })
      }

      // Check if employee already exists for this user
      const existingEmployee = await prisma.employee.findFirst({
        where: {
          organizationId: org.id,
          clerkUserId,
          deletedAt: null,
        }
      })

      if (existingEmployee) {
        return NextResponse.json({ message: 'Employee already exists' })
      }

      // Create employee record
      const employeeNumber = await generateEmployeeNumber(org.id)
      
      await prisma.employee.create({
        data: {
          organizationId: org.id,
          clerkUserId,
          employeeNumber,
          firstName,
          lastName,
          email,
          position: role === 'org:admin' ? 'Administrator' : 'Team Member',
          employmentType: 'FULL_TIME',
          hireDate: new Date(),
          status: 'ACTIVE',
          createdBy: clerkUserId,
        }
      })

      console.log(`Created employee ${employeeNumber} for user ${clerkUserId}`)
      return NextResponse.json({ message: 'Employee created successfully' })
    }

    // Handle membership deleted - soft delete employee
    if (event.type === 'organizationMembership.deleted') {
      const { organization, public_user_data } = event.data
      
      const org = await prisma.organization.findUnique({
        where: { clerkOrgId: organization.id }
      })

      if (org) {
        await prisma.employee.updateMany({
          where: {
            organizationId: org.id,
            clerkUserId: public_user_data.user_id,
            deletedAt: null,
          },
          data: {
            status: 'TERMINATED',
            terminationDate: new Date(),
            deletedAt: new Date(),
          }
        })
      }

      return NextResponse.json({ message: 'Employee deactivated' })
    }

    return NextResponse.json({ message: 'Event received' })
  } catch (error) {
    console.error('Clerk webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
