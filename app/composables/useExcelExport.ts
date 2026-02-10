import ExcelJS from 'exceljs'

/**
 * Composable untuk export data ke Excel dengan format yang rapi dan professional
 * Menggunakan ExcelJS dengan best practices untuk performa optimal
 */
export const useExcelExport = () => {
  const toast = useToast()

  /**
   * Export data ke file Excel (.xlsx) dengan formatting otomatis
   * @param config Konfigurasi untuk export Excel
   */
  async function exportToExcel(config: {
    fileName: string
    sheetName: string
    headers: string[]
    data: (string | number | null | undefined)[][]
    title?: string
    includeTimestamp?: boolean
    columnWidths?: number[]
  }) {
    try {
      const {
        fileName,
        sheetName,
        headers,
        data,
        title,
        includeTimestamp = true,
        columnWidths
      } = config

      // Create workbook and worksheet
      const workbook = new ExcelJS.Workbook()
      workbook.created = new Date()
      workbook.creator = 'SiKontrol'

      const worksheet = workbook.addWorksheet(sheetName, {
        properties: { tabColor: { argb: '4472C4' } }
      })

      let currentRow = 1

      // Add title if provided
      if (title) {
        worksheet.mergeCells(`A${currentRow}:${String.fromCharCode(64 + headers.length)}${currentRow}`)
        const titleCell = worksheet.getCell(`A${currentRow}`)
        titleCell.value = title
        titleCell.font = { size: 16, bold: true, color: { argb: '1F4E78' } }
        titleCell.alignment = { vertical: 'middle', horizontal: 'center' }
        worksheet.getRow(currentRow).height = 30
        currentRow++

        // Add timestamp
        if (includeTimestamp) {
          worksheet.mergeCells(`A${currentRow}:${String.fromCharCode(64 + headers.length)}${currentRow}`)
          const timestampCell = worksheet.getCell(`A${currentRow}`)
          const now = new Date()
          timestampCell.value = `Dicetak: ${now.toLocaleString('id-ID', {
            dateStyle: 'full',
            timeStyle: 'short'
          })}`
          timestampCell.font = { size: 10, italic: true, color: { argb: '7F7F7F' } }
          timestampCell.alignment = { vertical: 'middle', horizontal: 'center' }
          currentRow++
          currentRow++ // Add empty row for spacing
        }
      }

      // Add headers
      const headerRow = worksheet.addRow(headers)
      headerRow.height = 25

      // Style header row
      headerRow.eachCell((cell, colNumber) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '4472C4' }
        }
        cell.font = {
          bold: true,
          color: { argb: 'FFFFFF' },
          size: 11
        }
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center',
          wrapText: true
        }
        cell.border = {
          top: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } }
        }
      })

      // Add data rows
      data.forEach((row, index) => {
        const excelRow = worksheet.addRow(row.map(cell => cell ?? ''))

        // Alternate row colors for better readability
        const fillColor = index % 2 === 0 ? 'F2F2F2' : 'FFFFFF'

        excelRow.eachCell((cell, colNumber) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: fillColor }
          }
          cell.alignment = {
            vertical: 'middle',
            horizontal: colNumber === 1 ? 'center' : 'left', // Center align first column (No)
            wrapText: false
          }
          cell.border = {
            top: { style: 'thin', color: { argb: 'D0D0D0' } },
            left: { style: 'thin', color: { argb: 'D0D0D0' } },
            bottom: { style: 'thin', color: { argb: 'D0D0D0' } },
            right: { style: 'thin', color: { argb: 'D0D0D0' } }
          }
          cell.font = { size: 10 }
        })
      })

      // Auto-fit columns or use custom widths
      if (columnWidths && columnWidths.length === headers.length) {
        worksheet.columns = headers.map((header, index) => ({
          header,
          width: columnWidths[index]
        }))
      } else {
        // Auto-fit based on content
        worksheet.columns.forEach((column, index) => {
          let maxLength = headers[index]?.length || 10

          data.forEach(row => {
            const cellValue = String(row[index] ?? '')
            if (cellValue.length > maxLength) {
              maxLength = cellValue.length
            }
          })

          // Set width with min 10, max 50
          column.width = Math.min(Math.max(maxLength + 2, 10), 50)
        })
      }

      // Freeze header row
      worksheet.views = [
        { state: 'frozen', ySplit: title ? currentRow + 1 : 1 }
      ]

      // Generate timestamp for filename
      const timestamp = includeTimestamp
        ? `_${new Date().toISOString().split('T')[0]}`
        : ''

      // Generate and download file
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${fileName}${timestamp}.xlsx`
      document.body.appendChild(link)
      link.click()

      // Cleanup
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.add({
        title: 'Berhasil Export',
        description: `File ${fileName}${timestamp}.xlsx berhasil diunduh`,
        color: 'success',
        icon: 'i-lucide-file-spreadsheet'
      })

      return true
    } catch (error) {
      console.error('Export to Excel error:', error)
      toast.add({
        title: 'Gagal Export',
        description: 'Terjadi kesalahan saat membuat file Excel',
        color: 'error',
        icon: 'i-lucide-alert-circle'
      })
      return false
    }
  }

  return {
    exportToExcel
  }
}
