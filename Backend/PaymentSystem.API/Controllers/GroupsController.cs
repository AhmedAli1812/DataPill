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
public class GroupsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IAuditService _auditService;

    public GroupsController(AppDbContext context, IAuditService auditService)
    {
        _context = context;
        _auditService = auditService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Sales,Accountant,Instructor,Mentor,Coordinator")]
    public async Task<ActionResult<List<CourseGroupResponseDto>>> GetGroups()
    {
        var groups = await _context.CourseGroups
            .Include(g => g.Subscriptions)
            .Include(g => g.Instructors)
                .ThenInclude(i => i.Instructor)
            .OrderByDescending(g => g.CreatedAt)
            .Select(g => new CourseGroupResponseDto
            {
                Id = g.Id,
                Name = g.Name,
                WaveName = g.WaveName,
                Price = g.Price,
                StartDate = g.StartDate,
                Capacity = g.Capacity,
                SubscriptionsCount = g.Subscriptions.Count,
                InstructorIds = g.Instructors.Select(i => i.InstructorId).ToList(),
                InstructorNames = g.Instructors.Select(i => i.Instructor.FullName).ToList(),
                GroupCode = g.GroupCode,
                TotalHours = g.TotalHours,
                Day1 = g.Day1,
                Day1Time = g.Day1Time,
                Day2 = g.Day2,
                Day2Time = g.Day2Time,
                Schedule = g.Schedule
            })
            .ToListAsync();

        return Ok(groups);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Coordinator")]
    public async Task<ActionResult<CourseGroupResponseDto>> CreateGroup([FromBody] CreateCourseGroupDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";

        var group = new CourseGroup
        {
            Name = dto.Name,
            WaveName = dto.WaveName,
            Price = dto.Price,
            StartDate = dto.StartDate,
            Capacity = dto.Capacity,
            GroupCode = dto.GroupCode,
            TotalHours = dto.TotalHours,
            Day1 = dto.Day1,
            Day1Time = dto.Day1Time,
            Day2 = dto.Day2,
            Day2Time = dto.Day2Time,
            Schedule = string.IsNullOrEmpty(dto.Schedule) ? $"{dto.Day1} {dto.Day1Time} - {dto.Day2} {dto.Day2Time}" : dto.Schedule,
            CreatedById = userId
        };

        if (dto.InstructorIds != null && dto.InstructorIds.Any())
        {
            group.Instructors = dto.InstructorIds.Select(id => new CourseGroupInstructor { InstructorId = id }).ToList();
        }

        _context.CourseGroups.Add(group);
        await _context.SaveChangesAsync();

        // Reload to get Instructor Names
        var createdGroup = await _context.CourseGroups
            .Include(g => g.Instructors)
                .ThenInclude(i => i.Instructor)
            .FirstOrDefaultAsync(g => g.Id == group.Id);

        await _auditService.LogAsync(userId, "إضافة جروب", "CourseGroup", group.Id, $"تم إضافة جروب جديد: {group.Name} (Wave: {group.WaveName})");

        return Ok(new CourseGroupResponseDto
        {
            Id = createdGroup!.Id,
            Name = createdGroup.Name,
            WaveName = createdGroup.WaveName,
            Price = createdGroup.Price,
            StartDate = createdGroup.StartDate,
            Capacity = createdGroup.Capacity,
            SubscriptionsCount = 0,
            InstructorIds = createdGroup.Instructors.Select(i => i.InstructorId).ToList(),
            InstructorNames = createdGroup.Instructors.Select(i => i.Instructor.FullName).ToList(),
            GroupCode = createdGroup.GroupCode,
            TotalHours = createdGroup.TotalHours,
            Day1 = createdGroup.Day1,
            Day1Time = createdGroup.Day1Time,
            Day2 = createdGroup.Day2,
            Day2Time = createdGroup.Day2Time,
            Schedule = createdGroup.Schedule
        });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Coordinator")]
    public async Task<IActionResult> UpdateGroup(int id, [FromBody] CreateCourseGroupDto dto)
    {
        var group = await _context.CourseGroups.Include(g => g.Instructors).FirstOrDefaultAsync(g => g.Id == id);
        if (group == null) return NotFound();

        group.Name = dto.Name;
        group.WaveName = dto.WaveName;
        group.Price = dto.Price;
        group.StartDate = dto.StartDate;
        group.Capacity = dto.Capacity;
        group.GroupCode = dto.GroupCode;
        group.TotalHours = dto.TotalHours;
        group.Day1 = dto.Day1;
        group.Day1Time = dto.Day1Time;
        group.Day2 = dto.Day2;
        group.Day2Time = dto.Day2Time;
        group.Schedule = string.IsNullOrEmpty(dto.Schedule) ? $"{dto.Day1} {dto.Day1Time} - {dto.Day2} {dto.Day2Time}" : dto.Schedule;

        // Update Instructors
        _context.CourseGroupInstructors.RemoveRange(group.Instructors);
        if (dto.InstructorIds != null && dto.InstructorIds.Any())
        {
            group.Instructors = dto.InstructorIds.Select(iid => new CourseGroupInstructor { InstructorId = iid }).ToList();
        }

        await _context.SaveChangesAsync();

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
        await _auditService.LogAsync(userId, "تعديل جروب", "CourseGroup", id, $"تم تعديل الجروب: {group.Name}");

        // Return updated group as DTO
        var updated = await _context.CourseGroups
            .Include(g => g.Instructors).ThenInclude(i => i.Instructor)
            .Include(g => g.Subscriptions)
            .FirstOrDefaultAsync(g => g.Id == id);

        return Ok(new CourseGroupResponseDto
        {
            Id = updated!.Id,
            Name = updated.Name,
            WaveName = updated.WaveName,
            Price = updated.Price,
            StartDate = updated.StartDate,
            Capacity = updated.Capacity,
            SubscriptionsCount = updated.Subscriptions.Count,
            InstructorIds = updated.Instructors.Select(i => i.InstructorId).ToList(),
            InstructorNames = updated.Instructors.Select(i => i.Instructor.FullName).ToList(),
            GroupCode = updated.GroupCode,
            TotalHours = updated.TotalHours,
            Day1 = updated.Day1,
            Day1Time = updated.Day1Time,
            Day2 = updated.Day2,
            Day2Time = updated.Day2Time,
            Schedule = updated.Schedule
        });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Coordinator")]
    public async Task<IActionResult> DeleteGroup(int id)
    {
        var group = await _context.CourseGroups.Include(g => g.Subscriptions).FirstOrDefaultAsync(g => g.Id == id);
        if (group == null) return NotFound();

        if (group.Subscriptions.Any())
            return BadRequest(new { message = "لا يمكن حذف الجروب لأنه يحتوي على اشتراكات نشطة" });

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
        
        _context.CourseGroups.Remove(group);
        await _context.SaveChangesAsync();

        await _auditService.LogAsync(userId, "حذف جروب", "CourseGroup", id, $"تم حذف الجروب: {group.Name}");

        return NoContent();
    }
}
