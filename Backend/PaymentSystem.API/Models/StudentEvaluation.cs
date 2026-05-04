using System.ComponentModel.DataAnnotations;

namespace PaymentSystem.API.Models;

public class StudentEvaluation
{
    public int Id { get; set; }
    
    public int StudentId { get; set; }
    public Student Student { get; set; } = null!;
    
    public int CourseGroupId { get; set; }
    public CourseGroup CourseGroup { get; set; } = null!;
    
    [MaxLength(450)]
    public string EvaluatorId { get; set; } = string.Empty;
    public ApplicationUser Evaluator { get; set; } = null!;
    
    [Range(0, 100)]
    public int Score { get; set; }

    [Range(0, 100)]
    public int TaskScore { get; set; }

    [Range(0, 100)]
    public int AttitudeScore { get; set; }
    
    [MaxLength(1000)]
    public string Notes { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
