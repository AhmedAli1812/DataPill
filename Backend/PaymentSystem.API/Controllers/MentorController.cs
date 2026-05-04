using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PaymentSystem.API.Data;
using PaymentSystem.API.Models;
using System.Security.Claims;

namespace PaymentSystem.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Mentor,Admin,Coordinator")]
public class MentorController : ControllerBase
{
    private readonly AppDbContext _context;

    public MentorController(AppDbContext context)
    {
        _context = context;
    }

    private string GetMentorId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
    }

    [HttpGet("groups")]
    public async Task<IActionResult> GetMentorGroups()
    {
        var mentorId = GetMentorId();
        if (string.IsNullOrEmpty(mentorId)) return Unauthorized();

        var isAdmin = User.IsInRole("Admin") || User.IsInRole("Coordinator");

        // Fetch groups the mentor is assigned to
        var query = _context.CourseGroups.AsQueryable();

        if (!isAdmin)
        {
            query = query.Where(g => g.Instructors.Any(i => i.InstructorId == mentorId));
        }

        var groups = await query
            .Select(g => new
            {
                g.Id,
                g.Name,
                g.GroupCode,
                g.Schedule,
                Students = g.Subscriptions.Select(s => new
                {
                    s.Student.Id,
                    s.Student.Name,
                    s.Student.Phone
                }).ToList()
            })
            .ToListAsync();

        return Ok(groups);
    }

    [HttpGet("group/{groupId}/sessions")]
    public async Task<IActionResult> GetGroupSessions(int groupId)
    {
        var mentorId = GetMentorId();
        if (string.IsNullOrEmpty(mentorId)) return Unauthorized();

        var isAdmin = User.IsInRole("Admin") || User.IsInRole("Coordinator");

        // Verify the mentor belongs to the group
        if (!isAdmin)
        {
            var isAssigned = await _context.CourseGroups
                .AnyAsync(g => g.Id == groupId && g.Instructors.Any(i => i.InstructorId == mentorId));
            if (!isAssigned) return Forbid();
        }

        var sessions = await _context.StudentSessions
            .Where(s => s.CourseGroupId == groupId)
            .OrderBy(s => s.SessionDate)
            .Select(s => new
            {
                s.Id,
                s.Title,
                s.SessionDate,
                s.StartTime,
                s.EndTime,
                s.MeetingLink,
                s.MaterialLink,
                s.RecordLink
            })
            .ToListAsync();

        return Ok(sessions);
    }

    [HttpPut("session/{sessionId}/material")]
    public async Task<IActionResult> UpdateSessionMaterial(int sessionId, [FromBody] MaterialDto dto)
    {
        var mentorId = GetMentorId();
        if (string.IsNullOrEmpty(mentorId)) return Unauthorized();

        var session = await _context.StudentSessions.FindAsync(sessionId);
        if (session == null) return NotFound("السيشن غير موجودة");

        var isAdmin = User.IsInRole("Admin") || User.IsInRole("Coordinator");

        if (!isAdmin)
        {
            var isAssigned = await _context.CourseGroups
                .AnyAsync(g => g.Id == session.CourseGroupId && g.Instructors.Any(i => i.InstructorId == mentorId));
            if (!isAssigned) return Forbid();
        }

        session.MaterialLink = dto.MaterialLink;
        session.RecordLink = dto.RecordLink;
        await _context.SaveChangesAsync();

        return Ok(new { message = "تم الحفظ بنجاح", materialLink = session.MaterialLink, recordLink = session.RecordLink });
    }

    [HttpGet("group/{groupId}/attendance-report")]
    public async Task<IActionResult> GetAttendanceReport(int groupId)
    {
        var mentorId = GetMentorId();
        if (string.IsNullOrEmpty(mentorId)) return Unauthorized();

        var isAdmin = User.IsInRole("Admin") || User.IsInRole("Coordinator");

        if (!isAdmin)
        {
            var isAssigned = await _context.CourseGroups
                .AnyAsync(g => g.Id == groupId && g.Instructors.Any(i => i.InstructorId == mentorId));
            if (!isAssigned) return Forbid();
        }

        var sessions = await _context.StudentSessions
            .Where(s => s.CourseGroupId == groupId)
            .OrderBy(s => s.SessionDate)
            .Select(s => new { s.Id, s.Title, s.SessionDate })
            .ToListAsync();

        var students = await _context.CourseSubscriptions
            .Where(cs => cs.CourseGroupId == groupId)
            .Select(cs => cs.Student)
            .Where(s => s != null)
            .Distinct()
            .ToListAsync();

        var studentIds = students.Select(st => st!.Id).ToList();

        var attendances = await _context.StudentAttendances
            .Where(a => studentIds.Contains(a.StudentId) && a.StudentSession.CourseGroupId == groupId)
            .ToListAsync();

        var report = students.Select(st =>
        {
            var studentAttendances = attendances.Where(a => a.StudentId == st!.Id).ToList();
            var attendedCount = studentAttendances.Count(a => a.IsAttended);
            var totalSessions = sessions.Count;
            var absentCount = totalSessions - attendedCount;
            var attendancePercentage = totalSessions > 0 ? (double)attendedCount / totalSessions * 100 : 0;

            var sessionDetails = sessions.Select(s =>
            {
                var att = studentAttendances.FirstOrDefault(a => a.StudentSessionId == s.Id);
                return new
                {
                    s.Id,
                    s.Title,
                    s.SessionDate,
                    IsAttended = att != null && att.IsAttended,
                    Status = (att != null && att.IsAttended) ? "حاضر" : "غائب"
                };
            }).ToList();

            return new
            {
                StudentId = st!.Id,
                StudentName = st.Name,
                PhoneNumber = st.Phone,
                AttendedCount = attendedCount,
                AbsentCount = absentCount,
                TotalSessions = totalSessions,
                AttendancePercentage = Math.Round(attendancePercentage, 2),
                Sessions = sessionDetails
            };
        }).ToList();

        return Ok(report);
    }
}

public class MaterialDto
{
    [System.Text.Json.Serialization.JsonPropertyName("materialLink")]
    public string? MaterialLink { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("recordLink")]
    public string? RecordLink { get; set; }
}
