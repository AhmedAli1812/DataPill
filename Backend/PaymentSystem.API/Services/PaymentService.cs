using Microsoft.EntityFrameworkCore;
using PaymentSystem.API.Data;
using PaymentSystem.API.DTOs;
using PaymentSystem.API.Models;
using System.Web;

namespace PaymentSystem.API.Services;

public class PaymentService : IPaymentService
{
    private readonly AppDbContext _context;
    private readonly IPdfService _pdfService;
    private readonly IWebHostEnvironment _env;
    private readonly IAuditService _auditService;

    public PaymentService(AppDbContext context, IPdfService pdfService, IWebHostEnvironment env, IAuditService auditService)
    {
        _context = context;
        _pdfService = pdfService;
        _env = env;
        _auditService = auditService;
    }

    public async Task<PaymentResultDto> CreatePaymentAsync(CreatePaymentDto dto, string baseUrl, string userId)
    {
        // Validate subscription exists
        var subscription = await _context.CourseSubscriptions
            .Include(s => s.Student)
            .Include(s => s.Payments)
            .FirstOrDefaultAsync(s => s.Id == dto.CourseSubscriptionId);

        if (subscription == null)
            throw new KeyNotFoundException($"Subscription with ID {dto.CourseSubscriptionId} not found.");

        // Generate unique receipt ID
        var receiptId = $"RCP-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..8].ToUpper()}";

        // Create payment
        var payment = new Payment
        {
            CourseSubscriptionId = dto.CourseSubscriptionId,
            Amount = dto.Amount,
            PaymentDate = dto.PaymentDate,
            PaymentMethod = dto.PaymentMethod,
            ReceiptId = receiptId,
            CreatedAt = DateTime.UtcNow,
            CreatedById = userId
        };

        _context.Payments.Add(payment);
        await _context.SaveChangesAsync();

        await _auditService.LogAsync(userId, "إضافة دفعة", "Payment", payment.Id, $"تم استلام دفعة بقيمة {payment.Amount} جنيه للطالب {subscription.Student.Name} (كورس {subscription.CourseName})");

        // Calculate totals (payment is already added to _context, so subscription.Payments includes it)
        var totalPaid = subscription.Payments.Sum(p => p.Amount);
        var remaining = subscription.TotalPrice - totalPaid;
        var status = remaining <= 0 ? "Paid بالكامل" : "متبقي";

        // Generate PDF
        var pdfBytes = await _pdfService.GenerateReceiptAsync(
            receiptId,
            subscription.Student.Name,
            subscription.Student.Phone,
            subscription.CourseName,
            dto.Amount,
            totalPaid,
            Math.Max(0, remaining),
            dto.PaymentDate,
            dto.PaymentMethod);

        // Save PDF to disk
        var receiptsDir = Path.Combine(_env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot"), "receipts");
        Directory.CreateDirectory(receiptsDir);
        var pdfPath = Path.Combine(receiptsDir, $"{receiptId}.pdf");
        await File.WriteAllBytesAsync(pdfPath, pdfBytes);

        // Build URLs
        var receiptUrl = $"{baseUrl}/receipts/{receiptId}.pdf";

        // Build WhatsApp message
        var phone = subscription.Student.Phone.Replace("+", "").Replace(" ", "");
        if (phone.StartsWith("0"))
            phone = "2" + phone; // Egypt country code

        var message = $"مرحباً {subscription.Student.Name}،\n" +
                      $"تم استلام دفعة جديدة بنجاح! ✅\n\n" +
                      $"تفاصيل العملية:\n" +
                      $"- الكورس: {subscription.CourseName}\n" +
                      $"- سعر الكورس الإجمالي: {subscription.TotalPrice:N2} ج.م\n" +
                      $"- تم دفع الآن: {dto.Amount:N2} ج.م\n" +
                      $"- إجمالي المدفوع حتى الآن: {totalPaid:N2} ج.م\n" +
                      $"- المبلغ المتبقي: {Math.Max(0, remaining):N2} ج.م\n\n" +
                      $"رقم الإيصال: {receiptId}\n" +
                      $"لتحميل الإيصال الرسمي: {receiptUrl}\n\n" +
                      $"شكراً لاختيارك Data Pill! 💊✨";

        var whatsAppLink = $"https://wa.me/{phone}?text={HttpUtility.UrlEncode(message)}";

        return new PaymentResultDto
        {
            Payment = new PaymentResponseDto
            {
                Id = payment.Id,
                CourseSubscriptionId = payment.CourseSubscriptionId,
                Amount = payment.Amount,
                PaymentDate = payment.PaymentDate,
                PaymentMethod = payment.PaymentMethod,
                ReceiptId = payment.ReceiptId,
                CreatedAt = payment.CreatedAt
            },
            StudentName = subscription.Student.Name,
            CourseName = subscription.CourseName,
            TotalPaid = totalPaid,
            Remaining = Math.Max(0, remaining),
            Status = status,
            ReceiptUrl = receiptUrl,
            WhatsAppLink = whatsAppLink
        };
    }

    public async Task<List<PaymentResponseDto>> GetPaymentsBySubscriptionAsync(int subscriptionId)
    {
        return await _context.Payments
            .Where(p => p.CourseSubscriptionId == subscriptionId)
            .OrderByDescending(p => p.PaymentDate)
            .Select(p => new PaymentResponseDto
            {
                Id = p.Id,
                CourseSubscriptionId = p.CourseSubscriptionId,
                Amount = p.Amount,
                PaymentDate = p.PaymentDate,
                PaymentMethod = p.PaymentMethod,
                ReceiptId = p.ReceiptId,
                CreatedAt = p.CreatedAt
            })
            .ToListAsync();
    }
}
