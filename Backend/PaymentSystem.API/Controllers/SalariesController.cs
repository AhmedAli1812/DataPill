using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PaymentSystem.API.Data;
using PaymentSystem.API.Models;
using PaymentSystem.API.Services;

namespace PaymentSystem.API.Controllers
{
    [Authorize(Roles = "Admin,Accountant")]
    [Route("api/[controller]")]
    [ApiController]
    public class SalariesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IAuditService _auditService;

        public SalariesController(AppDbContext context, IAuditService auditService)
        {
            _context = context;
            _auditService = auditService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Salary>>> GetSalaries(int? month, int? year)
        {
            var query = _context.Salaries.AsQueryable();

            if (month.HasValue)
                query = query.Where(s => s.Month == month.Value);
            
            if (year.HasValue)
                query = query.Where(s => s.Year == year.Value);

            return await query.OrderByDescending(s => s.CreatedAt).ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<Salary>> PostSalary(Salary salary)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            salary.CreatedById = userId;
            salary.CreatedAt = DateTime.UtcNow;

            _context.Salaries.Add(salary);
            await _context.SaveChangesAsync();

            // If this is an instructor salary, mark sessions as paid
            if (!string.IsNullOrEmpty(salary.RecipientId))
            {
                var unpaidSessions = await _context.InstructorSessions
                    .Where(s => s.InstructorId == salary.RecipientId && !s.IsPaid)
                    .ToListAsync();
                
                foreach (var session in unpaidSessions)
                {
                    session.IsPaid = true;
                    session.SalaryId = salary.Id;
                }
                await _context.SaveChangesAsync();
            }

            await _auditService.LogAsync(userId, "إضافة راتب", "Salary", salary.Id, $"تم تسجيل راتب للموظف: {salary.EmployeeName} عن شهر {salary.Month}/{salary.Year} بقيمة صافي {salary.NetSalary}");

            return CreatedAtAction("GetSalaries", new { id = salary.Id }, salary);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSalary(int id)
        {
            var salary = await _context.Salaries.FindAsync(id);
            if (salary == null) return NotFound();

            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            _context.Salaries.Remove(salary);
            await _context.SaveChangesAsync();

            await _auditService.LogAsync(userId, "حذف راتب", "Salary", id, $"تم حذف سجل راتب الموظف: {salary.EmployeeName}");

            return NoContent();
        }
    }
}
