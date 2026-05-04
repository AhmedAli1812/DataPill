using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PaymentSystem.API.Data;
using PaymentSystem.API.DTOs;
using PaymentSystem.API.Models;
using PaymentSystem.API.Services;
using System.Security.Claims;

namespace PaymentSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Sales,Accountant,Instructor,Mentor,Coordinator")]
public class SubscriptionsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IAuditService _auditService;

    public SubscriptionsController(AppDbContext context, IAuditService auditService)
    {
        _context = context;
        _auditService = auditService;
    }

    [HttpGet]
    public async Task<ActionResult<List<SubscriptionResponseDto>>> GetSubscriptions([FromQuery] int? studentId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var query = _context.CourseSubscriptions
            .Include(cs => cs.Student)
            .Include(cs => cs.CourseGroup)
            .Include(cs => cs.Payments)
            .AsQueryable();

        if (User.IsInRole("Sales"))
        {
            query = query.Where(cs => cs.CreatedById == userId);
        }

        if (studentId.HasValue)
            query = query.Where(cs => cs.StudentId == studentId.Value);

        var subscriptions = await query
            .OrderByDescending(cs => cs.CreatedAt)
            .Select(cs => new SubscriptionResponseDto
            {
                Id = cs.Id,
                StudentId = cs.StudentId,
                StudentName = cs.Student.Name,
                StudentPhone = cs.Student.Phone,
                StudentEmail = cs.Student.Email ?? "",
                CourseName = cs.CourseName,
                CourseGroupId = cs.CourseGroupId,
                CourseGroupName = cs.CourseGroup != null ? cs.CourseGroup.Name : cs.CourseName,
                CourseGroupCode = cs.CourseGroup != null ? cs.CourseGroup.GroupCode ?? "" : "",
                TotalPrice = cs.CourseGroup != null ? cs.CourseGroup.Price : cs.TotalPrice,
                StartDate = cs.StartDate,
                CreatedAt = cs.CreatedAt,
                TotalPaid = cs.Payments.Sum(p => p.Amount),
                Remaining = (cs.CourseGroup != null ? cs.CourseGroup.Price : cs.TotalPrice) - cs.Payments.Sum(p => p.Amount),
                Status = cs.Payments.Sum(p => p.Amount) >= (cs.CourseGroup != null ? cs.CourseGroup.Price : cs.TotalPrice) ? "Paid بالكامل" : "متبقي"
            })
            .ToListAsync();

        foreach (var sub in subscriptions)
            sub.Remaining = Math.Max(0, sub.Remaining);

        return Ok(subscriptions);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SubscriptionResponseDto>> GetSubscription(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var query = _context.CourseSubscriptions
            .Include(s => s.Student)
            .Include(s => s.CourseGroup)
            .Include(s => s.Payments)
            .AsQueryable();

        if (User.IsInRole("Sales"))
        {
            query = query.Where(s => s.CreatedById == userId);
        }

        var cs = await query.FirstOrDefaultAsync(s => s.Id == id);

        if (cs == null)
            return NotFound(new { message = "الاشتراك غير موجود أو لا تملك صلاحية رؤيته" });

        var totalPrice = cs.CourseGroup != null ? cs.CourseGroup.Price : cs.TotalPrice;
        var totalPaid = cs.Payments.Sum(p => p.Amount);
        var remaining = Math.Max(0, totalPrice - totalPaid);

        return Ok(new SubscriptionResponseDto
        {
            Id = cs.Id,
            StudentId = cs.StudentId,
            StudentName = cs.Student.Name,
            StudentPhone = cs.Student.Phone,
            StudentEmail = cs.Student.Email ?? "",
            CourseName = cs.CourseName,
            CourseGroupId = cs.CourseGroupId,
            CourseGroupName = cs.CourseGroup != null ? cs.CourseGroup.Name : cs.CourseName,
            TotalPrice = totalPrice,
            StartDate = cs.StartDate,
            CreatedAt = cs.CreatedAt,
            TotalPaid = totalPaid,
            Remaining = remaining,
            Status = totalPaid >= totalPrice ? "Paid بالكامل" : "متبقي"
        });
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Sales,Coordinator")]
    public async Task<ActionResult<SubscriptionResponseDto>> CreateSubscription([FromBody] CreateSubscriptionDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
        Student? student = null;

        // Unified Registration logic
        if (dto.StudentId.HasValue && dto.StudentId.Value > 0)
        {
            student = await _context.Students.FindAsync(dto.StudentId);
        }
        else if (!string.IsNullOrEmpty(dto.StudentPhone))
        {
            // Try finding by phone
            student = await _context.Students.FirstOrDefaultAsync(s => s.Phone == dto.StudentPhone);
            
            if (student == null && !string.IsNullOrEmpty(dto.StudentName))
            {
                // Create new student
                student = new Student
                {
                    Name = dto.StudentName,
                    Phone = dto.StudentPhone,
                    CreatedAt = DateTime.UtcNow,
                    CreatedById = userId
                };
                _context.Students.Add(student);
                await _context.SaveChangesAsync();
                await _auditService.LogAsync(userId, "إضافة طالب (تلقائي)", "Student", student.Id, $"تم إضافة طالب جديد أثناء الاشتراك: {student.Name}");
            }
        }

        if (student == null)
            return BadRequest(new { message = "بيانات الطالب غير مكتملة أو الطالب غير موجود" });

        // Get Group details
        var group = await _context.CourseGroups.FindAsync(dto.CourseGroupId);
        if (group == null)
            return BadRequest(new { message = "الجروب المختار غير موجود" });

        var subscription = new CourseSubscription
        {
            StudentId = student.Id,
            CourseGroupId = group.Id,
            CourseName = group.Name, // Legacy support
            TotalPrice = group.Price,
            StartDate = dto.StartDate,
            CreatedAt = DateTime.UtcNow,
            CreatedById = userId
        };

        _context.CourseSubscriptions.Add(subscription);
        await _context.SaveChangesAsync();

        await _auditService.LogAsync(userId, "إضافة اشتراك", "Subscription", subscription.Id, $"تم إضافة اشتراك في جروب {group.Name} للطالب {student.Name}");

        var response = new SubscriptionResponseDto
        {
            Id = subscription.Id,
            StudentId = subscription.StudentId,
            StudentName = student.Name,
            StudentPhone = student.Phone,
            CourseName = group.Name,
            CourseGroupId = group.Id,
            CourseGroupName = group.Name,
            TotalPrice = group.Price,
            StartDate = subscription.StartDate,
            CreatedAt = subscription.CreatedAt,
            TotalPaid = 0,
            Remaining = group.Price,
            Status = "متبقي"
        };

        return CreatedAtAction(nameof(GetSubscription), new { id = subscription.Id }, response);
    }
}
