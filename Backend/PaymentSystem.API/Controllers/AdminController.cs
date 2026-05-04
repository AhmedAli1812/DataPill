using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PaymentSystem.API.Data;
using PaymentSystem.API.Models;
using System.Security.Claims;

namespace PaymentSystem.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class AdminController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly AppDbContext _context;

    public AdminController(UserManager<ApplicationUser> userManager, AppDbContext context)
    {
        _userManager = userManager;
        _context = context;
    }

    [HttpGet("stats")]
    [Authorize(Roles = "Admin,Sales,Accountant,Instructor,Mentor,Coordinator")]
    public async Task<IActionResult> GetStats()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isSales = User.IsInRole("Sales");

        IQueryable<Student> studentsQuery = _context.Students.Where(s => !s.IsDeleted);
        IQueryable<CourseSubscription> subsQuery = _context.CourseSubscriptions;
        IQueryable<Payment> paymentsQuery = _context.Payments;
        IQueryable<Expense> expensesQuery = _context.Expenses;

        if (isSales)
        {
            studentsQuery = studentsQuery.Where(s => s.CreatedById == userId);
            subsQuery = subsQuery.Where(cs => cs.CreatedById == userId);
            paymentsQuery = paymentsQuery.Where(p => p.CreatedById == userId);
            expensesQuery = expensesQuery.Where(e => e.CreatedById == userId);
        }

        var totalStudents = await studentsQuery.CountAsync();
        var totalSubscriptions = await subsQuery.CountAsync();
        var totalRevenue = await paymentsQuery.SumAsync(p => p.Amount);
        var totalExpenses = await expensesQuery.SumAsync(e => e.Amount);
        var netProfit = totalRevenue - totalExpenses;
        
        var totalExpected = await subsQuery.SumAsync(c => c.TotalPrice);
        var totalPending = totalExpected - totalRevenue;

        // Employee count remains overall for stats context, or filter if preferred? 
        // User requested "only see students and subs he registered". 
        // Employee count is more of a global stat, but let's keep it global unless asked.
        var allUsers = await _userManager.Users.ToListAsync();
        var totalEmployeesCount = 0;
        foreach(var user in allUsers)
        {
            if (!await _userManager.IsInRoleAsync(user, "Admin"))
            {
                totalEmployeesCount++;
            }
        }

        var recent = await subsQuery
            .Include(c => c.Student)
            .OrderByDescending(c => c.CreatedAt)
            .Take(10)
            .Select(c => new {
                c.Id,
                StudentName = c.Student.Name,
                c.CourseName,
                c.TotalPrice,
                TotalPaid = _context.Payments.Where(p => p.CourseSubscriptionId == c.Id).Sum(p => p.Amount),
                Remaining = c.TotalPrice - _context.Payments.Where(p => p.CourseSubscriptionId == c.Id).Sum(p => p.Amount),
                Status = _context.Payments.Where(p => p.CourseSubscriptionId == c.Id).Sum(p => p.Amount) >= c.TotalPrice ? "Paid بالكامل" : "متبقي"
            })
            .ToListAsync();

        return Ok(new
        {
            TotalStudents = totalStudents,
            TotalSubscriptions = totalSubscriptions,
            TotalRevenue = totalRevenue,
            TotalExpenses = totalExpenses,
            NetProfit = netProfit,
            TotalPending = totalPending > 0 ? totalPending : 0,
            SalesUsersCount = totalEmployeesCount,
            RecentSubscriptions = recent
        });
    }

    [HttpGet("users")]
    [Authorize(Roles = "Admin,Accountant,Coordinator")]
    public async Task<IActionResult> GetAllEmployees()
    {
        var users = await _userManager.Users.ToListAsync();
        var result = new List<object>();

        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            if (!roles.Contains("Admin")) 
            {
                result.Add(new
                {
                    user.Id,
                    user.FullName,
                    user.Email,
                    user.HourlyRate,
                    Role = roles.FirstOrDefault()
                });
            }
        }

        return Ok(result);
    }

    [HttpPost("users")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserDto dto)
    {
        var userExists = await _userManager.FindByEmailAsync(dto.Email);
        if (userExists != null)
            return BadRequest(new { Message = "User already exists!" });

        var user = new ApplicationUser
        {
            Email = dto.Email,
            SecurityStamp = Guid.NewGuid().ToString(),
            UserName = dto.Email,
            FullName = dto.FullName,
            HourlyRate = dto.HourlyRate
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return BadRequest(new { Message = $"فشلت إضافة المستخدم: {errors}" });
        }

        var role = string.IsNullOrEmpty(dto.Role) ? "Sales" : dto.Role;
        await _userManager.AddToRoleAsync(user, role);

        return Ok(new { Message = "User created successfully!" });
    }

    [HttpPut("users/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateUser(string id, [FromBody] UpdateUserDto dto)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound();

        user.FullName = dto.FullName;
        user.HourlyRate = dto.HourlyRate;
        
        if (!string.IsNullOrEmpty(dto.Email) && user.Email != dto.Email)
        {
            user.Email = dto.Email;
            user.UserName = dto.Email;
        }

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded) return BadRequest(result.Errors);

        if (!string.IsNullOrEmpty(dto.Role))
        {
            var currentRoles = await _userManager.GetRolesAsync(user);
            await _userManager.RemoveFromRolesAsync(user, currentRoles);
            await _userManager.AddToRoleAsync(user, dto.Role);
        }

        if (!string.IsNullOrEmpty(dto.Password))
        {
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            await _userManager.ResetPasswordAsync(user, token, dto.Password);
        }

        return Ok(new { Message = "User updated successfully!" });
    }

    [HttpDelete("users/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteUser(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
            return NotFound();

        await _userManager.DeleteAsync(user);
        return Ok(new { Message = "User deleted successfully!" });
    }

    [HttpGet("performance")]
    [Authorize(Roles = "Admin,Accountant")]
    public async Task<IActionResult> GetPerformance()
    {
        var salesUsers = await _userManager.GetUsersInRoleAsync("Sales");
        
        var performance = new List<object>();

        foreach (var user in salesUsers)
        {
            var userSubscriptions = await _context.CourseSubscriptions
                .Where(cs => cs.CreatedById == user.Id)
                .ToListAsync();

            var totalSubscriptions = userSubscriptions.Count;
            var totalRevenue = await _context.Payments
                .Where(p => p.CreatedById == user.Id)
                .SumAsync(p => p.Amount);

            var totalExpected = userSubscriptions.Sum(cs => cs.TotalPrice);
            var totalPending = totalExpected - await _context.Payments
                .Where(p => userSubscriptions.Select(cs => cs.Id).Contains(p.CourseSubscriptionId))
                .SumAsync(p => p.Amount);

            performance.Add(new
            {
                user.Id,
                user.FullName,
                user.Email,
                TotalSubscriptions = totalSubscriptions,
                TotalRevenue = totalRevenue,
                TotalPending = Math.Max(0, totalPending)
            });
        }

        return Ok(performance);
    }

    [HttpGet("financial-trends")]
    [Authorize(Roles = "Admin,Accountant,Instructor,Mentor")]
    public async Task<IActionResult> GetFinancialTrends()
    {
        var sixMonthsAgo = DateTime.UtcNow.AddMonths(-6);
        
        var incomeData = await _context.Payments
            .Where(p => p.CreatedAt >= sixMonthsAgo)
            .GroupBy(p => new { p.CreatedAt.Year, p.CreatedAt.Month })
            .Select(g => new
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                Income = g.Sum(p => p.Amount)
            })
            .ToListAsync();

        var expenseData = await _context.Expenses
            .Where(e => e.CreatedAt >= sixMonthsAgo)
            .GroupBy(e => new { e.CreatedAt.Year, e.CreatedAt.Month })
            .Select(g => new
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                Expenses = g.Sum(e => e.Amount)
            })
            .ToListAsync();

        var trends = new List<object>();
        for (int i = 5; i >= 0; i--)
        {
            var date = DateTime.UtcNow.AddMonths(-i);
            var month = date.Month;
            var year = date.Year;

            var monthIncome = incomeData.FirstOrDefault(d => d.Month == month && d.Year == year)?.Income ?? 0;
            var monthExpense = expenseData.FirstOrDefault(d => d.Month == month && d.Year == year)?.Expenses ?? 0;

            trends.Add(new
            {
                Month = date.ToString("MMMM", new System.Globalization.CultureInfo("ar-EG")),
                MonthEn = date.ToString("MMMM", new System.Globalization.CultureInfo("en-US")),
                Income = monthIncome,
                Expenses = monthExpense
            });
        }

        return Ok(trends);
    }

    [HttpGet("users/{userId}/audit")]
    [Authorize(Roles = "Admin,Accountant")]
    public async Task<IActionResult> GetAuditLogs(string userId)
    {
        var logs = await _context.AuditLogs
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.Timestamp)
            .Take(50)
            .Select(a => new
            {
                a.Id,
                a.Action,
                a.EntityName,
                a.Details,
                a.Timestamp
            })
            .ToListAsync();

        return Ok(logs);
    }
}

public class CreateUserDto
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Role { get; set; } = "Sales";
    public decimal HourlyRate { get; set; }
}

public class UpdateUserDto
{
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Password { get; set; }
    public string? Role { get; set; }
    public decimal HourlyRate { get; set; }
}
