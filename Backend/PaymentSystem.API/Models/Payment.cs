using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PaymentSystem.API.Models;

public class Payment
{
    public int Id { get; set; }

    [Required]
    public int CourseSubscriptionId { get; set; }

    public CourseSubscription CourseSubscription { get; set; } = null!;

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    [Required]
    public DateTime PaymentDate { get; set; }

    [Required]
    [MaxLength(50)]
    public string PaymentMethod { get; set; } = string.Empty; // Cash, Vodafone Cash, InstaPay

    [Required]
    [MaxLength(50)]
    public string ReceiptId { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [MaxLength(450)]
    public string? CreatedById { get; set; }
    public ApplicationUser? CreatedBy { get; set; }
}
