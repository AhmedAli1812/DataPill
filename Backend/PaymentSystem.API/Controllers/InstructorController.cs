using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PaymentSystem.API.Data;
using PaymentSystem.API.DTOs;
using PaymentSystem.API.Models;
using System.Security.Claims;

namespace PaymentSystem.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class InstructorController : ControllerBase
{
    private readonly AppDbContext _context;

    public InstructorController(AppDbContext context)
    {
        _context = context;
    }    [HttpGet("all-instructors")]
    [Authorize(Roles = "Admin,Accountant,Coordinator")]
    public async Task<IActionResult> GetAllInstructorsWithGroups()
    {
        var instructors = await _context.Users
            .Where(u => _context.UserRoles
                .Join(_context.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => new { ur, r })
                .Where(x => x.r.Name == "Instructor")
                .Select(x => x.ur.UserId)
                .Contains(u.Id))
            .Select(u => new
            {
                u.Id,
                u.FullName,
                u.Email,
                u.HourlyRate,
                Groups = _context.CourseGroups
                    .Where(g => g.Instructors.Any(i => i.InstructorId == u.Id))
                    .Select(g => new { g.Id, g.Name, g.GroupCode })
                    .ToList()
            })
            .ToListAsync();

        return Ok(instructors);
    }

    [HttpGet("dashboard")]
    [Authorize(Roles = "Instructor,Admin,Accountant,Coordinator")]
    public async Task<IActionResult> GetDashboard([FromQuery] string? instructorId = null)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.IsInRole("Admin") || User.IsInRole("Accountant") || User.IsInRole("Coordinator");

        var targetId = (isAdmin && !string.IsNullOrEmpty(instructorId)) ? instructorId : currentUserId;
        
        var groups = await _context.CourseGroups
            .Include(g => g.Instructors)
            .Where(g => g.Instructors.Any(i => i.InstructorId == targetId))
            .Select(g => new
            {
                g.Id,
                g.Name,
                g.Schedule,
                g.StartDate,
                StudentCount = g.Subscriptions.Count
            })
            .ToListAsync();

        var sessions = await _context.InstructorSessions
            .Include(s => s.CourseGroup)
            .Where(s => s.InstructorId == targetId)
            .OrderByDescending(s => s.SessionDate)
            .Take(50)
            .Select(s => new InstructorSessionDto
            {
                Id = s.Id,
                InstructorId = s.InstructorId,
                CourseGroupId = s.CourseGroupId,
                CourseGroupName = s.CourseGroup != null ? s.CourseGroup.Name : "Deleted Group",
                SessionDate = s.SessionDate,
                HoursWorked = s.HoursWorked,
                HourlyRate = s.HourlyRateAtTime,
                IsPaid = s.IsPaid,
                SalaryId = s.SalaryId,
                SessionNote = s.SessionNote
            })
            .ToListAsync();
        
        var statsBase = _context.InstructorSessions.Where(s => s.InstructorId == targetId);

        var totalHours = await statsBase.SumAsync(s => s.HoursWorked);

        var totalEarned = await statsBase.SumAsync(s => s.HoursWorked * s.HourlyRateAtTime);

        // Calculate actual paid from Salaries table
        var actualSalaries = await _context.Salaries
            .Where(s => s.RecipientId == targetId)
            .ToListAsync();
        
        var totalPaid = actualSalaries.Sum(s => s.BaseSalary + s.Bonus - s.Deductions);

