using System.ComponentModel.DataAnnotations;

namespace PaymentSystem.API.Models;

public class Student
{
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string Phone { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Email { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<CourseSubscription> Subscriptions { get; set; } = new List<CourseSubscription>();

    public string? PasswordHash { get; set; }

    [MaxLength(450)]
    public string? CreatedById { get; set; }
    public ApplicationUser? CreatedBy { get; set; }

    public bool IsDeleted { get; set; } = false;
}
