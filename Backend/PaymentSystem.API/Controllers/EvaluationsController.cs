using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PaymentSystem.API.Data;
using PaymentSystem.API.DTOs;
using PaymentSystem.API.Models;
using System.Security.Claims;

namespace PaymentSystem.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin,Coordinator")]
public class EvaluationsController : ControllerBase
{
    private readonly AppDbContext _context;

    public EvaluationsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<StudentEvaluationResponseDto>>> GetEvaluations([FromQuery] int? studentId, [FromQuery] int? groupId)
    {
        var query = _context.StudentEvaluations
            .Include(e => e.Student)
            .Include(e => e.CourseGroup)
            .Include(e => e.Evaluator)
            .AsQueryable();

        if (studentId.HasValue) query = query.Where(e => e.StudentId == studentId.Value);
        if (groupId.HasValue) query = query.Where(e => e.CourseGroupId == groupId.Value);

        var evaluations = await query
            .OrderByDescending(e => e.CreatedAt)
            .Select(e => new StudentEvaluationResponseDto
            {
                Id = e.Id,
                StudentId = e.StudentId,
                StudentName = e.Student.Name,
                CourseGroupId = e.CourseGroupId,
                CourseGroupName = e.CourseGroup.Name,
                EvaluatorName = e.Evaluator.FullName,
                Score = e.Score,
                TaskScore = e.TaskScore,
                AttitudeScore = e.AttitudeScore,
                Notes = e.Notes,
                CreatedAt = e.CreatedAt
            })
            .ToListAsync();

        return Ok(evaluations);
    }

    [HttpPost]
    public async Task<ActionResult<StudentEvaluationResponseDto>> CreateEvaluation([FromBody] CreateStudentEvaluationDto dto)
    {
        var evaluatorId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
        
        var evaluation = new StudentEvaluation
        {
            StudentId = dto.StudentId,
            CourseGroupId = dto.CourseGroupId,
            EvaluatorId = evaluatorId,
            Score = dto.Score,
            TaskScore = dto.TaskScore,
            AttitudeScore = dto.AttitudeScore,
            Notes = dto.Notes ?? "",
            CreatedAt = DateTime.UtcNow
        };

        _context.StudentEvaluations.Add(evaluation);
        await _context.SaveChangesAsync();

        // Load names for response
        var result = await _context.StudentEvaluations
            .Include(e => e.Student)
            .Include(e => e.CourseGroup)
            .Include(e => e.Evaluator)
            .FirstOrDefaultAsync(e => e.Id == evaluation.Id);

        if (result == null) return NotFound();

        return Ok(new StudentEvaluationResponseDto
        {
            Id = result.Id,
            StudentId = result.StudentId,
            StudentName = result.Student.Name,
            CourseGroupId = result.CourseGroupId,
            CourseGroupName = result.CourseGroup.Name,
            EvaluatorName = result.Evaluator.FullName,
            Score = result.Score,
            TaskScore = result.TaskScore,
            AttitudeScore = result.AttitudeScore,
            Notes = result.Notes,
            CreatedAt = result.CreatedAt
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteEvaluation(int id)
    {
        var evaluation = await _context.StudentEvaluations.FindAsync(id);
        if (evaluation == null) return NotFound();

        _context.StudentEvaluations.Remove(evaluation);
        await _context.SaveChangesAsync();

        return Ok(new { message = "تم حذف التقييم بنجاح" });
    }
}
