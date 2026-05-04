using System.ComponentModel.DataAnnotations;

namespace PaymentSystem.API.Models;

public class CourseGroupInstructor
{
    public int Id { get; set; }
    
    public int CourseGroupId { get; set; }
    public CourseGroup CourseGroup { get; set; } = null!;
    
    [MaxLength(450)]
    public string InstructorId { get; set; } = string.Empty;
    public ApplicationUser Instructor { get; set; } = null!;
}
