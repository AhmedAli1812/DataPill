using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PaymentSystem.API.Models
{
    public class Salary
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string EmployeeName { get; set; } = string.Empty;

        public int Month { get; set; }
        public int Year { get; set; }
        public decimal BaseSalary { get; set; }
        public decimal Bonus { get; set; }
        public decimal Deductions { get; set; }

        [NotMapped]
        public decimal NetSalary => BaseSalary + Bonus - Deductions;

        [MaxLength(1000)]
        public string Note { get; set; } = string.Empty;

        [MaxLength(450)]
        public string? RecipientId { get; set; }
        public ApplicationUser? Recipient { get; set; }

        [MaxLength(450)]
        public string? CreatedById { get; set; }
        public ApplicationUser? CreatedBy { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
