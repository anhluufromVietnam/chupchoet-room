const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { test } = require('node:test')
const ts = require('typescript')

function loadTypeScript(file, stubs = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8')
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } })
  const module = { exports: {} }
  new Function('require', 'module', 'exports', outputText)((name) => name in stubs ? stubs[name] : require(name), module, module.exports)
  return module.exports
}

const calendar = loadTypeScript('lib/booking-calendar.ts')
const booking = (changes = {}) => ({ id: 'one', code: 'CHUP-ONE', status: 'confirmed', checkIn: '2026-10-06 9:00', checkOut: '2026-10-06 11:00', rentalType: 'hourly', ...changes })

test('calendar uses Vietnam dates independently of the browser/server timezone', () => {
  assert.equal(calendar.studioDateKey(new Date('2026-10-05T18:00:00Z')), '2026-10-06')
  assert.equal(calendar.bookingTimestamp('2026-10-06 9:00'), Date.parse('2026-10-06T02:00:00Z'))
  assert.equal(calendar.bookingOccursOnDate(booking(), '2026-10-06'), true)
  assert.equal(calendar.bookingOccursOnDate(booking(), '2026-10-05'), false)
})

test('multi-day stays appear on every occupied day, with an exclusive checkout boundary', () => {
  const stay = booking({ rentalType: 'daily', checkIn: '2026-10-30 14:00', checkOut: '2026-11-02 12:00' })
  for (const day of ['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02']) assert.equal(calendar.bookingOccursOnDate(stay, day), true)
  assert.equal(calendar.bookingOccursOnDate(stay, '2026-11-03'), false)
  assert.equal(calendar.bookingOccursOnDate(booking({ checkOut: '2026-10-07 0:00' }), '2026-10-07'), false)
})

test('calendar handles legacy overnight times and ignores cancelled or invalid bookings', () => {
  const overnight = booking({ checkIn: '2026-10-06 22:00', checkOut: '2026-10-06 2:00' })
  assert.equal(calendar.bookingOccursOnDate(overnight, '2026-10-07'), true)
  assert.equal(calendar.bookingEndTimestamp(overnight), Date.parse('2026-10-07T02:00:00+07:00'))
  assert.equal(calendar.bookingOccursOnDate(booking({ status: 'cancelled' }), '2026-10-06'), false)
  assert.equal(calendar.bookingOccursOnDate(booking({ checkIn: 'invalid' }), '2026-10-06'), false)
})

test('calendar builds Monday-first months including leap days and year navigation', () => {
  const october = calendar.calendarMonthDays('2026-10')
  assert.deepEqual(october.slice(0, 4), [null, null, null, '2026-10-01'])
  assert.equal(october.filter(Boolean).length, 31)
  assert.equal(october.length % 7, 0)
  assert.equal(calendar.calendarMonthDays('2028-02').filter(Boolean).length, 29)
  assert.equal(calendar.shiftCalendarMonth('2026-12', 1), '2027-01')
  assert.equal(calendar.shiftCalendarMonth('2026-01', -1), '2025-12')
})

test('delete authorization verifies Firebase tokens and configured admin email; fails closed', async () => {
  const { requireBookingAdmin } = loadTypeScript('lib/admin-auth.ts')
  const originalFetch = global.fetch
  const previousEmails = process.env.ROOM_ADMIN_EMAILS
  process.env.ROOM_ADMIN_EMAILS = 'owner@example.com'
  const request = () => new Request('http://localhost/api/bookings/one', { headers: { Authorization: 'Bearer test-token' } })
  try {
    global.fetch = async () => { throw new Error('Missing token must not make a network request') }
    assert.equal((await requireBookingAdmin(new Request('http://localhost'))).status, 401)
    global.fetch = async (_url, init) => {
      assert.deepEqual(JSON.parse(init.body), { idToken: 'test-token' })
      return Response.json({ users: [{ localId: 'admin', email: 'OWNER@example.com' }] })
    }
    assert.equal(await requireBookingAdmin(request()), null)
    global.fetch = async () => Response.json({ users: [{ localId: 'other', email: 'visitor@example.com' }] })
    assert.equal((await requireBookingAdmin(request())).status, 403)
    global.fetch = async () => Response.json({ users: [{ localId: 'admin', email: 'owner@example.com', disabled: true }] })
    assert.equal((await requireBookingAdmin(request())).status, 403)
    global.fetch = async () => Response.json({ error: {} }, { status: 400 })
    assert.equal((await requireBookingAdmin(request())).status, 401)
    global.fetch = async () => { throw new Error('network unavailable') }
    assert.equal((await requireBookingAdmin(request())).status, 503)
  } finally {
    global.fetch = originalFetch
    if (previousEmails === undefined) delete process.env.ROOM_ADMIN_EMAILS
    else process.env.ROOM_ADMIN_EMAILS = previousEmails
  }
})

test('delete route deletes only the selected ID, preserves other data, and supports old records', async () => {
  const original = { rooms: [{ id: 'room' }], bookings: [booking(), booking({ id: 'two' }), booking({ id: undefined, code: 'OLD' })], settings: { payment: {} } }
  let persisted = structuredClone(original)
  let denial = null
  let reads = 0
  const { DELETE } = loadTypeScript('app/api/bookings/[id]/route.ts', {
    '@/lib/admin-auth': { requireBookingAdmin: async () => denial },
    '@/lib/store': {
      readDb: async () => { reads++; return structuredClone(persisted) },
      writeDb: async (db) => { persisted = db },
    },
  })
  const remove = (id) => DELETE(new Request('http://localhost', { method: 'DELETE' }), { params: Promise.resolve({ id }) })
  denial = Response.json({ error: 'unauthorized' }, { status: 401 })
  assert.equal((await remove('one')).status, 401)
  assert.equal(reads, 0)
  denial = null
  assert.equal((await remove('one')).status, 200)
  assert.deepEqual(persisted.bookings.map((item) => item.id), ['two', undefined])
  assert.deepEqual(persisted.rooms, original.rooms)
  assert.deepEqual(persisted.settings, original.settings)
  assert.equal((await remove('one')).status, 404)
  assert.equal((await remove('CHUP-ONE')).status, 404)
  assert.equal((await remove('OLD')).status, 200)
  assert.equal(persisted.bookings.length, 1)
})
