using Microsoft.AspNetCore.Identity;

namespace PaymentSystem.API.Models;

public class ApplicationUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;
    public decimal HourlyRate { get; set; }
}
