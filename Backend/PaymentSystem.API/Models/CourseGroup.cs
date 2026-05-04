using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PaymentSystem.API.Models;

public class CourseGroup
{
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(200)]
    public string WaveName { get; set; } = string.Empty;

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Price { get; set; }

    [Required]
    public DateTime StartDate { get; set; }

    public int Capacity { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<CourseGroupInstructor> Instructors { get; set; } = new List<CourseGroupInstructor>();

    [MaxLength(50)]
    public string? GroupCode { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalHours { get; set; }

    [MaxLength(50)]
    public string? Day1 { get; set; }
    [MaxLength(50)]
    public string? Day1Time { get; set; }
    [MaxLength(50)]
    public string? Day2 { get; set; }
    [MaxLength(50)]
    public string? Day2Time { get; set; }

    [MaxLength(200)]
    public string Schedule { get; set; } = string.Empty;

    public ICollection<CourseSubscription> Subscriptions { get; set; } = new List<CourseSubscription>();

    [MaxLength(450)]
    public string? CreatedById { get; set; }
    public ApplicationUser? CreatedBy { get; set; }
}
