using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PaymentSystem.API.Data;
using PaymentSystem.API.Models;

namespace PaymentSystem.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin,Coordinator")]
public class GroupSessionsController : ControllerBase
{
    private readonly AppDbContext _context;

    public GroupSessionsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("group/{groupId}")]
    public async Task<IActionResult> GetSessionsForGroup(int groupId)
    {
        var sessions = await _context.StudentSessions
            .Include(s => s.Instructor)
            .Where(s => s.CourseGroupId == groupId)
            .OrderBy(s => s.SessionDate)
            .Select(s => new
            {
                s.Id,
                s.Title,
                s.SessionDate,
                s.StartTime,
                s.EndTime,
                s.InstructorId,
                InstructorName = s.Instructor != null ? s.Instructor.FullName : null,
                s.MeetingLink,
                s.MaterialLink,
                s.RecordLink,
                AttendancesCount = s.Attendances.Count(a => a.IsAttended)
            })
            .ToListAsync();

        return Ok(sessions);
    }

    [HttpPost]
    public async Task<IActionResult> CreateSession([FromBody] CreateStudentSessionDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title)) return BadRequest("العنوان مطلوب");

        var session = new StudentSession
        {
            CourseGroupId = dto.CourseGroupId,
            Title = dto.Title,
            SessionDate = dto.SessionDate,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            InstructorId = string.IsNullOrWhiteSpace(dto.InstructorId) ? null : dto.InstructorId,
            MeetingLink = dto.MeetingLink,
            MaterialLink = dto.MaterialLink,
            RecordLink = dto.RecordLink
        };

        _context.StudentSessions.Add(session);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            session.Id,
            session.Title,
            session.SessionDate,
            session.StartTime,
            session.EndTime,
            session.InstructorId,
            session.MeetingLink,
            session.MaterialLink,
            session.RecordLink
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateSession(int id, [FromBody] CreateStudentSessionDto dto)
    {
        var session = await _context.StudentSessions.FindAsync(id);
        if (session == null) return NotFound();

        session.Title = dto.Title;
        session.SessionDate = dto.SessionDate;
        session.StartTime = dto.StartTime;
        session.EndTime = dto.EndTime;
        session.InstructorId = string.IsNullOrWhiteSpace(dto.InstructorId) ? null : dto.InstructorId;
        session.MeetingLink = dto.MeetingLink;
        session.MaterialLink = dto.MaterialLink;
        session.RecordLink = dto.RecordLink;

        await _context.SaveChangesAsync();
        return Ok(new
        {
            session.Id,
            session.Title,
            session.SessionDate,
            session.StartTime,
            session.EndTime,
            session.InstructorId,
            session.MeetingLink,
            session.MaterialLink,
            session.RecordLink
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSession(int id)
    {
        var session = await _context.StudentSessions.FindAsync(id);
        if (session == null) return NotFound();

        _context.StudentSessions.Remove(session);
        await _context.SaveChangesAsync();
        return Ok();
    }
}

public class CreateStudentSessionDto
{
    public int CourseGroupId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime SessionDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public string? InstructorId { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("meetingLink")]
    public string? MeetingLink { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("materialLink")]
    public string? MaterialLink { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("recordLink")]
    public string? RecordLink { get; set; }
}
