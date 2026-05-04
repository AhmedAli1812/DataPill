using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PaymentSystem.API.Data;
using PaymentSystem.API.Models;
using ClosedXML.Excel;
using System.IO;

namespace PaymentSystem.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin,Accountant,Instructor,Mentor")]
public class ReportsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ReportsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("monthly")]
    public async Task<IActionResult> GetMonthlyReport([FromQuery] int? month, [FromQuery] int? year)
    {
        try
        {
            IQueryable<Payment> paymentsQuery = _context.Payments;
            IQueryable<Expense> expensesQuery = _context.Expenses;
            IQueryable<Salary> salariesQuery = _context.Salaries;

            if (month.HasValue && year.HasValue)
            {
                var startDate = new DateTime(year.Value, month.Value, 1);
                var endDate = startDate.AddMonths(1).AddDays(-1);

                paymentsQuery = paymentsQuery.Where(p => p.PaymentDate >= startDate && p.PaymentDate <= endDate);
                expensesQuery = expensesQuery.Where(e => e.Date >= startDate && e.Date <= endDate);
                salariesQuery = salariesQuery.Where(s => s.Month == month.Value && s.Year == year.Value);
            }

            var income = await paymentsQuery.SumAsync(p => p.Amount);
            var expenses = await expensesQuery.SumAsync(e => e.Amount);
            var salaries = await salariesQuery.SumAsync(s => s.BaseSalary + s.Bonus - s.Deductions);

            var categoriesQuery = expensesQuery
                .GroupBy(e => e.Category)
                .Select(g => new { Category = g.Key, Amount = g.Sum(e => e.Amount) });

            var categories = await categoriesQuery.ToListAsync();

            return Ok(new
            {
                Month = month,
                Year = year,
                TotalIncome = income,
                TotalExpenses = expenses + salaries,
                TotalSalaries = salaries,
                NetProfit = income - (expenses + salaries),
                ExpenseBreakdown = categories
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message, Trace = ex.StackTrace });
        }
    }

    [HttpGet("export")]
    public async Task<IActionResult> ExportReport([FromQuery] string format, [FromQuery] int month, [FromQuery] int year)
    {
        try
        {
            var startDate = new DateTime(year, month, 1);
            var endDate = startDate.AddMonths(1).AddDays(-1);

            if (format.ToLower() == "excel")
            {
                using (var workbook = new XLWorkbook())
                {
                    var sheet = workbook.Worksheets.Add("Financial Report");
                    sheet.RightToLeft = true;

                    sheet.Cell(1, 1).Value = $"التقرير المالي لشهر {month}/{year}";
                    sheet.Range(1, 1, 1, 4).Merge().Style.Font.SetBold().Font.SetFontSize(16);

                    // Headers
                    sheet.Cell(3, 1).Value = "التاريخ";
                    sheet.Cell(3, 2).Value = "النوع";
                    sheet.Cell(3, 3).Value = "التفاصيل";
                    sheet.Cell(3, 4).Value = "المبلغ";
                    sheet.Range(3, 1, 3, 4).Style.Fill.SetBackgroundColor(XLColor.LightGray).Font.SetBold();

                    var row = 4;

                    // Income
                    var payments = await _context.Payments
                        .Include(p => p.CourseSubscription.Student)
                        .Where(p => p.PaymentDate >= startDate && p.PaymentDate <= endDate)
                        .ToListAsync();

                    foreach (var p in payments)
                    {
                        sheet.Cell(row, 1).Value = p.PaymentDate.ToShortDateString();
                        sheet.Cell(row, 2).Value = "إيراد (تحصيل)";
                        sheet.Cell(row, 3).Value = $"طالب: {p.CourseSubscription.Student.Name} - {p.CourseSubscription.CourseName}";
                        sheet.Cell(row, 4).Value = p.Amount;
                        sheet.Cell(row, 4).Style.Font.FontColor = XLColor.Green;
                        row++;
                    }

                    // Expenses
                    var expenses = await _context.Expenses
                        .Where(e => e.Date >= startDate && e.Date <= endDate)
                        .ToListAsync();

                    foreach (var e in expenses)
                    {
                        sheet.Cell(row, 1).Value = e.Date.ToShortDateString();
                        sheet.Cell(row, 2).Value = $"مصروف ({e.Category})";
                        sheet.Cell(row, 3).Value = e.Description;
                        sheet.Cell(row, 4).Value = e.Amount;
                        sheet.Cell(row, 4).Style.Font.FontColor = XLColor.Red;
                        row++;
                    }

                    // Salaries
                    var monthlySalaries = await _context.Salaries
                        .Where(s => s.Month == month && s.Year == year)
                        .ToListAsync();

                    foreach (var s in monthlySalaries)
                    {
                        sheet.Cell(row, 1).Value = "-";
                        sheet.Cell(row, 2).Value = "رواتب";
                        sheet.Cell(row, 3).Value = $"راتب: {s.EmployeeName} (أساسي: {s.BaseSalary} + حوافز: {s.Bonus} - خصومات: {s.Deductions})";
                        sheet.Cell(row, 4).Value = s.NetSalary;
                        sheet.Cell(row, 4).Style.Font.FontColor = XLColor.Red;
                        row++;
                    }

                    // Summary
                    row++;
                    sheet.Cell(row, 3).Value = "إجمالي الإيرادات:";
                    sheet.Cell(row, 4).Value = payments.Sum(p => p.Amount);
                    row++;
                    sheet.Cell(row, 3).Value = "إجمالي المصاريف والرواتب:";
                    sheet.Cell(row, 4).Value = expenses.Sum(e => e.Amount) + monthlySalaries.Sum(s => s.BaseSalary + s.Bonus - s.Deductions);
                    row++;
                    sheet.Cell(row, 3).Value = "صافي الربح:";
                    sheet.Cell(row, 4).Value = payments.Sum(p => p.Amount) - (expenses.Sum(e => e.Amount) + monthlySalaries.Sum(s => s.BaseSalary + s.Bonus - s.Deductions));
                    sheet.Cell(row, 4).Style.Font.SetBold().Fill.SetBackgroundColor(XLColor.Yellow);

                    sheet.Columns().AdjustToContents();

                    using (var stream = new MemoryStream())
                    {
                        workbook.SaveAs(stream);
                        var content = stream.ToArray();
                        return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"Report_{month}_{year}.xlsx");
                    }
                }
            }

            return BadRequest("Unsupported format. Use 'excel'.");
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message, Inner = ex.InnerException?.Message });
        }
    }
}
