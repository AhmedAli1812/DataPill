using System.ComponentModel.DataAnnotations;

namespace PaymentSystem.API.DTOs;

// ===== Student DTOs =====
public class CreateStudentDto
{
    [Required(ErrorMessage = "Student name is required")]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Phone number is required")]
    [MaxLength(20)]
    public string Phone { get; set; } = string.Empty;

    [MaxLength(200)]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string? Email { get; set; }
}

public class StudentResponseDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public DateTime CreatedAt { get; set; }
    public int SubscriptionCount { get; set; }
}

// ===== Course Group DTOs =====
public class CourseGroupResponseDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string WaveName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public DateTime StartDate { get; set; }
    public int Capacity { get; set; }
    public int SubscriptionsCount { get; set; }
    public List<string> InstructorIds { get; set; } = new();
    public List<string> InstructorNames { get; set; } = new();
    public string? GroupCode { get; set; }
    public decimal TotalHours { get; set; }
    public string? Day1 { get; set; }
    public string? Day1Time { get; set; }
    public string? Day2 { get; set; }
    public string? Day2Time { get; set; }
    public string Schedule { get; set; } = string.Empty;
}

public class CreateCourseGroupDto
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(200)]
    public string WaveName { get; set; } = string.Empty;

    [Required]
    public decimal Price { get; set; }

    [Required]
    public DateTime StartDate { get; set; }

    public int Capacity { get; set; }

    public List<string> InstructorIds { get; set; } = new();

    public string? GroupCode { get; set; }
    public decimal TotalHours { get; set; }
    public string? Day1 { get; set; }
    public string? Day1Time { get; set; }
    public string? Day2 { get; set; }
    public string? Day2Time { get; set; }

    [MaxLength(200)]
    public string Schedule { get; set; } = string.Empty;
}

// ===== Instructor DTOs =====
public class InstructorSessionDto
{
    public int Id { get; set; }
    public string InstructorId { get; set; } = string.Empty;
    public string InstructorName { get; set; } = string.Empty;
    public int CourseGroupId { get; set; }
    public string CourseGroupName { get; set; } = string.Empty;
    public DateTime SessionDate { get; set; }
    public decimal HoursWorked { get; set; }
    public decimal HourlyRate { get; set; }
    public decimal TotalAmount => HoursWorked * HourlyRate;
    public bool IsPaid { get; set; }
    public int? SalaryId { get; set; }
    public string? SessionNote { get; set; }
}

public class CreateInstructorSessionDto
{
    [Required]
    public string InstructorId { get; set; } = string.Empty;
    [Required]
    public int CourseGroupId { get; set; }
    [Required]
    public DateTime SessionDate { get; set; }
    [Required]
    public decimal HoursWorked { get; set; }
    public string? SessionNote { get; set; }
}

// ===== Subscription DTOs =====
public class CreateSubscriptionDto
{
    // For Unified Registration: If StudentId is 0 or null, use Name/Phone
    public int? StudentId { get; set; }
    
    [MaxLength(200)]
    public string? StudentName { get; set; }
    
    [MaxLength(20)]
    public string? StudentPhone { get; set; }

    [Required(ErrorMessage = "Course Group ID is required")]
    public int CourseGroupId { get; set; }

    [Required(ErrorMessage = "Start date is required")]
    public DateTime StartDate { get; set; }
}

public class SubscriptionResponseDto
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentPhone { get; set; } = string.Empty;
    public string StudentEmail { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public int? CourseGroupId { get; set; }
    public string CourseGroupName { get; set; } = string.Empty;
    public string CourseGroupCode { get; set; } = string.Empty;
    public decimal TotalPrice { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public decimal TotalPaid { get; set; }
    public decimal Remaining { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class StudentEvaluationResponseDto
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public int CourseGroupId { get; set; }
    public string CourseGroupName { get; set; } = string.Empty;
    public string EvaluatorName { get; set; } = string.Empty;
    public int Score { get; set; }
    public int TaskScore { get; set; }
    public int AttitudeScore { get; set; }
    public string Notes { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CreateStudentEvaluationDto
{
    [Required]
    public int StudentId { get; set; }
    [Required]
    public int CourseGroupId { get; set; }
    [Range(0, 100)]
    public int Score { get; set; }
    
    [Range(0, 100)]
    public int TaskScore { get; set; }

    [Range(0, 100)]
    public int AttitudeScore { get; set; }

    [MaxLength(1000)]
    public string Notes { get; set; } = string.Empty;
}

// ===== Payment DTOs =====
public class CreatePaymentDto
{
    [Required(ErrorMessage = "Subscription ID is required")]
    public int CourseSubscriptionId { get; set; }

    [Required(ErrorMessage = "Amount is required")]
    [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than 0")]
    public decimal Amount { get; set; }

    [Required(ErrorMessage = "Payment date is required")]
    public DateTime PaymentDate { get; set; }

    [Required(ErrorMessage = "Payment method is required")]
    [MaxLength(50)]
    public string PaymentMethod { get; set; } = string.Empty;
}

public class PaymentResponseDto
{
    public int Id { get; set; }
    public int CourseSubscriptionId { get; set; }
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string ReceiptId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class PaymentResultDto
{
    public PaymentResponseDto Payment { get; set; } = null!;
    public string StudentName { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public decimal TotalPaid { get; set; }
    public decimal Remaining { get; set; }
    public string Status { get; set; } = string.Empty;
    public string ReceiptUrl { get; set; } = string.Empty;
    public string WhatsAppLink { get; set; } = string.Empty;
}

// ===== Dashboard DTOs =====
public class DashboardDto
{
    public decimal TotalRevenue { get; set; }
    public int TotalStudents { get; set; }
    public int TotalSubscriptions { get; set; }
    public int PendingPayments { get; set; }
    public List<SubscriptionResponseDto> RecentSubscriptions { get; set; } = new();
}

public class CreateInstructorUserDto
{
    [Required]
    [MaxLength(200)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;

    public string Role { get; set; } = "Instructor"; // Instructor or Mentor

    public decimal HourlyRate { get; set; }
}
