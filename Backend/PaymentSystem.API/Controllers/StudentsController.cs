using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PaymentSystem.API.Data;
using PaymentSystem.API.DTOs;
using PaymentSystem.API.Models;
using PaymentSystem.API.Services;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace PaymentSystem.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin,Sales,Accountant,Instructor,Mentor,Coordinator")]
public class StudentsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IAuditService _auditService;
    private readonly IHubContext<Hubs.NotificationHub> _hubContext;

    public StudentsController(AppDbContext context, IAuditService auditService, IHubContext<Hubs.NotificationHub> hubContext)
    {
        _context = context;
        _auditService = auditService;
        _hubContext = hubContext;
    }

    [HttpGet]
    public async Task<ActionResult<List<StudentResponseDto>>> GetStudents()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var query = _context.Students.Where(s => !s.IsDeleted);

        // Filter for Sales role only
        if (User.IsInRole("Sales"))
        {
            query = query.Where(s => s.CreatedById == userId);
        }

        var students = await query
            .Include(s => s.Subscriptions)
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new StudentResponseDto
            {
                Id = s.Id,
                Name = s.Name,
                Phone = s.Phone,
                Email = s.Email,
                CreatedAt = s.CreatedAt,
                SubscriptionCount = s.Subscriptions.Count
            })
            .ToListAsync();

        return Ok(students);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<StudentResponseDto>> GetStudent(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var query = _context.Students.Where(s => s.Id == id && !s.IsDeleted);

        if (User.IsInRole("Sales"))
        {
            query = query.Where(s => s.CreatedById == userId);
        }

        var student = await query
            .Include(s => s.Subscriptions)
            .Select(s => new StudentResponseDto
            {
                Id = s.Id,
                Name = s.Name,
                Phone = s.Phone,
                Email = s.Email,
                CreatedAt = s.CreatedAt,
                SubscriptionCount = s.Subscriptions.Count
            })
            .FirstOrDefaultAsync();

        if (student == null)
            return NotFound(new { message = "الطالب غير موجود أو لا تملك صلاحية رؤيته" });

        return Ok(student);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Sales,Coordinator")]
    public async Task<ActionResult<StudentResponseDto>> CreateStudent([FromBody] CreateStudentDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";

        var student = new Student
        {
            Name = dto.Name,
            Phone = dto.Phone,
            Email = dto.Email,
            CreatedAt = DateTime.UtcNow,
            CreatedById = userId
        };

        _context.Students.Add(student);
        await _context.SaveChangesAsync();

        await _auditService.LogAsync(userId, "إضافة طالب", "Student", student.Id, $"تم إضافة الطالب {student.Name}");

        // Notify Admins
        await _hubContext.Clients.All.SendAsync("ReceiveNotification", new
        {
            Type = "StudentAdded",
            Message = $"تم تسجيل طالب جديد: {student.Name}",
            User = User.Identity?.Name,
            Time = DateTime.UtcNow
        });

        var response = new StudentResponseDto
        {
            Id = student.Id,
            Name = student.Name,
            Phone = student.Phone,
            Email = student.Email,
            CreatedAt = student.CreatedAt,
            SubscriptionCount = 0
        };

        return CreatedAtAction(nameof(GetStudent), new { id = student.Id }, response);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Sales,Coordinator")]
    public async Task<IActionResult> DeleteStudent(int id)
    {
        var student = await _context.Students
            .FirstOrDefaultAsync(s => s.Id == id && !s.IsDeleted);

        if (student == null)
            return NotFound(new { message = "الطالب غير موجود" });

        student.IsDeleted = true;
        await _context.SaveChangesAsync();

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
        await _auditService.LogAsync(userId, "حذف طالب (Soft Delete)", "Student", id, $"تم أرشفة الطالب {student.Name}");

        return Ok(new { message = "تم حذف الطالب بنجاح" });
    }
}
