namespace PaymentSystem.API.Services;

public interface IPdfService
{
    Task<byte[]> GenerateReceiptAsync(
        string receiptId,
        string studentName,
        string studentPhone,
        string courseName,
        decimal paymentAmount,
        decimal totalPaid,
        decimal remaining,
        DateTime paymentDate,
        string paymentMethod);
}
