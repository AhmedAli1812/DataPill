using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PaymentSystem.API.Data;
using PaymentSystem.API.Models;
using System.Security.Claims;

namespace PaymentSystem.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Student")]
public class StudentPortalController : ControllerBase
{
    private readonly AppDbContext _context;

    public StudentPortalController(AppDbContext context)
    {
        _context = context;
    }

    private int GetStudentId()
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(idClaim, out var id) ? id : 0;
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var studentId = GetStudentId();
        if (studentId == 0) return Unauthorized();

        // Get student's groups (only those linked to a course group)
        var subscriptions = await _context.CourseSubscriptions
            .Include(cs => cs.CourseGroup)
            .Where(cs => cs.StudentId == studentId && cs.CourseGroupId != null)
            .Select(cs => new
            {
                GroupId = cs.CourseGroupId,
                GroupName = cs.CourseGroup!.Name,
                GroupCode = cs.CourseGroup.GroupCode ?? "",
                Schedule = cs.CourseGroup.Schedule ?? ""
            })
            .ToListAsync();

        // Get all sessions for the student's groups
        var groupIds = subscriptions.Select(s => s.GroupId).ToList();
        
        var allSessionsCount = await _context.StudentSessions
            .Where(s => groupIds.Contains(s.CourseGroupId))
            .CountAsync();

        var attendedCount = await _context.StudentAttendances
            .Where(a => a.StudentId == studentId && a.IsAttended)
            .CountAsync();

        var attendancePercentage = allSessionsCount > 0 
            ? Math.Round((double)attendedCount / allSessionsCount * 100, 1) 
            : 100.0;

        // Get evaluations
        var evaluations = await _context.StudentEvaluations
            .Include(e => e.CourseGroup)
            .Where(e => e.StudentId == studentId)
            .Select(e => new
            {
                GroupId = e.CourseGroupId,
                GroupName = e.CourseGroup != null ? e.CourseGroup.Name : "",
                e.TaskScore,
                e.AttitudeScore,
                e.Notes,
                e.CreatedAt
            })
            .ToListAsync();

        return Ok(new
        {
            Groups = subscriptions,
            Attendance = new
            {
                TotalSessions = allSessionsCount,
                Attended = attendedCount,
                Percentage = attendancePercentage
            },
            Evaluations = evaluations
        });
    }

    [HttpGet("group/{groupId}/sessions")]
    public async Task<IActionResult> GetGroupSessions(int groupId)
    {
        var studentId = GetStudentId();
        
        // Ensure student is subscribed to this group
        var isSubscribed = await _context.CourseSubscriptions
            .AnyAsync(cs => cs.StudentId == studentId && cs.CourseGroupId == groupId);
            
        if (!isSubscribed) return Forbid();

        var egyptTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Egypt Standard Time");
        var nowInEgypt = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, egyptTimeZone);

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
                s.RecordLink,
                IsAttended = s.Attendances.Any(a => a.StudentId == studentId && a.IsAttended),
                CanJoin = s.MeetingLink != null &&
                          s.SessionDate.Date == nowInEgypt.Date &&
                          nowInEgypt.TimeOfDay >= s.StartTime &&
                          nowInEgypt.TimeOfDay <= s.EndTime
            })
            .ToListAsync();

        return Ok(sessions);
    }

    [HttpPost("session/{sessionId}/join")]
    public async Task<IActionResult> JoinSession(int sessionId)
    {
        var studentId = GetStudentId();
        
        var session = await _context.StudentSessions.FindAsync(sessionId);
        if (session == null) return NotFound("السيشن غير موجود");

        var isSubscribed = await _context.CourseSubscriptions
            .AnyAsync(cs => cs.StudentId == studentId && cs.CourseGroupId == session.CourseGroupId);
            
        if (!isSubscribed) return Forbid();

        // Record attendance
        var attendance = await _context.StudentAttendances
            .FirstOrDefaultAsync(a => a.StudentSessionId == sessionId && a.StudentId == studentId);

        if (attendance == null)
        {
            attendance = new StudentAttendance
            {
                StudentSessionId = sessionId,
                StudentId = studentId,
                IsAttended = true,
                JoinedAt = DateTime.UtcNow
            };
            _context.StudentAttendances.Add(attendance);
        }
        else if (!attendance.IsAttended)
        {
            attendance.IsAttended = true;
            attendance.JoinedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return Ok(new { meetingLink = session.MeetingLink });
    }
}
