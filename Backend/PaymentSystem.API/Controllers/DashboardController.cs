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
[Authorize(Roles = "Admin,Sales,Accountant,Instructor,Mentor,Coordinator")]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _context;

    public DashboardController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<DashboardDto>> GetDashboard()
    {
        var userId = User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier);
        var isSales = User.IsInRole("Sales");

        IQueryable<Payment> paymentsQuery = _context.Payments;
        IQueryable<Student> studentsQuery = _context.Students.Where(s => !s.IsDeleted);
        IQueryable<CourseSubscription> subscriptionsQuery = _context.CourseSubscriptions;

        if (isSales)
        {
            paymentsQuery = paymentsQuery.Where(p => p.CreatedById == userId);
            studentsQuery = studentsQuery.Where(s => s.CreatedById == userId);
            subscriptionsQuery = subscriptionsQuery.Where(cs => cs.CreatedById == userId);
        }

        var totalRevenue = await paymentsQuery.SumAsync(p => (decimal?)p.Amount) ?? 0;
        var totalStudents = await studentsQuery.CountAsync();
        var totalSubscriptions = await subscriptionsQuery.CountAsync();

        // Pending = subscriptions where total paid < total price
        var pendingPayments = await subscriptionsQuery
            .Include(cs => cs.Payments)
            .Where(cs => cs.Payments.Sum(p => p.Amount) < cs.TotalPrice)
            .CountAsync();

        // Recent subscriptions with outstanding balance
        var recentSubscriptions = await subscriptionsQuery
            .Include(cs => cs.Student)
            .Include(cs => cs.Payments)
            .OrderByDescending(cs => cs.CreatedAt)
            .Take(10)
            .Select(cs => new SubscriptionResponseDto
            {
                Id = cs.Id,
                StudentId = cs.StudentId,
                StudentName = cs.Student.Name,
                StudentPhone = cs.Student.Phone,
                CourseName = cs.CourseName,
                TotalPrice = cs.TotalPrice,
                StartDate = cs.StartDate,
                CreatedAt = cs.CreatedAt,
                TotalPaid = cs.Payments.Sum(p => p.Amount),
                Remaining = cs.TotalPrice - cs.Payments.Sum(p => p.Amount),
                Status = cs.Payments.Sum(p => p.Amount) >= cs.TotalPrice ? "Paid بالكامل" : "متبقي"
            })
            .ToListAsync();

        foreach (var sub in recentSubscriptions)
            sub.Remaining = Math.Max(0, sub.Remaining);

        return Ok(new DashboardDto
        {
            TotalRevenue = totalRevenue,
            TotalStudents = totalStudents,
            TotalSubscriptions = totalSubscriptions,
            PendingPayments = pendingPayments,
            RecentSubscriptions = recentSubscriptions
        });
    }
}
