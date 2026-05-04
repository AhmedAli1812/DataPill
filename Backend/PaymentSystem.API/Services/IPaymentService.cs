using PaymentSystem.API.DTOs;

namespace PaymentSystem.API.Services;

public interface IPaymentService
{
    Task<PaymentResultDto> CreatePaymentAsync(CreatePaymentDto dto, string baseUrl, string userId);
    Task<List<PaymentResponseDto>> GetPaymentsBySubscriptionAsync(int subscriptionId);
}
