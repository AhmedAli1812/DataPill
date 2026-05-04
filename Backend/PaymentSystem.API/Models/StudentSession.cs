using System.ComponentModel.DataAnnotations;

namespace PaymentSystem.API.Models;

public class StudentSession
{
    public int Id { get; set; }

    public int CourseGroupId { get; set; }
    public CourseGroup? CourseGroup { get; set; }

    [MaxLength(450)]
    public string? InstructorId { get; set; }
    public ApplicationUser? Instructor { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public DateTime SessionDate { get; set; }

    [MaxLength(1000)]
    public string? MeetingLink { get; set; }

    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }

    [MaxLength(2000)]
    public string? MaterialLink { get; set; }

    [MaxLength(2000)]
    public string? RecordLink { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<StudentAttendance> Attendances { get; set; } = new List<StudentAttendance>();
}
