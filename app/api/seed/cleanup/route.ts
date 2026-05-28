import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const DOMAIN = '@test.grabcollab.com'

export async function POST() {
  if (process.env.ENABLE_SEED_ROUTE !== 'true') {
    return NextResponse.json({ error: 'Seed route is disabled.' }, { status: 403 })
  }

  const db = createAdminClient()

  try {
    // Find test auth user IDs
    const { data: allUsers } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const testUsers = (allUsers?.users ?? []).filter(u => u.email?.endsWith(DOMAIN))
    const testIds = testUsers.map(u => u.id)

    if (!testIds.length) {
      return NextResponse.json({ ok: true, message: 'No test accounts found — nothing to clean up.' })
    }

    // Get test profile IDs for FK-safe deletion
    const { data: creatorProfiles } = await db.from('creator_profiles').select('id').in('user_id', testIds)
    const { data: brandProfiles }   = await db.from('brand_profiles').select('id').in('user_id', testIds)
    const creatorIds = (creatorProfiles ?? []).map(p => p.id)
    const brandIds   = (brandProfiles ?? []).map(p => p.id)

    // Get conversation IDs involving test users
    const orParts: string[] = []
    if (creatorIds.length) orParts.push(`creator_id.in.(${creatorIds.join(',')})`)
    if (brandIds.length)   orParts.push(`brand_id.in.(${brandIds.join(',')})`)
    let convoIds: string[] = []
    if (orParts.length) {
      const { data: convos } = await db.from('conversations').select('id').or(orParts.join(','))
      convoIds = (convos ?? []).map(c => c.id)
    }

    // Get campaign IDs
    const { data: camps } = brandIds.length
      ? await db.from('campaigns').select('id').in('brand_id', brandIds)
      : { data: [] }
    const campIds = (camps ?? []).map(c => c.id)

    // Delete in reverse FK order
    if (convoIds.length) await db.from('messages').delete().in('conversation_id', convoIds)
    if (convoIds.length) await db.from('conversations').delete().in('id', convoIds)
    if (campIds.length)  await db.from('applications').delete().in('campaign_id', campIds)
    if (creatorIds.length) await db.from('applications').delete().in('creator_id', creatorIds)
    if (campIds.length)  await db.from('campaigns').delete().in('id', campIds)
    if (creatorIds.length) await db.from('content_packages').delete().in('creator_id', creatorIds)
    if (testIds.length)  await db.from('notifications').delete().in('user_id', testIds)
    if (testIds.length)  await db.from('feedback').delete().in('user_id', testIds)
    if (creatorIds.length) await db.from('creator_profiles').delete().in('id', creatorIds)
    if (brandIds.length) await db.from('brand_profiles').delete().in('id', brandIds)
    if (testIds.length)  await db.from('users').delete().in('id', testIds)

    // Finally delete auth users
    await Promise.all(testIds.map(id => db.auth.admin.deleteUser(id)))

    return NextResponse.json({
      ok: true,
      message: `🗑️ Cleaned up ${testIds.length} test accounts.`,
      deleted: testUsers.map(u => u.email),
    })

  } catch (err: any) {
    console.error('[SEED CLEANUP ERROR]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
