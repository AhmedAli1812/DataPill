using iText.Kernel.Pdf;
using iText.Layout;
using iText.Layout.Element;
using iText.Layout.Properties;
using iText.Kernel.Colors;
using iText.Layout.Borders;
using iText.Kernel.Geom;
using iText.IO.Image;
using Path = System.IO.Path;
namespace PaymentSystem.API.Services;

public class PdfService : IPdfService
{
    public Task<byte[]> GenerateReceiptAsync(
        string receiptId,
        string studentName,
        string studentPhone,
        string courseName,
        decimal paymentAmount,
        decimal totalPaid,
        decimal remaining,
        DateTime paymentDate,
        string paymentMethod)
    {
        using var memoryStream = new MemoryStream();
        using var writer = new PdfWriter(memoryStream);
        using var pdf = new PdfDocument(writer);
        using var document = new Document(pdf, PageSize.A5);

        document.SetMargins(30, 30, 30, 30);

        // Colors
        var primaryColor = new DeviceRgb(79, 70, 229);   // Indigo
        var darkColor = new DeviceRgb(30, 30, 60);
        var grayColor = new DeviceRgb(120, 120, 140);
        var lightBg = new DeviceRgb(245, 245, 255);
        var successColor = new DeviceRgb(16, 185, 129);
        var warningColor = new DeviceRgb(245, 158, 11);

        // Header
        var logoPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "logo.png");
        if (File.Exists(logoPath))
        {
            try 
            {
                var logoData = ImageDataFactory.Create(logoPath);
                var logo = new Image(logoData).SetHeight(50).SetHorizontalAlignment(HorizontalAlignment.CENTER).SetMarginBottom(5);
                document.Add(logo);
            }
            catch (Exception) { }
        }

        var header = new Paragraph("Data Pill")
            .SetFontSize(22)
            .SetBold()
            .SetFontColor(primaryColor)
            .SetTextAlignment(TextAlignment.CENTER)
            .SetMarginBottom(0);
        document.Add(header);

        var subtitle = new Paragraph("إيصال دفع - Payment Receipt")
            .SetFontSize(12)
            .SetFontColor(grayColor)
            .SetTextAlignment(TextAlignment.CENTER)
            .SetMarginBottom(10);
        document.Add(subtitle);

        // Info Table
        var table = new Table(2).UseAllAvailableWidth().SetMarginBottom(10);
        table.SetBorder(Border.NO_BORDER);

        AddInfoRow(table, "رقم الإيصال (Receipt #)", receiptId, darkColor, grayColor);
        AddInfoRow(table, "اسم الطالب (Student)", studentName, darkColor, grayColor);
        AddInfoRow(table, "الكورس (Course)", courseName, darkColor, grayColor);
        AddInfoRow(table, "طريقة الدفع (Method)", paymentMethod, darkColor, grayColor);
        AddInfoRow(table, "تاريخ الدفع (Date)", paymentDate.ToString("yyyy-MM-dd"), darkColor, grayColor);

        document.Add(table);

        // Summary Title
        document.Add(new LineSeparator(new iText.Kernel.Pdf.Canvas.Draw.SolidLine(0.5f)).SetMarginBottom(10));

        var summaryTable = new Table(2).UseAllAvailableWidth().SetMarginBottom(10);
        summaryTable.SetBorder(Border.NO_BORDER);

        AddSummaryRow(summaryTable, "Amount Paid Now", $"{paymentAmount:N2} EGP", primaryColor);
        AddSummaryRow(summaryTable, "Total Paid To Date", $"{totalPaid:N2} EGP", successColor);
        AddSummaryRow(summaryTable, "Remaining Balance", $"{remaining:N2} EGP",
            remaining <= 0 ? successColor : warningColor);

        document.Add(summaryTable);

        // Status Box
        var statusText = remaining <= 0 ? "✓ PAID IN FULL - خالص بالكامل" : $"BALANCE DUE: {remaining:N2} EGP";
        var statusColor = remaining <= 0 ? successColor : warningColor;

        var statusPara = new Paragraph(statusText)
            .SetFontSize(14)
            .SetBold()
            .SetFontColor(ColorConstants.WHITE)
            .SetTextAlignment(TextAlignment.CENTER)
            .SetBackgroundColor(statusColor)
            .SetPadding(8)
            .SetMarginTop(5)
            .SetMarginBottom(15);
        document.Add(statusPara);

        // Footer
        var footer = new Paragraph($"Generated on {DateTime.Now:yyyy-MM-dd HH:mm:ss} | Data Pill System")
            .SetFontSize(7)
            .SetFontColor(grayColor)
            .SetTextAlignment(TextAlignment.CENTER);
        document.Add(footer);

        document.Close();

        document.Close();

        return Task.FromResult(memoryStream.ToArray());
    }

    private void AddInfoRow(Table table, string label, string value, DeviceRgb labelColor, DeviceRgb valueColor)
    {
        table.AddCell(new Cell()
            .Add(new Paragraph(label).SetFontSize(11).SetFontColor(valueColor))
            .SetBorder(Border.NO_BORDER)
            .SetPaddingBottom(8));

        table.AddCell(new Cell()
            .Add(new Paragraph(value).SetFontSize(11).SetBold().SetFontColor(labelColor))
            .SetBorder(Border.NO_BORDER)
            .SetPaddingBottom(8)
            .SetTextAlignment(TextAlignment.RIGHT));
    }

    private void AddSummaryRow(Table table, string label, string value, DeviceRgb valueColor)
    {
        table.AddCell(new Cell()
            .Add(new Paragraph(label).SetFontSize(13).SetFontColor(new DeviceRgb(80, 80, 100)))
            .SetBorder(Border.NO_BORDER)
            .SetPaddingBottom(10));

        table.AddCell(new Cell()
            .Add(new Paragraph(value).SetFontSize(13).SetBold().SetFontColor(valueColor))
            .SetBorder(Border.NO_BORDER)
            .SetPaddingBottom(10)
            .SetTextAlignment(TextAlignment.RIGHT));
    }
}
