using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PaymentSystem.API.Data;
using PaymentSystem.API.DTOs;
using System.Security.Claims;

namespace PaymentSystem.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin,Sales,Accountant,Instructor,Mentor")]
public class RemindersController : ControllerBase
{
    private readonly AppDbContext _context;

    public RemindersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("pending")]
    public async Task<ActionResult> GetPendingPayments()
    {
        var userId = User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier);
        var isSales = User.IsInRole("Sales");

        var query = _context.CourseSubscriptions
            .Include(cs => cs.Student)
            .Include(cs => cs.Payments)
            .AsQueryable();

        if (isSales)
        {
            query = query.Where(cs => cs.CreatedById == userId);
        }

        var pending = await query
            .Select(cs => new
            {
                cs.Id,
                StudentName = cs.Student.Name,
                StudentPhone = cs.Student.Phone,
                cs.CourseName,
                cs.TotalPrice,
                TotalPaid = cs.Payments.Sum(p => p.Amount),
                Remaining = cs.TotalPrice - cs.Payments.Sum(p => p.Amount),
                cs.StartDate
            })
            .Where(x => x.Remaining > 0)
            .OrderByDescending(x => x.Remaining)
            .ToListAsync();

        return Ok(pending);
    }
}