        var egyptTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Egypt Standard Time");
        var nowInEgypt = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, egyptTimeZone);

        var upcomingSessions = await _context.StudentSessions
            .Include(s => s.CourseGroup)
            .Where(s => s.InstructorId == targetId && s.SessionDate.Date >= nowInEgypt.Date)
            .OrderBy(s => s.SessionDate).ThenBy(s => s.StartTime)
            .Select(s => new
            {
                s.Id,
                s.Title,
                CourseGroupName = s.CourseGroup != null ? s.CourseGroup.Name : "",
                s.SessionDate,
                s.StartTime,
                s.EndTime,
                s.MeetingLink
            })
            .ToListAsync();

        return Ok(new
        {
            Groups = groups,
            RecentSessions = sessions,
            UpcomingSessions = upcomingSessions,
            Stats = new
            {
                TotalHours = totalHours,
                TotalEarned = totalEarned,
                TotalPaid = totalPaid,
                PendingAmount = totalEarned - totalPaid
            }
        });
    }

    [HttpPost("sessions")]
    [Authorize(Roles = "Admin,Coordinator")]
    public async Task<IActionResult> RecordSession([FromBody] CreateInstructorSessionDto dto)
    {
        var instructor = await _context.Users.FindAsync(dto.InstructorId);
        if (instructor == null) return BadRequest("Instructor not found");

        var session = new InstructorSession
        {
            InstructorId = dto.InstructorId,
            CourseGroupId = dto.CourseGroupId,
            SessionDate = dto.SessionDate,
            HoursWorked = dto.HoursWorked,
            HourlyRateAtTime = instructor.HourlyRate,
            SessionNote = dto.SessionNote,
            CreatedById = User.FindFirstValue(ClaimTypes.NameIdentifier)
        };

        _context.InstructorSessions.Add(session);
        await _context.SaveChangesAsync();

        return Ok(session);
    }
    
    [HttpGet("all-sessions")]
    [Authorize(Roles = "Admin,Accountant,Coordinator")]
    public async Task<IActionResult> GetAllSessions()
    {
        var sessions = await _context.InstructorSessions
            .Include(s => s.Instructor)
            .Include(s => s.CourseGroup)
            .OrderByDescending(s => s.SessionDate)
            .Select(s => new InstructorSessionDto
            {
                Id = s.Id,
                InstructorId = s.InstructorId,
                InstructorName = s.Instructor != null ? s.Instructor.FullName : "Unknown",
                CourseGroupId = s.CourseGroupId,
                CourseGroupName = s.CourseGroup != null ? s.CourseGroup.Name : "Deleted Group",
                SessionDate = s.SessionDate,
                HoursWorked = s.HoursWorked,
                HourlyRate = s.HourlyRateAtTime,
                IsPaid = s.IsPaid,
                SalaryId = s.SalaryId,
                SessionNote = s.SessionNote
            })
            .ToListAsync();

        return Ok(sessions);
    }

    [HttpPut("sessions/{id}")]
    [Authorize(Roles = "Admin,Coordinator")]
    public async Task<IActionResult> UpdateSession(int id, [FromBody] CreateInstructorSessionDto dto)
    {
        var session = await _context.InstructorSessions.FindAsync(id);
        if (session == null) return NotFound();
        if (session.IsPaid) return BadRequest("Cannot edit a paid session");

        session.InstructorId = dto.InstructorId;
        session.CourseGroupId = dto.CourseGroupId;
        session.SessionDate = dto.SessionDate;
        session.HoursWorked = dto.HoursWorked;
        session.SessionNote = dto.SessionNote;

        await _context.SaveChangesAsync();
        return Ok(session);
    }

    [HttpDelete("sessions/{id}")]
    [Authorize(Roles = "Admin,Coordinator")]
    public async Task<IActionResult> DeleteSession(int id)
    {
        var session = await _context.InstructorSessions.FindAsync(id);
        if (session == null) return NotFound();
        if (session.IsPaid) return BadRequest("Cannot delete a paid session");

        _context.InstructorSessions.Remove(session);
        await _context.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("create-instructor")]
    [Authorize(Roles = "Admin,Coordinator")]
    public async Task<IActionResult> CreateInstructor(
        [FromServices] UserManager<ApplicationUser> userManager,
        [FromBody] CreateInstructorUserDto dto)
    {
        var allowed = new[] { "Instructor", "Mentor" };
        if (!allowed.Contains(dto.Role))
            return BadRequest(new { message = "يمكن إضافة محاضر أو مساعد فقط" });

        var existing = await userManager.FindByEmailAsync(dto.Email);
        if (existing != null)
            return BadRequest(new { message = "البريد الإلكتروني مستخدم بالفعل" });

        var user = new ApplicationUser
        {
            Email = dto.Email,
            UserName = dto.Email,
            FullName = dto.FullName,
            HourlyRate = dto.HourlyRate,
            SecurityStamp = Guid.NewGuid().ToString()
        };

        var result = await userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return BadRequest(new { message = $"فشل إنشاء الحساب: {errors}" });
        }

        await userManager.AddToRoleAsync(user, dto.Role);
        return Ok(new { message = "تم إضافة المحاضر بنجاح", userId = user.Id });
    }
}
