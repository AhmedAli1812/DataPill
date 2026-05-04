using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PaymentSystem.API.DTOs;
using PaymentSystem.API.Services;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace PaymentSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Sales,Accountant,Instructor,Mentor")]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly IHubContext<Hubs.NotificationHub> _hubContext;

    public PaymentsController(IPaymentService paymentService, IHubContext<Hubs.NotificationHub> hubContext)
    {
        _paymentService = paymentService;
        _hubContext = hubContext;
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Sales")]
    public async Task<ActionResult<PaymentResultDto>> CreatePayment([FromBody] CreatePaymentDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var baseUrl = $"{Request.Scheme}://{Request.Host}";
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
            var result = await _paymentService.CreatePaymentAsync(dto, baseUrl, userId);

            // Notify Admins
            await _hubContext.Clients.All.SendAsync("ReceiveNotification", new
            {
                Type = "PaymentMade",
                Message = $"تم تحصيل مبلغ {dto.Amount} ج.م",
                User = User.Identity?.Name,
                Time = DateTime.UtcNow
            });

            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while processing the payment.", detail = ex.Message });
        }
    }

    [HttpGet("by-subscription/{subscriptionId}")]
    public async Task<ActionResult<List<PaymentResponseDto>>> GetPaymentsBySubscription(int subscriptionId)
    {
        var payments = await _paymentService.GetPaymentsBySubscriptionAsync(subscriptionId);
        return Ok(payments);
    }
}
