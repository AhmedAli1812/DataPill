namespace PaymentSystem.API.Models;

public class StudentAttendance
{
    public int Id { get; set; }

    public int StudentSessionId { get; set; }
    public StudentSession? StudentSession { get; set; }

    public int StudentId { get; set; }
    public Student? Student { get; set; }

    public bool IsAttended { get; set; }

    public DateTime? JoinedAt { get; set; }
}
