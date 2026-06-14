// scripts/inspect-excel.ts
import * as XLSX from 'xlsx'
import path from 'path'

const FILE = path.join(__dirname, '..', 'ADMIN-Javi-WorldCup-2026.xlsx')
const wb = XLSX.readFile(FILE)

console.log('\n=== SHEET NAMES ===')
console.log(wb.SheetNames)

// Inspect WORLDCUP sheet header rows (first 5 rows, first 60 cols)
const ws = wb.Sheets['WORLDCUP']
if (!ws) { console.error('Sheet WORLDCUP not found'); process.exit(1) }

const data = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: '' }) as string[][]

console.log('\n=== WORLDCUP sheet — rows 1-10, cols A-BZ ===')
data.slice(0, 10).forEach((row, i) => {
  console.log(`Row ${i + 1}:`, row.slice(0, 78).map((v, j) => v ? `[${XLSX.utils.encode_col(j)}:${v}]` : '').filter(Boolean).join(' '))
})

// Also show rows 11-20
console.log('\n=== WORLDCUP sheet — rows 11-20, cols A-BZ ===')
data.slice(10, 20).forEach((row, i) => {
  console.log(`Row ${i + 11}:`, row.slice(0, 78).map((v, j) => v ? `[${XLSX.utils.encode_col(j)}:${v}]` : '').filter(Boolean).join(' '))
})

// Show total row count
console.log(`\nTotal rows: ${data.length}`)

// Look for rows that might have participant names (contain known names)
const knownNames = ['Joss', 'Josete', 'Crespo', 'SaTa', 'Guille', 'Hugo', 'ALMAN', 'Rier', 'Foca', 'CEICH', 'Popi', 'Javier', 'Mario']
console.log('\n=== Searching for participant name rows ===')
data.forEach((row, i) => {
  const rowStr = row.join(' ')
  const found = knownNames.filter(n => rowStr.includes(n))
  if (found.length > 2) {
    console.log(`Row ${i + 1} has names: ${found.join(', ')}`)
    console.log('  Full row (cols with values):', row.slice(0, 100).map((v, j) => v ? `[${XLSX.utils.encode_col(j)}:${v}]` : '').filter(Boolean).join(' '))
  }
})

// Also inspect ADMIN sheet for participant names
const admin = wb.Sheets['ADMIN']
if (admin) {
  const adminData = XLSX.utils.sheet_to_json<string[]>(admin, { header: 1, defval: '' }) as string[][]
  console.log('\n=== ADMIN sheet — all rows with values ===')
  adminData.slice(0, 15).forEach((row, i) => {
    const vals = row.map((v, j) => v ? `[${XLSX.utils.encode_col(j)}:${v}]` : '').filter(Boolean)
    if (vals.length > 0) {
      console.log(`Row ${i + 1}:`, vals.join(' '))
    }
  })
}

// Look at all sheet names and print first few rows of each
console.log('\n=== ALL SHEETS summary ===')
wb.SheetNames.forEach(name => {
  const sheet = wb.Sheets[name]
  const sheetData = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' }) as string[][]
  console.log(`\nSheet: "${name}" — ${sheetData.length} rows`)
  sheetData.slice(0, 3).forEach((row, i) => {
    const vals = row.slice(0, 20).map((v, j) => v ? `[${XLSX.utils.encode_col(j)}:${v}]` : '').filter(Boolean)
    if (vals.length > 0) console.log(`  Row ${i + 1}:`, vals.join(' '))
  })
})
