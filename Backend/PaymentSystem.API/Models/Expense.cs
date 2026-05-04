using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PaymentSystem.API.Models;

public class Expense
{
    public int Id { get; set; }

    [Required]
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    [Required]
    [MaxLength(100)]
    public string Category { get; set; } = "Other"; // e.g., Rent, Electricity, Salary, Supplies

    [Required]
    public DateTime Date { get; set; }

    [MaxLength(100)]
    public string PaymentMethod { get; set; } = "Cash";

    [MaxLength(200)]
    public string Vendor { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [MaxLength(450)]
    public string? CreatedById { get; set; }
    public ApplicationUser? CreatedBy { get; set; }
}
