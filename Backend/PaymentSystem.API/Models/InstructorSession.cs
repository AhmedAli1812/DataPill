using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PaymentSystem.API.Models;

public class InstructorSession
{
    public int Id { get; set; }

    [Required]
    [MaxLength(450)]
    public string InstructorId { get; set; } = string.Empty;
    public ApplicationUser? Instructor { get; set; }

    [Required]
    public int CourseGroupId { get; set; }
    public CourseGroup? CourseGroup { get; set; }

    [Required]
    public DateTime SessionDate { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal HoursWorked { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal HourlyRateAtTime { get; set; }

    public bool IsPaid { get; set; }

    public int? SalaryId { get; set; }
    public Salary? Salary { get; set; }
    [MaxLength(500)]
    public string? SessionNote { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    [MaxLength(450)]
    public string? CreatedById { get; set; }
    public ApplicationUser? CreatedBy { get; set; }
}
