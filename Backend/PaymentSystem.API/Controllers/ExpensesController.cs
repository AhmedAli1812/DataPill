using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PaymentSystem.API.Data;
using PaymentSystem.API.Models;
using PaymentSystem.API.Services;
using System.Security.Claims;

namespace PaymentSystem.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin,Accountant,Instructor,Mentor")]
public class ExpensesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IAuditService _auditService;

    public ExpensesController(AppDbContext context, IAuditService auditService)
    {
        _context = context;
        _auditService = auditService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Expense>>> GetExpenses()
    {
        return await _context.Expenses
            .OrderByDescending(e => e.Date)
            .ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<Expense>> CreateExpense(CreateExpenseDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
        
        var expense = new Expense
        {
            Description = dto.Description,
            Amount = dto.Amount,
            Category = dto.Category,
            Date = dto.Date,
            PaymentMethod = dto.PaymentMethod,
            Vendor = dto.Vendor,
            CreatedById = userId
        };

        _context.Expenses.Add(expense);
        await _context.SaveChangesAsync();

        await _auditService.LogAsync(userId, "إضافة مصروف", "Expense", expense.Id, $"تم تسجيل مصروف: {expense.Description} بقيمة {expense.Amount}");

        return CreatedAtAction(nameof(GetExpenses), new { id = expense.Id }, expense);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteExpense(int id)
    {
        var expense = await _context.Expenses.FindAsync(id);
        if (expense == null) return NotFound();

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
        
        _context.Expenses.Remove(expense);
        await _context.SaveChangesAsync();

        await _auditService.LogAsync(userId, "حذف مصروف", "Expense", id, $"تم حذف مصروف: {expense.Description}");

        return NoContent();
    }
}

public class CreateExpenseDto
{
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Category { get; set; } = "Other";
    public DateTime Date { get; set; }
    public string PaymentMethod { get; set; } = "Cash";
    public string Vendor { get; set; } = string.Empty;
}
